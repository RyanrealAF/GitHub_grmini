import React, { useState } from 'react';
import {
  GitPullRequest,
  ExternalLink,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { CommitAndPRResult } from '../types';

interface PRResultModalProps {
  result: CommitAndPRResult | null;
  onClose: () => void;
}

export const PRResultModal: React.FC<PRResultModalProps> = ({ result, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!result) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(result.prUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  PR #{result.prNumber || '1'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{result.repoFullName}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                Pull Request Created Successfully!
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Title & Link Banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <GitPullRequest className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="font-semibold text-sm text-slate-100 truncate">
                {result.prTitle}
              </span>
            </div>

            <a
              id="link-view-pr"
              href={result.prUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition shrink-0"
            >
              <span>Open on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1 text-slate-400 font-mono">
            <div className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">{result.branchName}</span>
            </div>

            {result.commitSha && (
              <div className="flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                <span>{result.commitSha.slice(0, 7)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'PR Link Copied!' : 'Copy Pull Request URL'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
