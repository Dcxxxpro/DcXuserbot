import React from 'react';
import { Terminal, Download, Copy, Check, Server, Shield, Sparkles } from 'lucide-react';
import { UserbotFile, UserbotConfig } from '../types';
import { exportUserbotZip } from '../utils/zipExporter';

interface HeaderProps {
  activeTab: 'code' | 'simulator' | 'wizard' | 'plugins';
  setActiveTab: (tab: 'code' | 'simulator' | 'wizard' | 'plugins') => void;
  files: UserbotFile[];
  config: UserbotConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  files,
  config,
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const [copiedQuickCmd, setCopiedQuickCmd] = React.useState(false);

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      await exportUserbotZip(files, config);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const copyQuickDeployCommand = () => {
    const cmd = `git clone https://github.com/Dcxxxpro/DcXuserbot && cd DcXuserbot/dcxuserbot && docker compose up -d --build`;
    navigator.clipboard.writeText(cmd);
    setCopiedQuickCmd(true);
    setTimeout(() => setCopiedQuickCmd(false), 2000);
  };

  return (
    <header id="app-header" className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 font-mono font-bold text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-100 text-base tracking-tight">DcXuserbot</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v5 • Host-Agnostic
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Inline Dual-Client
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inline-First Telegram Userbot • Sysinfo & Speedtest Dashboards
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="copy-quick-deploy-btn"
              onClick={copyQuickDeployCommand}
              title="Copy 1-line Docker quick-start command"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition"
            >
              {copiedQuickCmd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Command</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Docker Quick-Start</span>
                </>
              )}
            </button>

            <button
              id="download-zip-btn"
              onClick={handleDownloadZip}
              disabled={downloading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-600 shadow-md shadow-sky-600/20 transition disabled:opacity-75"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Bundling ZIP...' : 'Export ZIP (v5)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-1 border-t border-slate-800/80">
          <button
            id="tab-code-explorer"
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-slate-800/90 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Source Code Explorer ({files.length} Files)</span>
          </button>

          <button
            id="tab-telegram-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-slate-800/90 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Telegram & Inline Button Simulator</span>
          </button>

          <button
            id="tab-deploy-wizard"
            onClick={() => setActiveTab('wizard')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'wizard'
                ? 'bg-slate-800/90 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Config & Deploy Wizard</span>
          </button>

          <button
            id="tab-plugin-catalog"
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'plugins'
                ? 'bg-slate-800/90 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Upgraded Plugins & Commands Codex</span>
          </button>
        </div>
      </div>
    </header>
  );
};
