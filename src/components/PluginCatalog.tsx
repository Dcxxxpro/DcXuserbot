import React, { useState } from 'react';
import {
  Shield, Sparkles, Image as ImageIcon, Wrench, Radio, Lock, Cloud,
  Terminal, Brain, Search, KeyRound, SignalHigh, Music4, Smile,
} from 'lucide-react';

interface PluginCard {
  name: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  inline: boolean;
  commands: { syntax: string; description: string }[];
}

const PLUGINS: PluginCard[] = [
  {
    name: 'Status & Alive',
    category: 'core',
    icon: <SignalHigh className="w-4 h-4" />,
    description: 'Interactive alive card with assistant-powered buttons, real latency ping, uptime and instant metrics. All mirrored in inline mode.',
    inline: true,
    commands: [
      { syntax: '.alive', description: 'Status card with Stats / Ping / Codex buttons' },
      { syntax: '.ping', description: 'Real edit round-trip latency' },
      { syntax: '.uptime', description: 'Bot + host uptime' },
      { syntax: '.stats', description: 'Instant CPU / RAM / disk snapshot' },
    ],
  },
  {
    name: 'System Dashboards',
    category: 'core',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'The flagship pair: .sysinfo renders a full dashboard IMAGE of the instance (CPU model, cores, RAM, disks, kernel, network, uptime) and .speedtest benchmarks the network into a scoreboard image. Host-agnostic: AWS, Heroku, Docker, VPS or Termux.',
    inline: true,
    commands: [
      { syntax: '.sysinfo', description: 'Rendered PNG dashboard of your instance' },
      { syntax: '.speedtest [quick]', description: 'PNG scoreboard: DL/UL Mbps, ping, jitter, ISP' },
      { syntax: '.logs [n]', description: 'Tail journalctl / log file output' },
      { syntax: '.update / .restart', description: 'git pull + service restart' },
      { syntax: '.clean', description: 'Purge caches & downloads' },
    ],
  },
  {
    name: 'Codex Help Menu',
    category: 'core',
    icon: <Search className="w-4 h-4" />,
    description: 'Paged, categorized interactive help with per-command detail pages — navigable entirely through assistant-bot inline buttons.',
    inline: true,
    commands: [
      { syntax: '.help', description: 'Interactive codex (inline when assistant is set)' },
      { syntax: '.help <command>', description: 'Usage, access level, aliases, inline flag' },
      { syntax: '@bot help', description: 'The same codex, inline in any chat' },
    ],
  },
  {
    name: 'Administration',
    category: 'admin',
    icon: <Shield className="w-4 h-4" />,
    description: 'Full moderation toolkit with reply/id/@username targeting and crash-shielded Telethon calls.',
    inline: false,
    commands: [
      { syntax: '.ban / .unban / .kick', description: 'Ban management with confirmations' },
      { syntax: '.mute / .unmute', description: 'Permission-based silence' },
      { syntax: '.promote [full] / .demote', description: 'Admin rights manager' },
      { syntax: '.pin [loud] / .unpin [all]', description: 'Silent or notified pins' },
      { syntax: '.purge [n] / .del', description: 'Bulk message cleanup' },
      { syntax: '.zombies [clean]', description: 'Find or ban deleted accounts' },
    ],
  },
  {
    name: 'Info & Intelligence',
    category: 'tools',
    icon: <Search className="w-4 h-4" />,
    description: 'Deep user lookups with bio, DC, flags plus chat intelligence.',
    inline: true,
    commands: [
      { syntax: '.whois', description: 'ID, DC, bio, premium/scam/verified flags' },
      { syntax: '.id / .chatinfo / .dc', description: 'Identifiers, chat stats, datacenter' },
    ],
  },
  {
    name: 'Utility Tools',
    category: 'tools',
    icon: <Wrench className="w-4 h-4" />,
    description: 'Everyday power tools — each one reachable inline as well.',
    inline: true,
    commands: [
      { syntax: '.calc', description: 'Safe AST maths evaluator (no eval())' },
      { syntax: '.weather <city>', description: 'wttr.in conditions' },
      { syntax: '.cur 100 USD INR', description: 'Frankfurter FX rates' },
      { syntax: '.qr / .qrread', description: 'Generate & decode QR images' },
      { syntax: '.tiny / .trt / .paste', description: 'Shorten, translate, paste.rs' },
      { syntax: '.gh <user> / .json', description: 'GitHub cards, JSON inspector' },
    ],
  },
  {
    name: 'Fun Pack',
    category: 'fun',
    icon: <Smile className="w-4 h-4" />,
    description: 'Memes, jokes, quotes, random cats & dogs (as images), animated dice, chooser, mocking and typewriter effects.',
    inline: true,
    commands: [
      { syntax: '.meme [sub]', description: 'Fresh meme image (NSFW-guarded)' },
      { syntax: '.cat / .dog', description: 'Random pet pictures' },
      { syntax: '.dice 🎲🎯🏀⚽🎰🎳', description: 'Animated Telegram dice' },
      { syntax: '.choose / .flip / .mock / .type', description: 'Quick games & effects' },
    ],
  },
  {
    name: 'Media Grabber',
    category: 'media',
    icon: <Music4 className="w-4 h-4" />,
    description: 'yt-dlp audio/video downloads with size caps, gTTS voice notes, Telegraph CDN uploads.',
    inline: false,
    commands: [
      { syntax: '.song <name>', description: 'Audio → ffmpeg mp3 when available' },
      { syntax: '.video <name>', description: '≤720p streamable video' },
      { syntax: '.tts [lang] <text>', description: 'Text-to-speech mp3' },
      { syntax: '.telegraph', description: 'Replied media → telegra.ph URL' },
    ],
  },
  {
    name: 'AI Assistant',
    category: 'ai',
    icon: <Brain className="w-4 h-4" />,
    description: 'Groq & Gemini through pure REST — zero SDK weight. Inline AI answers too.',
    inline: true,
    commands: [
      { syntax: '.ai / .groq / .gemini', description: 'Ask anything, auto or pinned engine' },
      { syntax: '.code / .explain', description: 'Generate or explain code' },
      { syntax: '.summarize [n]', description: 'Summarize the last N messages' },
    ],
  },
  {
    name: 'Broadcast',
    category: 'admin',
    icon: <Radio className="w-4 h-4" />,
    description: 'Carefully rate-limited reach-out tools.',
    inline: false,
    commands: [
      { syntax: '.tagall [text]', description: 'Mention all members (stoppable)' },
      { syntax: '.gcast <text>', description: 'Owner broadcast across groups' },
      { syntax: '.cancel', description: 'Stop running tagall' },
    ],
  },
  {
    name: 'PM Permit Shield',
    category: 'security',
    icon: <Lock className="w-4 h-4" />,
    description: 'Anti-spam DM wall with strike counting and auto-block at the limit — state persisted across restarts.',
    inline: false,
    commands: [
      { syntax: '.approve / .disapprove', description: 'DM whitelist management' },
      { syntax: '.block / .unblock', description: 'Instant contact control' },
      { syntax: '.pmguard on|off', description: 'Toggle the shield' },
    ],
  },
  {
    name: 'Sudo & Owner Tools',
    category: 'security',
    icon: <KeyRound className="w-4 h-4" />,
    description: 'Delegate powers to sudo users at runtime; owner-only eval/exec for full control.',
    inline: false,
    commands: [
      { syntax: '.addsudo / .remsudo / .sudolist', description: 'Runtime sudo management' },
      { syntax: '.eval / .exec', description: 'Owner-only Python & shell' },
      { syntax: '.plugins', description: 'Inspect the loaded registry' },
    ],
  },
];

