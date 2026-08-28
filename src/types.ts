export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  public_repos: number;
  total_private_repos?: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface RepoTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface FileContentResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string; // Decoded UTF-8 text
  encoding: string;
  html_url?: string;
}

export type GeminiModelId =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.7-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-2.5-pro';

export interface TransformRequest {
  code: string;
  filePath: string;
  instructions: string;
  model: GeminiModelId;
  thinking: boolean;
  repoContext?: {
    owner: string;
    repo: string;
    branch: string;
    relatedFiles?: string[];
  };
}

export interface TransformResult {
  modifiedCode: string;
  explanation: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  modelUsed: string;
  thinkingUsed: boolean;
  diffSummary: {
    additions: number;
    deletions: number;
    totalChanges: number;
  };
}

export interface CommitAndPRRequest {
  owner: string;
  repo: string;
  baseBranch: string;
  newBranchName: string;
  filePath: string;
  fileContent: string;
  fileSha?: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

export interface CommitAndPRResult {
  success: boolean;
  branchName: string;
  branchUrl: string;
  commitSha: string;
  commitUrl: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  repoFullName: string;
  isSimulated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  model?: string;
  isThinking?: boolean;
  suggestedAction?: {
    type: 'apply_prompt' | 'apply_code';
    content: string;
    filePath?: string;
  };
}

export type ExecutionStepStatus = 'idle' | 'running' | 'success' | 'error';

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: ExecutionStepStatus;
  detail?: string;
}
