import { Octokit } from '@octokit/rest';
import { GoogleGenAI } from '@google/genai';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-github-token',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const {
        githubToken = env?.GITHUB_TOKEN,
        geminiKey = env?.GEMINI_API_KEY,
        owner,
        repo,
        path,
        prompt,
        branchName,
      } = body;

      if (!githubToken) {
        return new Response(JSON.stringify({ success: false, error: 'Missing GitHub access token (githubToken).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (!geminiKey) {
        return new Response(JSON.stringify({ success: false, error: 'Missing Gemini API key (geminiKey).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (!owner || !repo || !path || !prompt) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required parameters: owner, repo, path, and prompt are required.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      const octokit = new Octokit({ auth: githubToken });
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      // 1. Get default branch & latest commit SHA
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;
      const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
      const baseSha = refData.object.sha;

      // 2. Read target file
      const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
      if (Array.isArray(fileData) || !('content' in fileData)) {
        return new Response(JSON.stringify({ success: false, error: `Path "${path}" is a directory or submodule, not a file.` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Safe base64 decoding
      const cleanBase64 = fileData.content.replace(/\s+/g, '');
      const originalContent = typeof Buffer !== 'undefined'
        ? Buffer.from(cleanBase64, 'base64').toString('utf8')
        : atob(cleanBase64);

      // 3. Process modifications via Gemini
      const systemInstruction = `You are an expert software engineer. Modify the provided code based on the user prompt.
Return ONLY the raw updated code file without markdown formatting, explanations, or code block markers.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `User Prompt: ${prompt}\n\nFile Content:\n${originalContent}`,
        config: { systemInstruction },
      });

      let modifiedContent = aiResponse.text?.trim() || '';
      // Strip markdown code fences if model enclosed them
      modifiedContent = modifiedContent.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '').replace(/\r?\n```$/, '');

      // 4. Create new feature branch
      const sanitizedBranch = (branchName || `gemini-patch-${Date.now()}`)
        .replace(/[^a-zA-Z0-9_.-]/g, '-')
        .replace(/^[.-]+|[.-]+$/g, '');

      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${sanitizedBranch}`,
        sha: baseSha,
      });

      // 5. Update file blob on new branch
      const encodedContent = typeof Buffer !== 'undefined'
        ? Buffer.from(modifiedContent, 'utf8').toString('base64')
        : btoa(unescape(encodeURIComponent(modifiedContent)));

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `refactor(${path}): ${prompt.slice(0, 50)} via Gemini`,
        content: encodedContent,
        sha: fileData.sha,
        branch: sanitizedBranch,
      });

      // 6. Create Pull Request
      const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title: `Gemini Update: ${path}`,
        head: sanitizedBranch,
        base: defaultBranch,
        body: `### 🤖 Automated Gemini Code Transformation\n\n**Target File:** \`${path}\`\n**Prompt:**\n> ${prompt}\n\n---\n*Created automatically via Gemini 2.5 Pro integration.*`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          pullRequestUrl: pr.html_url,
          pullRequestNumber: pr.number,
          branch: sanitizedBranch,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'An unexpected error occurred during execution.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
