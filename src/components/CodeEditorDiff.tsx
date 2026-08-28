import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  GitCompare,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  FileCheck2,
} from 'lucide-react';
import { computeLineDiff } from '../utils/diffUtils';

interface CodeEditorDiffProps {
  filePath: string;
  originalCode: string;
  modifiedCode: string;
  onUpdateModifiedCode?: (code: string) => void;
  isLoadingFile: boolean;
  isTransforming: boolean;
  onRevertChanges: () => void;
  className?: string;
}

export const CodeEditorDiff: React.FC<CodeEditorDiffProps> = ({
  filePath,
  originalCode,
  modifiedCode,
  onUpdateModifiedCode,
  isLoadingFile,
  isTransforming,
  onRevertChanges,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'modified' | 'original'>('diff');
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChanges = Boolean(modifiedCode && modifiedCode !== originalCode);

  const { lines: diffLines, summary } = useMemo(() => {
    if (!originalCode && !modifiedCode) {
      return { lines: [], summary: { additions: 0, deletions: 0, totalChanges: 0 } };
    }
    return computeLineDiff(originalCode || '', modifiedCode || originalCode || '');
  }, [originalCode, modifiedCode]);

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'original'
        ? originalCode
        : activeTab === 'modified'
        ? modifiedCode || originalCode
        : modifiedCode || originalCode;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      id="code-editor-diff-container"
      className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all ${
        isExpanded ? 'fixed inset-4 z-50 rounded-xl border border-slate-700 shadow-2xl bg-slate-950' : 'flex-1 h-full min-w-0'
      } ${className || ''}`}
    >
      {/* Editor Top Bar */}
      <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950">
        {/* File Path & Stats */}
        <div className="flex items-center gap-3 min-w-0">
          <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 font-medium truncate">
            {filePath || 'Select a file from the workspace'}
          </span>

          {hasChanges && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">+{summary.additions}</span>
              <span className="text-rose-400 font-bold">-{summary.deletions}</span>
            </div>
          )}
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-0.5 rounded border border-slate-800 flex items-center text-xs font-mono">
            <button
              id="tab-diff-view"
              onClick={() => setActiveTab('diff')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 text-[11px] font-medium ${
                activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff</span>
            </button>

            <button
              id="tab-modified-view"
              onClick={() => setActiveTab('modified')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 text-[11px] font-medium ${
                activeTab === 'modified'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Proposed</span>
            </button>

            <button
              id="tab-original-view"
              onClick={() => setActiveTab('original')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 text-[11px] font-medium ${
                activeTab === 'original'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Current</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {hasChanges && (
            <button
              id="btn-revert-changes"
              onClick={onRevertChanges}
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition"
              title="Discard Gemini modifications"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="Copy code to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title={isExpanded ? 'Minimize view' : 'Maximize view'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs leading-relaxed select-text p-4">
        {isLoadingFile ? (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs">Fetching file content from GitHub...</span>
          </div>
        ) : isTransforming ? (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <span className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                Gemini Model Transforming Code...
              </span>
              <p className="text-xs text-slate-500 max-w-sm font-sans">
                Reasoning over architectural constraints, updating types, and verifying logical integrity.
              </p>
            </div>
          </div>
        ) : !filePath ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
            <FileCode2 className="w-8 h-8 text-slate-700" />
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">No File Selected</span>
            <p className="text-xs max-w-xs text-slate-600 font-sans">
              Select any file from the repository tree on the left to inspect, prompt Gemini, and commit changes.
            </p>
          </div>
        ) : activeTab === 'diff' ? (
          <div className="space-y-0.5">
            {!hasChanges && (
              <div className="px-3 py-2 mb-3 bg-slate-900 border border-slate-800 rounded text-slate-400 text-xs flex items-center justify-between">
                <span>Current state unchanged. Enter Gemini prompt instructions on the right to transform this file.</span>
              </div>
            )}
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start rounded px-2 py-0.5 transition-colors font-mono ${
                  line.type === 'added'
                    ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                    : line.type === 'removed'
                    ? 'bg-rose-950/20 text-rose-300 border-l-2 border-rose-500'
                    : 'text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                {/* Line Numbers */}
                <div className="flex items-center gap-2 select-none text-[11px] text-slate-600 w-14 shrink-0 font-mono">
                  <span className="w-6 text-right">{line.oldLineNumber || ''}</span>
                  <span className="w-6 text-right">{line.newLineNumber || ''}</span>
                </div>

                {/* Diff Prefix Sign */}
                <span
                  className={`w-4 shrink-0 select-none font-bold ${
                    line.type === 'added'
                      ? 'text-emerald-400'
                      : line.type === 'removed'
                      ? 'text-rose-400'
                      : 'text-slate-700'
                  }`}
                >
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>

                {/* Code text */}
                <pre className="flex-1 overflow-x-auto whitespace-pre font-mono font-normal">
                  {line.content || ' '}
                </pre>
              </div>
            ))}
          </div>
        ) : activeTab === 'modified' ? (
          <div className="h-full">
            <div className="h-8 border-b border-slate-800 px-3 mb-3 flex items-center justify-between bg-slate-900/60 rounded">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">PROPOSED CHANGES</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] rounded border border-indigo-500/30">
                Gemini Generated
              </span>
            </div>
            <textarea
              id="textarea-modified-code"
              value={modifiedCode || originalCode}
              onChange={(e) => onUpdateModifiedCode && onUpdateModifiedCode(e.target.value)}
              className="w-full h-full min-h-[450px] bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="h-full">
            <div className="h-8 border-b border-slate-800 px-3 mb-3 flex items-center justify-between bg-slate-900/60 rounded">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">CURRENT ({filePath})</span>
            </div>
            <pre className="text-slate-400 font-mono whitespace-pre overflow-x-auto leading-relaxed">
              {originalCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
