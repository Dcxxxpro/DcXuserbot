import React, { useState } from 'react';
import { Header } from './components/Header';
import { CodeExplorer } from './components/CodeExplorer';
import { TelegramSimulator } from './components/TelegramSimulator';
import { DeployWizard } from './components/DeployWizard';
import { PluginCatalog } from './components/PluginCatalog';
import { USERBOT_FILES } from './data/userbotFiles';
import { UserbotFile, UserbotConfig } from './types';
import { exportUserbotZip } from './utils/zipExporter';
import { Download, Terminal, Server, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'code' | 'simulator' | 'wizard' | 'plugins'>('code');
  const [selectedFile, setSelectedFile] = useState<UserbotFile>(USERBOT_FILES[0]);
  const [config, setConfig] = useState<UserbotConfig>({
    apiId: '',
    apiHash: '',
    stringSession: '',
    botToken: '',
    botUsername: 'DcXAssistantBot',
    sudoUsers: '',
    commandHandler: '.',
    aliveName: 'DcX Master',
    groqApiKey: '',
    geminiApiKey: '',
  });

  const handleDownload = () => {
    exportUserbotZip(USERBOT_FILES, config);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* App Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        files={USERBOT_FILES}
        config={config}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Hero Banner */}
        <section id="hero-overview" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Python 3.11+ • Telethon 1.36+ • Dual-Client Engine
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  v5.0 — Clean Rewrite
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                Inline-First Telegram Userbot — Sysinfo & Speedtest <span className="text-sky-400">images</span>, anywhere you host
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every one of the <span className="text-slate-200 font-mono">76</span> commands also runs through <span className="text-slate-200 font-mono">inline mode</span> via your BotFather assistant (<code className="text-slate-300 font-mono">@YourBot ping</code>). <code className="text-slate-300 font-mono">.sysinfo</code> and <code className="text-slate-300 font-mono">.speedtest</code> render live dashboard <b>images</b> of the instance — identical behavior on AWS, Heroku, Docker, VPS or Termux. Zero messy deps, crash-shielded plugins.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                id="hero-download-source-btn"
                href="/dcxuserbot.zip"
                download="DcXuserbot-v5.zip"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Source (.zip)</span>
              </a>

              <button
                id="hero-simulator-btn"
                onClick={() => setActiveTab('simulator')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Test Live Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                id="hero-download-zip-btn"
                onClick={handleDownload}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-600/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>DcXuserbot (.zip)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Tab Views */}
        {activeTab === 'code' && (
          <CodeExplorer
            files={USERBOT_FILES}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        )}

        {activeTab === 'simulator' && <TelegramSimulator />}

        {activeTab === 'wizard' && (
          <DeployWizard config={config} setConfig={setConfig} />
        )}

        {activeTab === 'plugins' && <PluginCatalog />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>DcXuserbot v5 — Inline-First Telegram Userbot</span>
            <span>•</span>
            <span>Docker / systemd / Heroku / Termux</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('wizard')}
              className="hover:text-slate-300 transition"
            >
              Deploy Guide
            </button>
            <button
              onClick={() => setActiveTab('plugins')}
              className="hover:text-slate-300 transition"
            >
              Command Codex
            </button>
            <button
              onClick={handleDownload}
              className="hover:text-sky-400 text-slate-400 transition"
            >
              Download Full Source ZIP
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
