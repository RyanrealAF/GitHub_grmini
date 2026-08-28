import React, { useState } from 'react';
import {
  FolderGit2,
  GitBranch,
  Search,
  RefreshCw,
  Lock,
  Globe,
  Star,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface RepoSelectorProps {
  owner: string;
  repo: string;
  branch: string;
  branches: { name: string; commitSha: string; protected?: boolean }[];
  userRepos: GitHubRepo[];
  isLoadingRepos: boolean;
  isLoadingTree: boolean;
  onSelectRepo: (owner: string, repo: string, defaultBranch?: string) => void;
  onSelectBranch: (branch: string) => void;
  onRefreshTree: () => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  owner,
  repo,
  branch,
  branches,
  userRepos,
  isLoadingRepos,
  isLoadingTree,
  onSelectRepo,
  onSelectBranch,
  onRefreshTree,
}) => {
  const [customInput, setCustomInput] = useState(`${owner}/${repo}`);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = customInput.trim().split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      onSelectRepo(parts[0].trim(), parts[1].trim());
      setIsDropdownOpen(false);
    }
  };

  const filteredRepos = userRepos.filter(
    (r) =>
      r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  return (
    <div id="repo-selector-container" className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Repo Picker & Manual Input */}
        <div className="flex flex-1 items-center gap-2 relative">
          <div className="flex items-center gap-2 text-slate-400 pl-1">
            <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:inline">
              Repo:
            </span>
          </div>

          <div className="relative flex-1">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                id="input-repo-name"
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onFocus={() => userRepos.length > 0 && setIsDropdownOpen(true)}
                placeholder="owner/repository-name (e.g. facebook/react)"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                id="btn-load-repo"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition shrink-0 flex items-center gap-1"
                title="Load Repository"
              >
                <span>Load</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
              </button>
            </form>

            {/* Repositories Dropdown */}
            {isDropdownOpen && userRepos.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-80 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-slate-800 bg-slate-950/60">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search your repositories..."
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto p-1 divide-y divide-slate-800/40">
                    {filteredRepos.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No repositories found matching "{repoSearch}"
                      </div>
                    ) : (
                      filteredRepos.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCustomInput(r.full_name);
                            onSelectRepo(r.owner.login, r.name, r.default_branch);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left p-2 hover:bg-slate-800/70 rounded-lg flex items-center justify-between gap-3 transition group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200 group-hover:text-indigo-300">
                              {r.private ? (
                                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                              ) : (
                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{r.full_name}</span>
                            </div>
                            {r.description && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">
                                {r.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                            {r.language && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                {r.language}
                              </span>
                            )}
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400" />
                              <span>{r.stargazers_count}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Branch Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              id="select-branch"
              value={branch}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
            >
              {branches.length > 0 ? (
                branches.map((b) => (
                  <option key={b.name} value={b.name} className="bg-slate-900 text-slate-200">
                    {b.name} {b.protected ? '(protected)' : ''}
                  </option>
                ))
              ) : (
                <option value={branch} className="bg-slate-900 text-slate-200">
                  {branch}
                </option>
              )}
            </select>
          </div>

          <button
            id="btn-refresh-tree"
            onClick={onRefreshTree}
            disabled={isLoadingTree}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition disabled:opacity-50"
            title="Refresh repository file tree"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTree ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