const FILTERS = [
  { id: 'all', label: 'All Modules', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'core', label: 'Core & Status', icon: <Terminal className="w-3.5 h-3.5" /> },
  { id: 'admin', label: 'Admin & Broadcast', icon: <Cloud className="w-3.5 h-3.5" /> },
  { id: 'tools', label: 'Info & Tools', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'fun', label: 'Fun', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'media', label: 'Media', icon: <Music4 className="w-3.5 h-3.5" /> },
  { id: 'ai', label: 'AI', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'security', label: 'Security & Sudo', icon: <Shield className="w-3.5 h-3.5" /> },
];

export const PluginCatalog: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? PLUGINS : PLUGINS.filter((p) => p.category === filter);

  return (
    <div id="plugin-catalog" className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            id={`filter-${f.id}`}
            onClick={() => setFilter(f.id)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filter === f.id
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-700/70 hover:text-slate-200'
            }`}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {shown.map((plugin) => (
          <div
            key={plugin.name}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {plugin.icon}
                </span>
                <h3 className="font-semibold text-slate-100 text-sm">{plugin.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {plugin.inline && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    INLINE ✓
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  v5
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{plugin.description}</p>
            <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
              {plugin.commands.map((cmd) => (
                <div key={cmd.syntax} className="flex items-start gap-2 text-xs">
                  <code className="px-1.5 py-0.5 rounded bg-slate-950 text-sky-300 font-mono whitespace-nowrap">
                    {cmd.syntax}
                  </code>
                  <span className="text-slate-400">{cmd.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
