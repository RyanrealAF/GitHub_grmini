import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Octokit } from '@octokit/rest';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set your Gemini API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getOctokit(tokenHeader?: string): Octokit {
  const token = tokenHeader || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GitHub Personal Access Token (PAT) is required to perform GitHub operations.');
  }
  return new Octokit({ auth: token });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasDefaultGithubToken: Boolean(process.env.GITHUB_TOKEN),
    });
  });

  // Validate GitHub Token & Get User Profile
  app.get('/api/github/validate', async (req, res) => {
    try {
      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      if (!token) {
        return res.status(401).json({ error: 'No GitHub token provided.' });
      }
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.users.getAuthenticated();
      res.json({
        valid: true,
        user: {
          login: user.login,
          id: user.id,
          avatar_url: user.avatar_url,
          name: user.name,
          public_repos: user.public_repos,
          total_private_repos: user.total_private_repos,
          html_url: user.html_url,
        },
      });
    } catch (err: any) {
      console.error('GitHub validate error:', err);
      res.status(400).json({
        valid: false,
        error: err.message || 'Failed to authenticate with GitHub token.',
      });
    }
  });

  // List Repositories
  app.get('/api/github/repos', async (req, res) => {
    try {
      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      const octokit = getOctokit(token);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
        type: 'all',
      });

      const repos = data.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        owner: {
          login: r.owner.login,
          avatar_url: r.owner.avatar_url,
        },
        private: r.private,
        html_url: r.html_url,
        description: r.description,
        default_branch: r.default_branch,
        language: r.language,
        stargazers_count: r.stargazers_count,
        updated_at: r.updated_at,
      }));

      res.json({ repos });
    } catch (err: any) {
      console.error('GitHub list repos error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch repositories' });
    }
  });

  // Get Single Repo Details & Branches
  app.get('/api/github/repo-details', async (req, res) => {
    try {
      const { owner, repo } = req.query;
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo query parameters are required.' });
      }
      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      const octokit = getOctokit(token);

      const [repoRes, branchesRes] = await Promise.all([
        octokit.repos.get({ owner: String(owner), repo: String(repo) }),
        octokit.repos.listBranches({ owner: String(owner), repo: String(repo), per_page: 100 }),
      ]);

      res.json({
        repo: {
          id: repoRes.data.id,
          name: repoRes.data.name,
          full_name: repoRes.data.full_name,
          owner: {
            login: repoRes.data.owner.login,
            avatar_url: repoRes.data.owner.avatar_url,
          },
          private: repoRes.data.private,
          html_url: repoRes.data.html_url,
          description: repoRes.data.description,
          default_branch: repoRes.data.default_branch,
          language: repoRes.data.language,
          stargazers_count: repoRes.data.stargazers_count,
          updated_at: repoRes.data.updated_at,
        },
        branches: branchesRes.data.map((b) => ({
          name: b.name,
          commitSha: b.commit.sha,
          protected: b.protected,
        })),
      });
    } catch (err: any) {
      console.error('GitHub repo details error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch repo details' });
    }
  });

  // Get File Tree of Repo
  app.get('/api/github/tree', async (req, res) => {
    try {
      const { owner, repo, ref } = req.query;
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required.' });
      }
      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      const octokit = getOctokit(token);

      // Get branch / ref commit SHA
      const targetRef = ref ? String(ref) : undefined;
      let treeSha: string;

      if (!targetRef) {
        const repoInfo = await octokit.repos.get({ owner: String(owner), repo: String(repo) });
        const defaultBranch = repoInfo.data.default_branch;
        const branchRes = await octokit.repos.getBranch({ owner: String(owner), repo: String(repo), branch: defaultBranch });
        treeSha = branchRes.data.commit.sha;
      } else {
        const branchRes = await octokit.repos.getBranch({ owner: String(owner), repo: String(repo), branch: targetRef });
        treeSha = branchRes.data.commit.sha;
      }

      const { data: treeData } = await octokit.git.getTree({
        owner: String(owner),
        repo: String(repo),
        tree_sha: treeSha,
        recursive: '1',
      });

      // Filter out node_modules, .git, etc. if present
      const cleanTree = treeData.tree.filter((item) => {
        if (!item.path) return false;
        if (item.path.startsWith('node_modules/') || item.path.includes('/node_modules/')) return false;
        if (item.path.startsWith('.git/') || item.path.includes('/.git/')) return false;
        return true;
      });

      res.json({
        treeSha: treeData.sha,
        truncated: treeData.truncated,
        items: cleanTree,
      });
    } catch (err: any) {
      console.error('GitHub tree error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch repo tree' });
    }
  });

  // Get File Content
  app.get('/api/github/file', async (req, res) => {
    try {
      const { owner, repo, path: filePath, ref } = req.query;
      if (!owner || !repo || !filePath) {
        return res.status(400).json({ error: 'owner, repo, and path are required' });
      }
      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      const octokit = getOctokit(token);

      const { data } = await octokit.repos.getContent({
        owner: String(owner),
        repo: String(repo),
        path: String(filePath),
        ref: ref ? String(ref) : undefined,
      });

      if (Array.isArray(data) || data.type !== 'file' || !data.content) {
        return res.status(400).json({ error: 'The requested path is not a file or has no content' });
      }

      const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');

      res.json({
        name: data.name,
        path: data.path,
        sha: data.sha,
        size: data.size,
        content: decodedContent,
        encoding: data.encoding,
        html_url: data.html_url,
      });
    } catch (err: any) {
      console.error('GitHub get file error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch file content' });
    }
  });

  // Transform Code with Gemini
  app.post('/api/gemini/transform', async (req, res) => {
    try {
      const { code, filePath, instructions, model = 'gemini-3.1-pro-preview', thinking = true, repoContext } = req.body;
      if (!code && code !== '') {
        return res.status(400).json({ error: 'Source code is required' });
      }
      if (!instructions) {
        return res.status(400).json({ error: 'Transformation instructions are required' });
      }

      const customApiKey = req.headers['x-gemini-key'] as string;
      const ai = getGeminiClient(customApiKey);

      // Model mapping & Thinking config
      let selectedModel = String(model);
      if (selectedModel === 'gemini-2.5-pro') {
        selectedModel = 'gemini-3.1-pro-preview';
      }

      const systemInstruction = `You are a Lead Systems Architect and Principal Software Engineer specializing in automated code transformations and Git repository workflows.
Your job is to transform the provided source code based strictly on the user's instructions while preserving existing business logic, structure, coding conventions, and formatting where unmodified.

CRITICAL INSTRUCTIONS:
1. modifiedCode: Provide the COMPLETE, turnkey, production-ready modified source file code. Do NOT truncate, do NOT use placeholders like "// ...rest of code remains unchanged", and do NOT wrap the code in markdown backticks inside this field.
2. explanation: A concise, technical explanation of all architectural and logical modifications made.
3. commitMessage: A crisp Git commit message following the Conventional Commits specification (e.g., "feat(auth): implement JWT token verification with refresh rotation").
4. prTitle: An expressive Pull Request title.
5. prBody: A comprehensive, beautifully formatted Markdown Pull Request description outlining Summary, Key Changes, Edge Cases Handled, and Test Verification notes.`;

      const userPrompt = `TARGET FILE PATH: ${filePath || 'file'}
${repoContext ? `REPOSITORY CONTEXT: ${repoContext.owner}/${repoContext.repo} on branch '${repoContext.branch}'` : ''}

TRANSFORMATION INSTRUCTIONS:
${instructions}

ORIGINAL SOURCE CODE:
\`\`\`
${code}
\`\`\`

Generate the updated source code adhering strictly to the structured response.`;

      const config: any = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modifiedCode: {
              type: Type.STRING,
              description: 'The complete transformed source code for the file without markdown code fences.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Technical summary of the changes made.',
            },
            commitMessage: {
              type: Type.STRING,
              description: 'Conventional commit message for this change.',
            },
            prTitle: {
              type: Type.STRING,
              description: 'Clear, informative Pull Request title.',
            },
            prBody: {
              type: Type.STRING,
              description: 'Markdown formatted Pull Request description.',
            },
          },
          required: ['modifiedCode', 'explanation', 'commitMessage', 'prTitle', 'prBody'],
        },
      };

      if (thinking && selectedModel.startsWith('gemini-3')) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: userPrompt,
        config,
      });

      const rawText = response.text || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        // Fallback cleanup if model wrapped JSON in fences
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        parsed = JSON.parse(cleaned);
      }

      // If modifiedCode accidentally has markdown code blocks, strip them
      if (parsed.modifiedCode) {
        parsed.modifiedCode = parsed.modifiedCode
          .replace(/^```[a-zA-Z0-9_-]*\n/, '')
          .replace(/\n```$/, '');
      }

      res.json({
        modifiedCode: parsed.modifiedCode || code,
        explanation: parsed.explanation || 'Code modified according to prompt.',
        commitMessage: parsed.commitMessage || `refactor(${filePath}): apply AI transformations`,
        prTitle: parsed.prTitle || `AI: Update ${filePath}`,
        prBody: parsed.prBody || `Automated transformations applied via Gemini model.`,
        modelUsed: selectedModel,
        thinkingUsed: Boolean(thinking && selectedModel.startsWith('gemini-3')),
      });
    } catch (err: any) {
      console.error('Gemini transform error:', err);
      res.status(500).json({ error: err.message || 'Failed to transform code with Gemini' });
    }
  });

  // Multi-Turn Chat Assistant
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, model = 'gemini-3.5-flash', role = 'architect', thinking = false, currentFile } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string;
      const ai = getGeminiClient(customApiKey);

      let roleInstruction = '';
      if (role === 'architect') {
        roleInstruction = 'You are a Principal Software Architect. Help the user design systems, refactor architectures, plan multi-file modifications, and structure clean pull requests.';
      } else if (role === 'security') {
        roleInstruction = 'You are a Senior Application Security Auditor. Audit repository code for vulnerabilities, injection flaws, race conditions, authentication bugs, and OWASP Top 10 risks.';
      } else if (role === 'reviewer') {
        roleInstruction = 'You are a meticulous Code Reviewer. Review diffs, spot edge-case bugs, suggest idiomatic improvements, and enforce best practices.';
      } else {
        roleInstruction = 'You are an AI Coding Assistant specialized in analyzing and transforming GitHub repositories.';
      }

      let systemInstruction = `${roleInstruction}
You have direct context of the active GitHub repository and open file.
When providing code modifications or snippets, be precise and ready to apply.
If recommending an instruction prompt to feed to the automated transform engine, wrap it in a special block or indicate clearly.`;

      if (currentFile) {
        systemInstruction += `\n\nCURRENTLY OPEN FILE IN REPO:\nPath: ${currentFile.path}\n\`\`\`\n${currentFile.content?.slice(0, 15000) || ''}\n\`\`\``;
      }

      let selectedModel = String(model);
      if (selectedModel === 'gemini-2.5-pro') {
        selectedModel = 'gemini-3.1-pro-preview';
      }

      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const config: any = {
        systemInstruction,
      };

      if (thinking && selectedModel.startsWith('gemini-3')) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config,
      });

      res.json({
        text: response.text || '',
        modelUsed: selectedModel,
      });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      res.status(500).json({ error: err.message || 'Failed to get chat response from Gemini' });
    }
  });

  // Execute Git Workflow: Branch Creation -> Commit Blob -> Open Pull Request
  app.post('/api/github/commit-and-pr', async (req, res) => {
    try {
      const {
        owner,
        repo,
        baseBranch,
        newBranchName,
        filePath,
        fileContent,
        fileSha,
        commitMessage,
        prTitle,
        prBody,
      } = req.body;

      if (!owner || !repo || !baseBranch || !newBranchName || !filePath || fileContent === undefined) {
        return res.status(400).json({
          error: 'Missing required parameters (owner, repo, baseBranch, newBranchName, filePath, fileContent).',
        });
      }

      const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_TOKEN;
      const octokit = getOctokit(token);

      // 1. Get base branch latest commit SHA
      console.log(`[Git Workflow] 1. Fetching SHA for branch '${baseBranch}' in ${owner}/${repo}...`);
      const baseRefRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });
      const baseSha = baseRefRes.data.object.sha;

      // 2. Create isolated new branch refs/heads/{newBranchName}
      console.log(`[Git Workflow] 2. Creating branch 'refs/heads/${newBranchName}' pointing to SHA ${baseSha}...`);
      try {
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${newBranchName}`,
          sha: baseSha,
        });
      } catch (branchErr: any) {
        // If branch already exists, we can continue or append timestamp
        if (branchErr.status === 422 || branchErr.message?.includes('Reference already exists')) {
          console.warn(`Branch ${newBranchName} already exists, proceeding to commit on it.`);
        } else {
          throw branchErr;
        }
      }

      // 3. Commit updated file blob (Base64 encoding)
      console.log(`[Git Workflow] 3. Committing updated file '${filePath}' on branch '${newBranchName}'...`);
      const base64Content = Buffer.from(fileContent, 'utf-8').toString('base64');
      
      const commitRes = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: commitMessage || `feat: apply Gemini transformations to ${filePath}`,
        content: base64Content,
        branch: newBranchName,
        sha: fileSha || undefined, // Provide SHA if modifying existing file
      });

      const commitSha = commitRes.data.commit.sha;
      const commitUrl = commitRes.data.commit.html_url;

      // 4. Create Pull Request
      console.log(`[Git Workflow] 4. Opening Pull Request '${prTitle}' (${newBranchName} -> ${baseBranch})...`);
      const prRes = await octokit.pulls.create({
        owner,
        repo,
        title: prTitle || `AI: Transformed ${filePath}`,
        head: newBranchName,
        base: baseBranch,
        body: prBody || `Automated pull request created by Gemini AI Code Orchestrator.`,
      });

      const prNumber = prRes.data.number;
      const prUrl = prRes.data.html_url;
      const branchUrl = `https://github.com/${owner}/${repo}/tree/${newBranchName}`;

      console.log(`[Git Workflow] Workflow Complete! PR #${prNumber} created at: ${prUrl}`);

      res.json({
        success: true,
        branchName: newBranchName,
        branchUrl,
        commitSha,
        commitUrl,
        prNumber,
        prUrl,
        prTitle: prRes.data.title,
        repoFullName: `${owner}/${repo}`,
      });
    } catch (err: any) {
      console.error('Git commit and PR workflow error:', err);
      res.status(500).json({
        error: err.message || 'Failed to complete Git commit and PR workflow',
        details: err.response?.data || undefined,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
