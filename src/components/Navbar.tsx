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
}) => {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tempToken, setTempToken] = useState(githubToken);

  const handleSave = () => {
    onSaveToken(tempToken.trim());
    setIsTokenModalOpen(false);
  };

  return (
    <header id="app-navbar" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Github className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-lg">GitGemini</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Code Orchestrator
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Transform GitHub repositories with Gemini reasoning models
            </p>
          </div>
        </div>

        {/* Center / Status */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini 3.1 Pro / 3.7 Flash</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>

          {isDemoMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Demo Repo Active</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            id="btn-load-demo"
            onClick={onLoadDemo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
            title="Load sample repository files for fast testing"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Repo</span>
          </button>

          {/* GitHub Auth Status / PAT Config */}
          {githubUser ? (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg p-1 pr-3">
              <img
                src={githubUser.avatar_url}
                alt={githubUser.login}
                className="w-6 h-6 rounded-md object-cover border border-slate-600"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-medium text-slate-200">{githubUser.login}</span>
              <button
                onClick={() => setIsTokenModalOpen(true)}
                className="text-[11px] text-slate-400 hover:text-slate-200 ml-1 underline"
              >
                PAT
              </button>
            </div>
          ) : (
            <button
              id="btn-connect-github"
              onClick={() => setIsTokenModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{githubToken ? 'Edit GitHub Token' : 'Add GitHub PAT'}</span>
            </button>
          )}

          {/* Chat Assistant Toggle */}
          <button
            id="btn-toggle-assistant"
            onClick={onToggleChat}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              isChatOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 hover:bg-indigo-900/60'
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>AI Code Assistant</span>
          </button>
        </div>
      </div>

      {/* PAT Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>GitHub Personal Access Token (PAT)</span>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              To read private repos, create isolated branches, commit files, and open Pull Requests on your behalf, provide a GitHub Personal Access Token with <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">repo</code> scope.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Personal Access Token (classic or fine-grained)
              </label>
              <input
                id="input-github-pat"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Required Scopes:</span>
              </div>
              <p>• <strong>repo</strong> (Full control of private & public repositories)</p>
              <p>• <strong>read:user</strong> (To read profile identity)</p>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitGemini%20AI%20Orchestrator"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline pt-1"
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
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 mr-auto"
                >
                  Disconnect Token
                </button>
              )}
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                id="btn-save-pat"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
              >
                Connect Token
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
