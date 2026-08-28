import React, { useState } from 'react';
import {
  Github,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  MessageSquareCode,
  Layers,
  ExternalLink,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { GitHubUser } from '../types';

interface NavbarProps {
  githubUser: GitHubUser | null;
  githubToken: string;
  onSaveToken: (token: string) => void;
  onClearToken: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onLoadDemo: () => void;
  isDemoMode: boolean;
  hasGeminiKey: boolean;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  githubUser,
  githubToken,
  onSaveToken,
  onClearToken,
  isChatOpen,
  onToggleChat,
  onLoadDemo,
  isDemoMode,
  hasGeminiKey,
  onLockApp,
}) => {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tempToken, setTempToken] = useState(githubToken);

  const handleSave = () => {
    onSaveToken(tempToken.trim());
    setIsTokenModalOpen(false);
  };

  return (
    <header id="app-navbar" className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 text-sm">
          G
        </div>
        <div className="h-4 w-[1px] bg-slate-700 hidden sm:block"></div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-100">
              Gemini Repository Bridge
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
              v2.5
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            Programmatic repository refactoring & PR orchestration
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${githubUser || githubToken ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
          <span className="text-slate-400 font-mono text-[11px]">
            {githubUser ? `GitHub: @${githubUser.login}` : (githubToken ? 'GitHub API: Connected' : 'GitHub API: Demo Mode')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span className="text-slate-400 font-mono text-[11px]">
            Gemini-3.1-Pro: Online
          </span>
        </div>
        {isDemoMode && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-amber-400 text-[10px] uppercase font-bold tracking-wider">
            <span>Demo Sandbox</span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          id="btn-load-demo"
          onClick={onLoadDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition uppercase tracking-wider text-[10px]"
          title="Load sample repository files for fast testing"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sample Repo</span>
        </button>

        {/* GitHub Auth Status / PAT Config */}
        {githubUser ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded p-1 pr-2.5">
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              className="w-6 h-6 rounded object-cover border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-mono text-slate-200">{githubUser.login}</span>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="text-[10px] uppercase tracking-wider text-indigo-400 hover:text-indigo-300 ml-1 font-semibold"
            >
              PAT
            </button>
          </div>
        ) : (
          <button
            id="btn-connect-github"
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition uppercase tracking-wider text-[10px]"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{githubToken ? 'Token' : 'Connect PAT'}</span>
          </button>
        )}

        {/* Chat Assistant Toggle */}
        <button
          id="btn-toggle-assistant"
          onClick={onToggleChat}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition uppercase tracking-wider text-[10px] ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50'
          }`}
        >
          <MessageSquareCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Lock PIN Button */}
        {onLockApp && (
          <button
            id="btn-lock-app"
            onClick={onLockApp}
            title="Lock Studio (Require PIN)"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User initials / placeholder badge matching theme */}
        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-semibold text-slate-300">
          {githubUser ? githubUser.login.slice(0, 2).toUpperCase() : 'AI'}
        </div>
      </div>

      {/* PAT Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>GitHub Personal Access Token</span>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              To read private repos, create isolated branches, commit files, and open Pull Requests on your behalf, provide a GitHub Personal Access Token with <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">repo</code> scope.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Personal Access Token (classic or fine-grained)
              </label>
              <input
                id="input-github-pat"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Required Scopes:</span>
              </div>
              <p>• <strong className="text-slate-200">repo</strong> (Full repository read/write)</p>
              <p>• <strong className="text-slate-200">read:user</strong> (Profile identity)</p>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitGemini%20AI%20Orchestrator"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline pt-1 text-xs"
              >
                Generate token on GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {githubToken && (
                <button
                  onClick={() => {
                    onClearToken();
                    setTempToken('');
                    setIsTokenModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 mr-auto font-mono uppercase tracking-wider text-[10px]"
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                id="btn-save-pat"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white uppercase tracking-widest shadow-md shadow-indigo-600/30"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
