import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Search,
  ChevronRight,
  ChevronDown,
  Code2,
  FileCheck,
} from 'lucide-react';
import { RepoTreeItem } from '../types';

interface FileTreeViewerProps {
  items: RepoTreeItem[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  isLoading: boolean;
  className?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
  children?: Record<string, TreeNode>;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <Code2 className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <Code2 className="w-4 h-4 text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'go':
    case 'rs':
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    default:
      return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

export const FileTreeViewer: React.FC<FileTreeViewerProps> = ({
  items,
  selectedPath,
  onSelectFile,
  isLoading,
  className,
}) => {
  const [search, setSearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Build nested tree structure
  const treeRoot = useMemo(() => {
    const root: Record<string, TreeNode> = {};

    const filtered = items.filter((item) =>
      item.path.toLowerCase().includes(search.toLowerCase())
    );

    for (const item of filtered) {
      const parts = item.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            type: isLeaf ? item.type : 'tree',
            size: item.size,
            sha: item.sha,
            children: isLeaf && item.type === 'blob' ? undefined : {},
          };
        }

        if (current[part].children) {
          current = current[part].children!;
        }
      }
    }

    return root;
  }, [items, search]);

  const renderTree = (nodes: Record<string, TreeNode>, depth = 0) => {
    const keys = Object.keys(nodes).sort((a, b) => {
      const nodeA = nodes[a];
      const nodeB = nodes[b];
      if (nodeA.type === 'tree' && nodeB.type !== 'tree') return -1;
      if (nodeA.type !== 'tree' && nodeB.type === 'tree') return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="space-y-0.5">
        {keys.map((key) => {
          const node = nodes[key];
          const isFolder = node.type === 'tree';
          const isCollapsed = Boolean(collapsedFolders[node.path]);
          const isSelected = selectedPath === node.path;

          if (isFolder) {
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  className="w-full text-left py-1 pr-2 rounded-md hover:bg-slate-800/60 flex items-center gap-1.5 text-xs text-slate-300 transition group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-indigo-300 shrink-0" />
                  )}
                  <span className="font-medium text-slate-300 truncate">{node.name}</span>
                </button>
                {!isCollapsed && node.children && renderTree(node.children, depth + 1)}
              </div>
            );
          }

          return (
            <button
              key={node.path}
              id={`file-tree-item-${node.path.replace(/[/.]/g, '-')}`}
              onClick={() => onSelectFile(node.path)}
              style={{ paddingLeft: `${depth * 12 + 16}px` }}
              className={`w-full text-left py-1 pr-2 rounded flex items-center justify-between gap-2 text-xs font-mono transition ${
                isSelected
                  ? 'text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-1 h-1 rounded-full shrink-0 ${
                    isSelected ? 'bg-indigo-400' : 'bg-slate-600'
                  }`}
                />
                <span className="truncate">{node.name}</span>
              </div>
              {node.size !== undefined && (
                <span className="text-[10px] text-slate-600 font-mono shrink-0">
                  {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}k` : `${node.size}b`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div id="file-tree-panel" className={`flex flex-col h-full bg-slate-950 border-r border-slate-800 w-full md:w-64 lg:w-72 shrink-0 ${className || ''}`}>
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Workspace Files
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {items.filter((i) => i.type === 'blob').length} files
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            id="input-file-search"
            type="text"
            placeholder="Filter files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[11px]">Loading file tree...</span>
          </div>
        ) : Object.keys(treeRoot).length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">
            {search ? `No files matching "${search}"` : 'No files found in this repository branch.'}
          </div>
        ) : (
          renderTree(treeRoot)
        )}
      </div>
    </div>
  );
};
