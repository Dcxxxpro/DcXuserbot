import React, { useState, useMemo } from 'react';
import { FileCode, Search, Copy, Check, Folder, Layers, Cloud, Settings, BookOpen, Terminal } from 'lucide-react';
import { UserbotFile } from '../types';

interface CodeExplorerProps {
  files: UserbotFile[];
  selectedFile: UserbotFile;
  onSelectFile: (file: UserbotFile) => void;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const categories = [
    { id: 'all', label: 'All Files', icon: Layers },
    { id: 'core', label: 'Core & Dual Engine', icon: Terminal },
    { id: 'plugin', label: 'Upgraded Plugins', icon: FileCode },
    { id: 'deploy', label: 'AWS EC2 & Docker', icon: Cloud },
    { id: 'config', label: 'Config & Env', icon: Settings },
    { id: 'docs', label: 'Docs & Guide', icon: BookOpen },
  ];

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesCat = selectedCategory === 'all' || file.category === selectedCategory;
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [files, selectedCategory, searchQuery]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = useMemo(() => {
    return selectedFile.content.split('\n').length;
  }, [selectedFile.content]);

  return (
    <div id="code-explorer-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: File Tree & Filter */}
      <div className="lg:col-span-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="file-search-input"
            type="text"
            placeholder="Search files or plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* File List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-sky-400" />
              Repository Hierarchy
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-800/50 max-h-[560px] overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching files found.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isCurrent = file.path === selectedFile.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => onSelectFile(file)}
                    className={`w-full text-left px-4 py-3 transition flex items-start space-x-3 ${
                      isCurrent
                        ? 'bg-sky-500/10 border-l-2 border-sky-500 text-sky-300'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <FileCode
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isCurrent ? 'text-sky-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium truncate">
                          {file.path}
                        </span>
                        <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {file.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {file.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main: Code Viewer */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Code Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <span className="ml-2 font-mono text-xs font-semibold text-slate-300">
              {selectedFile.path}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({lineCount} lines)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="copy-file-code-btn"
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-mono">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Description Callout */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
          <span>{selectedFile.description}</span>
          <span className="text-[11px] text-sky-400/90 font-mono">AWS EC2 Production Tested</span>
        </div>

        {/* Code Body with line numbers */}
        <div className="overflow-x-auto max-h-[600px] p-4 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="flex">
            <code className="text-slate-600 select-none pr-4 text-right border-r border-slate-800 mr-4 shrink-0">
              {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
            </code>
            <code className="text-sky-200/90 whitespace-pre overflow-x-auto block w-full">
              {selectedFile.content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
