import React, { useState } from 'react';
import { Shield, Sparkles, Image, Wrench, Radio, Lock, Cloud, Terminal, CheckCircle2 } from 'lucide-react';

interface PluginCard {
  name: string;
  category: string;
  sourceInspiration: string;
  description: string;
  inlineButtons: boolean;
  commands: {
    syntax: string;
    description: string;
  }[];
}

export const PluginCatalog: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const plugins: PluginCard[] = [
    {
      name: 'Alive & System Profile',
      category: 'core',
      sourceInspiration: 'CatUserbot & Ultroid',
      description: 'Dynamic userbot status card with uptime, live CPU/RAM metrics, and interactive inline callback buttons powered by the companion assistant bot.',
      inlineButtons: true,
      commands: [
        { syntax: '.alive', description: 'Show userbot status with inline buttons for stats and latency' },
        { syntax: '.ping', description: 'Measure instant round-trip response time to Telegram data centers' },
      ],
    },
    {
      name: 'Interactive Codex Help Menu',
      category: 'core',
      sourceInspiration: 'CatUserbot & Paperplane',
      description: 'Categorized inline help menu with pagination buttons, interactive category navigation, and quick syntax lookups.',
      inlineButtons: true,
      commands: [
        { syntax: '.help', description: 'Open interactive inline help category navigator' },
        { syntax: '.help <category>', description: 'Directly output command reference for a specific module' },
      ],
    },
    {
      name: 'PM Anti-Spam Security Shield',
      category: 'security',
      sourceInspiration: 'CatUserbot & HellBot',
      description: 'Prevents unsolicited direct message spam. Issues warning strikes and allows strangers to request approval via interactive inline buttons before auto-blocking.',
      inlineButtons: true,
      commands: [
        { syntax: '.approve', description: 'Whitelist replied user to send private messages' },
        { syntax: '.disapprove', description: 'Remove user from whitelist' },
        { syntax: '.block', description: 'Immediately block user and stop incoming messages' },
      ],
    },
    {
      name: 'Group Administration & Moderation',
      category: 'admin',
      sourceInspiration: 'Userge & Telethon Userbots',
      description: 'High-speed administrative suite with bulk purges, permission mutes, kicks, bans, and silent or notify pins.',
      inlineButtons: false,
      commands: [
        { syntax: '.ban <reply/id>', description: 'Ban user from group' },
        { syntax: '.mute <reply/id>', description: 'Mute user permissions' },
        { syntax: '.purge', description: 'Fast bulk delete from replied message down to latest' },
        { syntax: '.pin [loud]', description: 'Pin message with or without notification' },
      ],
    },
    {
      name: 'Media, Quotly & Audio Grabber',
      category: 'media',
      sourceInspiration: 'CatUserbot & QuotLy',
      description: 'Converts chat messages into custom Quotly Telegram sticker webp files, downloads high-bitrate MP3/MP4 via yt-dlp, and uploads images to Telegraph.',
      inlineButtons: false,
      commands: [
        { syntax: '.quote', description: 'Generate Quotly sticker quote from replied message' },
        { syntax: '.song <name>', description: 'Search and download MP3 audio' },
        { syntax: '.telegraph', description: 'Upload replied photo/video to Telegraph' },
      ],
    },
    {
      name: 'Google Gemini AI Integration',
      category: 'ai',
      sourceInspiration: 'Modern GenAI Upgrade',
      description: 'Connects directly to Google Gemini 2.5 Flash API to answer questions, explain concepts, summarize conversations, and write code snippets inside Telegram.',
      inlineButtons: false,
      commands: [
        { syntax: '.ai <prompt>', description: 'Ask Gemini AI any question or task' },
        { syntax: '.summarize', description: 'Summarize chat messages or replied long text' },
        { syntax: '.code <query>', description: 'Generate formatted code snippet' },
      ],
    },
    {
      name: 'GitHub Cloud Auto-Updater',
      category: 'cloud',
      sourceInspiration: 'Telegram Git Integration',
      description: 'Check commits from your connected GitHub repository and pull updates directly into your AWS EC2 instance with dependency syncing and auto-restarting.',
      inlineButtons: true,
      commands: [
        { syntax: '.update', description: 'Check for new commits on GitHub and inspect changelog preview' },
        { syntax: '.update now (or !update)', description: 'Pull latest code via git pull, install any new requirements, and restart systemd service' },
      ],
    },
    {
      name: 'AWS EC2 Instance Monitor & Daemon',
      category: 'cloud',
      sourceInspiration: 'Cloud Enterprise Upgrade',
      description: 'Manage and monitor your AWS EC2 host directly through Telegram. Check CPU load, RAM memory, swap allocation, disk space, and trigger soft daemon restarts.',
      inlineButtons: false,
      commands: [
        { syntax: '.ec2 status', description: 'Display live AWS EC2 CPU, RAM, Swap and Disk metrics' },
        { syntax: '.ec2 reboot', description: 'Trigger graceful reload of dcxuserbot.service systemd unit' },
      ],
    },
    {
      name: 'Groq AI Profile Intelligence (AIDM)',
      category: 'ai',
      sourceInspiration: 'AsyncGroq & Telethon User Profiling',
      description: 'Scans target user profile (First Name, Bio, Username) via GetFullUserRequest and generates intelligent context-aware responses with openai/gpt-oss-120b.',
      inlineButtons: false,
      commands: [
        { syntax: '.aidm [query]', description: 'Analyze replied user or private chat partner with Groq openai/gpt-oss-120b' },
        { syntax: '!aidm [query]', description: 'Sudo-executable profile intelligence analysis' },
      ],
    },
    {
      name: 'Channel & Chat Auto-Joiner',
      category: 'tools',
      sourceInspiration: 'Telethon Channel Suite',
      description: 'Seamlessly joins public usernames (@channel), links, and private invite hashes (t.me/+hash or joinchat/hash) with floodwait and duplication safety.',
      inlineButtons: false,
      commands: [
        { syntax: '.join <target>', description: 'Join @channel, public t.me link, or private invite hash' },
        { syntax: '!join <target>', description: 'Sudo-executable chat joiner command' },
      ],
    },
    {
      name: 'Global Broadcast & TagAll',
      category: 'broadcast',
      sourceInspiration: 'HellBot & Ultroid',
      description: 'Safely mention members with throttling delays to prevent FloodWait rate limits, and broadcast announcements to owned groups.',
      inlineButtons: false,
      commands: [
        { syntax: '.tagall [text]', description: 'Mention group members with safe rate-limit delay' },
        { syntax: '.gcast <text>', description: 'Broadcast message to all chats you own' },
      ],
    },
  ];

  const filtered = selectedFilter === 'all'
    ? plugins
    : plugins.filter((p) => p.category === selectedFilter);

  return (
    <div id="plugin-catalog-container" className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Upgraded Plugins & Commands Codex
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Curated, refactored, and upgraded to Python 3.11+ asynchronous standards from CatUserbot, Paperplane, HellBot, Ultroid, and Userge.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'core', 'security', 'admin', 'media', 'ai', 'cloud'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                  selectedFilter === cat
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Plugins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((plugin) => (
          <div
            key={plugin.name}
            className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition space-y-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {plugin.name}
                  </h3>
                  <span className="text-[11px] text-sky-400/90 font-mono">
                    Inspired by: {plugin.sourceInspiration}
                  </span>
                </div>

                {plugin.inlineButtons && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium shrink-0 flex items-center gap-1">
                    <span>⚡</span> Inline Buttons
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                {plugin.description}
              </p>
            </div>

            {/* Commands List */}
            <div className="space-y-2 pt-2 border-t border-slate-800/70">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                Commands & Usage:
              </span>
              <div className="space-y-1.5">
                {plugin.commands.map((cmd) => (
                  <div
                    key={cmd.syntax}
                    className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-2 text-xs"
                  >
                    <code className="font-mono text-sky-300 text-[11px] shrink-0">
                      {cmd.syntax}
                    </code>
                    <span className="text-slate-400 text-[11px] text-right">
                      {cmd.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
