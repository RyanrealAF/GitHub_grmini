import React, { useState } from 'react';
import {
  Sparkles,
  GitPullRequest,
  GitBranch,
  Brain,
  Wand2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  GitCommit,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Tag,
} from 'lucide-react';
import { GeminiModelId, PipelineStep, TransformResult } from '../types';

interface PromptControlPanelProps {
  filePath: string;
  instructions: string;
  onChangeInstructions: (inst: string) => void;
  selectedModel: GeminiModelId;
  onChangeModel: (model: GeminiModelId) => void;
  thinking: boolean;
  onToggleThinking: () => void;
  branchName: string;
  onChangeBranchName: (name: string) => void;
  commitMessage: string;
  onChangeCommitMessage: (msg: string) => void;
  prTitle: string;
  onChangePrTitle: (title: string) => void;
  prBody: string;
  onChangePrBody: (body: string) => void;
  isTransforming: boolean;
  onRunTransform: () => void;
  isCommitting: boolean;
  onCommitAndPR: () => void;
  hasModifiedCode: boolean;
  pipelineSteps: PipelineStep[];
  transformResult: TransformResult | null;
  hasGithubToken: boolean;
  onOpenPatModal: () => void;
}

const PRESET_PROMPTS = [
  {
    label: 'JWT Refresh Rotation',
    prompt: 'Implement token refresh rotation, revoke blacklist capability, and secure cookie/header options with strict TypeScript types.',
  },
  {
    label: 'TypeScript Hardening',
    prompt: 'Add explicit TypeScript interfaces, strict return types, remove any "any" types, and add comprehensive JSDoc documentation.',
  },
  {
    label: 'Error Handling & Resilience',
    prompt: 'Wrap all critical paths in robust try/catch blocks with custom application error classes, structured logging, and HTTP error mapping.',
  },
  {
    label: 'Input Sanitization & Security',
    prompt: 'Add thorough input validation, regex sanitization against injection attacks, rate-limit defense hooks, and secure defaults.',
  },
  {
    label: 'Unit Test Suite',
    prompt: 'Generate a comprehensive unit test suite covering happy paths, edge cases, error conditions, and mocked dependencies.',
  },
];

export const PromptControlPanel: React.FC<PromptControlPanelProps> = ({
  filePath,
  instructions,
  onChangeInstructions,
  selectedModel,
  onChangeModel,
  thinking,
  onToggleThinking,
  branchName,
  onChangeBranchName,
  commitMessage,
  onChangeCommitMessage,
  prTitle,
  onChangePrTitle,
  prBody,
  onChangePrBody,
  isTransforming,
  onRunTransform,
  isCommitting,
  onCommitAndPR,
  hasModifiedCode,
  pipelineSteps,
  transformResult,
  hasGithubToken,
  onOpenPatModal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div id="prompt-control-panel" className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full md:w-80 lg:w-96 shrink-0">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Gemini Transformation Engine
            </h3>
            <p className="text-[11px] text-slate-400">Prompt instructions & Git PR pipeline</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Model Selection & Thinking */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini Model</span>
            </label>

            {/* High Thinking Toggle */}
            <button
              id="btn-toggle-thinking"
              onClick={onToggleThinking}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
                thinking
                  ? 'bg-purple-950/60 text-purple-300 border-purple-600/50 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Enable deep thinking mode for complex architectural reasoning"
            >
              <Brain className={`w-3 h-3 ${thinking ? 'text-purple-400' : ''}`} />
              <span>High Thinking: {thinking ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <select
            id="select-gemini-model"
            value={selectedModel}
            onChange={(e) => onChangeModel(e.target.value as GeminiModelId)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Reasoning)</option>
            <option value="gemini-3.7-flash">gemini-3.7-flash (Balanced & Fast)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (Standard)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-fast)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
          </select>
        </div>

        {/* Preset Templates */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Quick Transformation Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => onChangeInstructions(p.prompt)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Instructions */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Modification Instructions</span>
            <span className="text-[10px] text-slate-500 font-normal">
              Target: {filePath ? filePath.split('/').pop() : 'No file'}
            </span>
          </label>
          <textarea
            id="textarea-instructions"
            value={instructions}
            onChange={(e) => onChangeInstructions(e.target.value)}
            placeholder="Describe what Gemini should transform in this file (e.g. 'Add input sanitization with Zod and return structured Result<T, Error> types')..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Step 1: Run Gemini Transform Button */}
        <button
          id="btn-run-gemini-transform"
          onClick={onRunTransform}
          disabled={isTransforming || !filePath || !instructions.trim()}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isTransforming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Code Transformations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>1. Run Gemini Code Transformation</span>
            </>
          )}
        </button>

        {/* AI Transformation Summary Card */}
        {transformResult && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Transformation Ready</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {transformResult.modelUsed}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {transformResult.explanation}
            </p>
          </div>
        )}

        {/* Git Branch & Pull Request Config Section */}
        <div className="border-t border-slate-800 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
              <span>Git & PR Automation</span>
            </span>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
            >
              <span>{showAdvanced ? 'Hide Details' : 'Edit PR Details'}</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Branch Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-emerald-400" />
              <span>Target Git Branch to Create</span>
            </label>
            <input
              id="input-branch-name"
              type="text"
              value={branchName}
              onChange={(e) => onChangeBranchName(e.target.value)}
              placeholder="gemini/feature-update-branch"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Expandable Advanced Commit & PR Fields */}
          {showAdvanced && (
            <div className="space-y-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <GitCommit className="w-3 h-3 text-indigo-400" />
                  <span>Commit Message</span>
                </label>
                <input
                  id="input-commit-message"
                  type="text"
                  value={commitMessage}
                  onChange={(e) => onChangeCommitMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Pull Request Title</span>
                </label>
                <input
                  id="input-pr-title"
                  type="text"
                  value={prTitle}
                  onChange={(e) => onChangePrTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <FileEdit className="w-3 h-3 text-amber-400" />
                  <span>Pull Request Body (Markdown)</span>
                </label>
                <textarea
                  id="textarea-pr-body"
                  value={prBody}
                  onChange={(e) => onChangePrBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Commit and Open PR Button */}
          <button
            id="btn-commit-and-pr"
            onClick={onCommitAndPR}
            disabled={isCommitting || !hasModifiedCode || !branchName.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCommitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing Git Operations...</span>
              </>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" />
                <span>2. Create Branch, Commit & Open PR</span>
              </>
            )}
          </button>

          {!hasGithubToken && (
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span>GitHub Token not yet connected. </span>
                <button
                  onClick={onOpenPatModal}
                  className="underline font-semibold hover:text-amber-200"
                >
                  Add PAT
                </button>
                <span> to commit to your live GitHub repository.</span>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Progress Monitor */}
        {pipelineSteps.some((s) => s.status !== 'idle') && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Workflow Execution Pipeline
            </span>
            <div className="space-y-2">
              {pipelineSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {step.status === 'running' ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : step.status === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        step.status === 'running'
                          ? 'text-indigo-300 font-medium'
                          : step.status === 'success'
                          ? 'text-slate-200'
                          : step.status === 'error'
                          ? 'text-rose-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {step.detail && (
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                      {step.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
