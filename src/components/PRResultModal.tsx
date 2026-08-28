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
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  PR #{result.prNumber || '1'}
                </span>
                <span className="text-xs text-slate-500 font-mono">{result.repoFullName}</span>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 mt-1">
                Pull Request Created Successfully
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PR Title & Link Banner */}
        <div className="bg-slate-900 p-4 rounded border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <GitPullRequest className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-xs text-slate-100 truncate">
                {result.prTitle}
              </span>
            </div>

            <a
              id="link-view-pr"
              href={result.prUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-widest shadow-md shadow-indigo-600/30 transition shrink-0"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1 text-slate-400 font-mono">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy PR URL'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold uppercase tracking-widest rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
