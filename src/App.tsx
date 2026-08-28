import React, { useState, useEffect, useCallback } from 'react';
import { FolderTree, Code2, Wand2, Sparkles, GitPullRequest } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { RepoSelector } from './components/RepoSelector';
import { FileTreeViewer } from './components/FileTreeViewer';
import { CodeEditorDiff } from './components/CodeEditorDiff';
import { PromptControlPanel } from './components/PromptControlPanel';
import { ChatAssistantDrawer } from './components/ChatAssistantDrawer';
import { PRResultModal } from './components/PRResultModal';
import { PinLockScreen } from './components/PinLockScreen';
import {
  GitHubUser,
  GitHubRepo,
  RepoTreeItem,
  FileContentResponse,
  GeminiModelId,
  PipelineStep,
  TransformResult,
  CommitAndPRResult,
} from './types';
import {
  SAMPLE_REPO,
  SAMPLE_TREE,
  SAMPLE_FILES,
} from './data/sampleRepos';

const REQUIRED_APP_PIN = '840140';

export default function App() {
  // Security PIN Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('gitgemini_pin_unlocked') === 'true';
  });

  // Authentication & Configuration State
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('gitgemini_github_token') || '';
  });
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(true);

  // Repository & File State
  const [owner, setOwner] = useState('acme-corp');
  const [repo, setRepo] = useState('nexus-backend-service');
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState<{ name: string; commitSha: string; protected?: boolean }[]>([
    { name: 'main', commitSha: 'main-sha-01' },
    { name: 'staging', commitSha: 'staging-sha-02' },
  ]);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>(SAMPLE_TREE);
  const [selectedFilePath, setSelectedFilePath] = useState('src/auth/jwtService.ts');
  const [originalCode, setOriginalCode] = useState(SAMPLE_FILES['src/auth/jwtService.ts'].content);
  const [fileSha, setFileSha] = useState<string | undefined>(SAMPLE_FILES['src/auth/jwtService.ts'].sha);
  const [modifiedCode, setModifiedCode] = useState('');

  // Prompting & Transformation State
  const [instructions, setInstructions] = useState(
    'Refactor this JWT service to support automated token refresh rotation, revoke blacklist validation, and strict error logging.'
  );
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.1-pro-preview');
  const [thinking, setThinking] = useState(true);
  const [branchName, setBranchName] = useState('gemini/feat-jwt-rotation');
  const [commitMessage, setCommitMessage] = useState('feat(auth): add JWT refresh token rotation and error safety');
  const [prTitle, setPrTitle] = useState('AI: Add JWT Refresh Token Rotation & Error Safety');
  const [prBody, setPrBody] = useState(
    '### Summary of Changes\n- Refactored `jwtService.ts` to include refresh token rotation logic.\n- Hardened token verification against null payloads.\n- Powered by Gemini 3.1 Pro code orchestration.'
  );

  // Status & Progress State
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
  const [prResult, setPrResult] = useState<CommitAndPRResult | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [mobileTab, setMobileTab] = useState<'files' | 'editor' | 'prompt'>('editor');

  // Execution Pipeline Steps
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 'sha', label: '1. Fetch Base Branch SHA', description: 'Retrieve latest commit hash', status: 'idle' },
    { id: 'branch', label: '2. Create Isolated Git Branch', description: 'refs/heads/{branch}', status: 'idle' },
    { id: 'blob', label: '3. Commit Transformed File', description: 'Base64 encoded blob', status: 'idle' },
    { id: 'pr', label: '4. Open GitHub Pull Request', description: 'Auto-generate PR metadata', status: 'idle' },
  ]);

  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Validate GitHub Token or auto-connect via server environment on load or update
  const validateToken = useCallback(async (token?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['x-github-token'] = token;
      }
      const res = await fetch('/api/github/validate', { headers });
      const data = await res.json();
      if (res.ok && data.valid && data.user) {
        setGithubUser(data.user);
        setIsDemoMode(false);
        showToast(`Authenticated as GitHub user @${data.user.login}`, 'success');
        // Fetch user repos and auto-select primary repo
        loadUserRepos(token);
      } else {
        if (token) {
          setGithubUser(null);
          showToast(data.error || 'Invalid GitHub token', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (token) {
        setGithubUser(null);
      }
    }
  }, []);

  const loadUserRepos = async (token?: string) => {
    setIsLoadingRepos(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['x-github-token'] = token;
      }
      const res = await fetch('/api/github/repos', { headers });
      const data = await res.json();
      if (res.ok && data.repos && data.repos.length > 0) {
        setUserRepos(data.repos);
        setIsDemoMode(false);
        // Automatically select and load the most recently updated repository
        const firstRepo = data.repos[0];
        setOwner(firstRepo.owner.login);
        setRepo(firstRepo.name);
        setBranch(firstRepo.default_branch || 'main');
        fetchLiveTree(firstRepo.owner.login, firstRepo.name, firstRepo.default_branch || 'main');
      }
    } catch (err) {
      console.error('Failed to load user repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    // Automatically attempt connection on startup (works with saved token or server GITHUB_TOKEN)
    validateToken(githubToken || undefined);
  }, [githubToken, validateToken]);

  const handleSaveToken = (token: string) => {
    setGithubToken(token);
    localStorage.setItem('gitgemini_github_token', token);
    setIsDemoMode(false);
    validateToken(token);
  };

  const handleClearToken = () => {
    setGithubToken('');
    setGithubUser(null);
    localStorage.removeItem('gitgemini_github_token');
    showToast('GitHub token removed. Switched to demo mode.', 'info');
  };

  // Fetch file tree for a live repository
  const fetchLiveTree = async (repoOwner: string, repoName: string, targetBranch: string) => {
    setIsLoadingTree(true);
    try {
      const headers: Record<string, string> = {};
      if (githubToken) headers['x-github-token'] = githubToken;

      const res = await fetch(
        `/api/github/tree?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}&ref=${encodeURIComponent(targetBranch)}`,
        { headers }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tree');
      }

      setTreeItems(data.items || []);
      setIsDemoMode(false);

      // Also get branches
      const detailsRes = await fetch(
        `/api/github/repo-details?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`,
        { headers }
      );
      const detailsData = await detailsRes.json();
      if (detailsRes.ok && detailsData.branches) {
        setBranches(detailsData.branches);
      }

      // Auto-select first blob file if available
      const firstBlob = data.items.find((i: RepoTreeItem) => i.type === 'blob');
      if (firstBlob) {
        fetchLiveFile(repoOwner, repoName, firstBlob.path, targetBranch);
      }

      showToast(`Loaded ${data.items.length} files from ${repoOwner}/${repoName}`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoadingTree(false);
    }
  };

  // Fetch single file content from GitHub
  const fetchLiveFile = async (
    repoOwner: string,
    repoName: string,
    filePath: string,
    targetBranch: string
  ) => {
    setIsLoadingFile(true);
    try {
      const headers: Record<string, string> = {};
      if (githubToken) headers['x-github-token'] = githubToken;

      const res = await fetch(
        `/api/github/file?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(targetBranch)}`,
        { headers }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load file');
      }

      setSelectedFilePath(data.path);
      setOriginalCode(data.content);
      setFileSha(data.sha);
      setModifiedCode(''); // Reset modified code until prompted
      setTransformResult(null);

      // Auto-update branch name
      const cleanFileName = filePath.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '-') || 'patch';
      setBranchName(`gemini/update-${cleanFileName}-${Math.random().toString(36).substring(2, 6)}`);
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handle selecting a repository
  const handleSelectRepo = (newOwner: string, newRepo: string, defaultBranch?: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
    const targetBranch = defaultBranch || 'main';
    setBranch(targetBranch);
    fetchLiveTree(newOwner, newRepo, targetBranch);
  };

  // Handle selecting a file from the tree
  const handleSelectFile = (path: string) => {
    if (isDemoMode && SAMPLE_FILES[path]) {
      setSelectedFilePath(path);
      setOriginalCode(SAMPLE_FILES[path].content);
      setFileSha(SAMPLE_FILES[path].sha);
      setModifiedCode('');
      setTransformResult(null);
      const cleanFileName = path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '-') || 'patch';
      setBranchName(`gemini/mod-${cleanFileName}-${Math.random().toString(36).substring(2, 6)}`);
      return;
    }

    fetchLiveFile(owner, repo, path, branch);
  };

  // Load Built-in Demo Repository
  const handleLoadDemo = () => {
    setIsDemoMode(true);
    setOwner(SAMPLE_REPO.owner.login);
    setRepo(SAMPLE_REPO.name);
    setBranch(SAMPLE_REPO.default_branch);
    setBranches([
      { name: 'main', commitSha: 'main-sha-01' },
      { name: 'staging', commitSha: 'staging-sha-02' },
    ]);
    setTreeItems(SAMPLE_TREE);
    setSelectedFilePath('src/auth/jwtService.ts');
    setOriginalCode(SAMPLE_FILES['src/auth/jwtService.ts'].content);
    setFileSha(SAMPLE_FILES['src/auth/jwtService.ts'].sha);
    setModifiedCode('');
    setTransformResult(null);
    setBranchName('gemini/feat-jwt-rotation');
    showToast('Loaded interactive sample microservice repository', 'info');
  };

  // Run Gemini Code Transformation
  const handleRunTransform = async () => {
    if (!originalCode && originalCode !== '') {
      showToast('Please select a file first', 'error');
      return;
    }
    if (!instructions.trim()) {
      showToast('Please provide modification instructions', 'error');
      return;
    }

    setIsTransforming(true);
    try {
      const res = await fetch('/api/gemini/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: originalCode,
          filePath: selectedFilePath,
          instructions,
          model: selectedModel,
          thinking,
          repoContext: {
            owner,
            repo,
            branch,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transform code');
      }

      setModifiedCode(data.modifiedCode);
      setCommitMessage(data.commitMessage);
      setPrTitle(data.prTitle);
      setPrBody(data.prBody);
      setTransformResult({
        modifiedCode: data.modifiedCode,
        explanation: data.explanation,
        commitMessage: data.commitMessage,
        prTitle: data.prTitle,
        prBody: data.prBody,
        modelUsed: data.modelUsed,
        thinkingUsed: data.thinkingUsed,
        diffSummary: {
          additions: 0,
          deletions: 0,
          totalChanges: 0,
        },
      });

      showToast('Gemini transformation generated! Review the diff below.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Transform Error: ${err.message}`, 'error');
    } finally {
      setIsTransforming(false);
    }
  };

  // Execute Git Workflow: Branch Creation -> Blob Commit -> Open Pull Request
  const handleCommitAndPR = async () => {
    const codeToCommit = modifiedCode || originalCode;
    if (!codeToCommit) {
      showToast('No code changes to commit', 'error');
      return;
    }

    setIsCommitting(true);

    // Reset pipeline steps
    setPipelineSteps([
      { id: 'sha', label: '1. Fetch Base Branch SHA', description: `Targeting '${branch}'`, status: 'running' },
      { id: 'branch', label: '2. Create Isolated Git Branch', description: `refs/heads/${branchName}`, status: 'idle' },
      { id: 'blob', label: '3. Commit Transformed File', description: selectedFilePath, status: 'idle' },
      { id: 'pr', label: '4. Open GitHub Pull Request', description: prTitle, status: 'idle' },
    ]);

    try {
      // If in demo mode without PAT, simulate realistic workflow with real delay and realistic responses
      if (isDemoMode && !githubToken) {
        await new Promise((r) => setTimeout(r, 600));
        setPipelineSteps((prev) =>
          prev.map((s, idx) => (idx === 0 ? { ...s, status: 'success', detail: 'SHA 4f8b9e1' } : idx === 1 ? { ...s, status: 'running' } : s))
        );

        await new Promise((r) => setTimeout(r, 600));
        setPipelineSteps((prev) =>
          prev.map((s, idx) => (idx === 1 ? { ...s, status: 'success', detail: 'Created' } : idx === 2 ? { ...s, status: 'running' } : s))
        );

        await new Promise((r) => setTimeout(r, 700));
        setPipelineSteps((prev) =>
          prev.map((s, idx) => (idx === 2 ? { ...s, status: 'success', detail: 'Blob 82b1c4' } : idx === 3 ? { ...s, status: 'running' } : s))
        );

        await new Promise((r) => setTimeout(r, 600));
        setPipelineSteps((prev) =>
          prev.map((s, idx) => (idx === 3 ? { ...s, status: 'success', detail: 'PR #42' } : s))
        );

        const simulatedResult: CommitAndPRResult = {
          success: true,
          branchName,
          branchUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`,
          commitSha: '4f8b9e1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
          commitUrl: `https://github.com/${owner}/${repo}/commit/4f8b9e1`,
          prNumber: 42,
          prUrl: `https://github.com/${owner}/${repo}/pull/42`,
          prTitle,
          repoFullName: `${owner}/${repo}`,
          isSimulated: true,
        };

        setPrResult(simulatedResult);
        showToast('Pull Request workflow simulated successfully!', 'success');
        return;
      }

      // Live GitHub API Call
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (githubToken) headers['x-github-token'] = githubToken;

      setPipelineSteps((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: 'running' } : s))
      );

      const res = await fetch('/api/github/commit-and-pr', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner,
          repo,
          baseBranch: branch,
          newBranchName: branchName,
          filePath: selectedFilePath,
          fileContent: codeToCommit,
          fileSha,
          commitMessage,
          prTitle,
          prBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete Git PR workflow');
      }

      setPipelineSteps((prev) =>
        prev.map((s) => ({ ...s, status: 'success' }))
      );

      setPrResult(data);
      showToast(`Pull Request #${data.prNumber} opened on GitHub!`, 'success');
    } catch (err: any) {
      console.error(err);
      setPipelineSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'error', detail: 'Failed' } : s))
      );
      showToast(`Git Error: ${err.message}`, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('gitgemini_pin_unlocked', 'true');
    showToast('Access Granted. Workspace Unlocked.', 'success');
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('gitgemini_pin_unlocked');
    showToast('Workspace locked.', 'info');
  };

  if (!isUnlocked) {
    return <PinLockScreen requiredPin={REQUIRED_APP_PIN} onUnlocked={handleUnlock} />;
  }

  return (
    <div id="gitgemini-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        githubUser={githubUser}
        githubToken={githubToken}
        onSaveToken={handleSaveToken}
        onClearToken={handleClearToken}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onLoadDemo={handleLoadDemo}
        isDemoMode={isDemoMode}
        hasGeminiKey={hasGeminiKey}
        onLockApp={handleLock}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2 rounded border text-xs font-mono shadow-2xl flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/40'
                : toastMessage.type === 'error'
                ? 'bg-slate-900 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-200 border-slate-700'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Repo & Branch Header */}
      <RepoSelector
        owner={owner}
        repo={repo}
        branch={branch}
        branches={branches}
        userRepos={userRepos}
        isLoadingRepos={isLoadingRepos}
        isLoadingTree={isLoadingTree}
        onSelectRepo={handleSelectRepo}
        onSelectBranch={(b) => {
          setBranch(b);
          if (!isDemoMode) fetchLiveTree(owner, repo, b);
        }}
        onRefreshTree={() => {
          if (isDemoMode) {
            handleLoadDemo();
          } else {
            fetchLiveTree(owner, repo, branch);
          }
        }}
      />

      {/* Mobile Tab Navigation (Visible on mobile/small screens, hidden on md+) */}
      <div
        id="mobile-workspace-tabs"
        className="md:hidden flex items-center bg-slate-950 border-b border-slate-800 shrink-0 select-none z-10"
      >
        <button
          id="mobile-tab-files"
          onClick={() => setMobileTab('files')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
            mobileTab === 'files'
              ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Files</span>
          <span className="ml-1 text-[10px] font-mono px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {treeItems.filter((i) => i.type === 'blob').length}
          </span>
        </button>

        <button
          id="mobile-tab-editor"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 relative ${
            mobileTab === 'editor'
              ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Editor</span>
          {Boolean(modifiedCode && modifiedCode !== originalCode) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has modifications" />
          )}
        </button>

        <button
          id="mobile-tab-prompt"
          onClick={() => setMobileTab('prompt')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 relative ${
            mobileTab === 'prompt'
              ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Prompt & PR</span>
          {isTransforming && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
          {isCommitting && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          )}
        </button>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: Repository File Tree */}
        <FileTreeViewer
          items={treeItems}
          selectedPath={selectedFilePath}
          onSelectFile={(path) => {
            handleSelectFile(path);
            setMobileTab('editor');
          }}
          isLoading={isLoadingTree}
          className={mobileTab === 'files' ? 'flex' : 'hidden md:flex'}
        />

        {/* Center Column: Diff / Code Editor View */}
        <CodeEditorDiff
          filePath={selectedFilePath}
          originalCode={originalCode}
          modifiedCode={modifiedCode}
          onUpdateModifiedCode={(code) => setModifiedCode(code)}
          isLoadingFile={isLoadingFile}
          isTransforming={isTransforming}
          onRevertChanges={() => {
            setModifiedCode('');
            setTransformResult(null);
            showToast('Reverted modifications back to original code', 'info');
          }}
          className={mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}
        />

        {/* Right Column: Gemini Prompt & Git Automation Pipeline */}
        <PromptControlPanel
          filePath={selectedFilePath}
          instructions={instructions}
          onChangeInstructions={setInstructions}
          selectedModel={selectedModel}
          onChangeModel={setSelectedModel}
          thinking={thinking}
          onToggleThinking={() => setThinking(!thinking)}
          branchName={branchName}
          onChangeBranchName={setBranchName}
          commitMessage={commitMessage}
          onChangeCommitMessage={setCommitMessage}
          prTitle={prTitle}
          onChangePrTitle={setPrTitle}
          prBody={prBody}
          onChangePrBody={setPrBody}
          isTransforming={isTransforming}
          onRunTransform={async () => {
            await handleRunTransform();
            setMobileTab('editor');
          }}
          isCommitting={isCommitting}
          onCommitAndPR={handleCommitAndPR}
          hasModifiedCode={Boolean(modifiedCode && modifiedCode !== originalCode)}
          pipelineSteps={pipelineSteps}
          transformResult={transformResult}
          hasGithubToken={Boolean(githubToken)}
          onOpenPatModal={() => {
            const btn = document.getElementById('btn-connect-github');
            btn?.click();
          }}
          className={mobileTab === 'prompt' ? 'flex' : 'hidden md:flex'}
        />
      </main>

      {/* Bottom Geometric Status Bar */}
      <footer className="h-10 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active File:</span>
            <span className="text-slate-300 font-medium">{selectedFilePath || 'None'}</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output Branch:</span>
            <span className="text-indigo-400 font-medium">{branchName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>REST API Ready</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
          <span>OCTOKIT v20.0</span>
        </div>
      </footer>

      {/* Multi-Turn Gemini Chat Assistant Drawer */}
      <ChatAssistantDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentFilePath={selectedFilePath}
        currentFileContent={originalCode}
        onApplyPromptToTransform={(promptText) => {
          setInstructions(promptText);
          showToast('Applied assistant suggestions into prompt input!', 'success');
        }}
      />

      {/* PR Success Celebration Modal */}
      <PRResultModal
        result={prResult}
        onClose={() => setPrResult(null)}
      />
    </div>
  );
}
