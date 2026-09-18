import React, { useState } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, Server, Shield, Zap, Info } from 'lucide-react';
import { SimMessage, InlineButton } from '../types';

export const TelegramSimulator: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      senderName: 'DcXuserbot Userbot (You)',
      avatarText: 'AB',
      text: `⚡ **DcXuserbot Dual-Client Engine Active!**\n\n• **Host:** AWS EC2 Cloud Instance (us-east-1)\n• **Architecture:** Telethon 1.34+ & Companion Assistant Bot\n• **Inline Support:** Enabled\n\n*Type commands starting with \`.\` (e.g. \`.alive\`, \`.help\`, \`.ping\`, \`.pmpermit\`) or click quick triggers below!*`,
      time: '12:00',
    },
  ]);

  const addMessage = (msg: Omit<SimMessage, 'id' | 'time'>) => {
    const newMsg: SimMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg.id;
  };

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // 1. Add user command message
    addMessage({
      sender: 'user',
      senderName: 'You (@Owner)',
      avatarText: 'ME',
      text: trimmed,
    });

    // 2. Process command
    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      if (lower === '.alive') {
        addMessage({
          sender: 'assistant',
          senderName: 'DcXAssistantBot (via Inline)',
          avatarText: '🤖',
          text: `⚡ **DcXuserbot Superior Userbot Online!**\n━━━━━━━━━━━━━━━━━━━━━━\n👑 **Owner:** DcX Master\n⏳ **Uptime:** \`4d 18h 32m 10s\`\n⚙️ **CPU / RAM:** \`4.2% / 18.5%\`\n🛰️ **Host:** \`AWS EC2 (us-east-1)\`\n🤖 **Assistant:** @DcXAssistantBot\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *Interactive inline buttons below (CatUserbot Dual-Client architecture):*`,
          replyMarkup: [
            [
              { text: '📊 System Stats', callback_data: 'cb_stats' },
              { text: '⚡ Ping Test', callback_data: 'cb_ping' },
            ],
            [
              { text: '📖 Help Menu', callback_data: 'cb_help' },
              { text: '☁️ AWS EC2 Spec', callback_data: 'cb_ec2' },
            ],
          ],
        });
      } else if (lower.startsWith('.help') || lower.startsWith('!help')) {
        addMessage({
          sender: 'assistant',
          senderName: 'DcXAssistantBot (via Inline Query)',
          avatarText: '🤖',
          text: `📖 **DcXuserbot Command Codex**\n━━━━━━━━━━━━━━━━━━━━━━\nPrefix: \`.\` | Sudo Prefix: \`!\`\nInteractive module browser powered by companion assistant bot.\n\nSelect a category below to explore available commands:`,
          replyMarkup: [
            [
              { text: '👮 Admin', callback_data: 'help_Admin' },
              { text: '🛠️ Tools', callback_data: 'help_Tools' },
            ],
            [
              { text: '🧠 AI Suite', callback_data: 'help_AI' },
              { text: '☁️ EC2 Status', callback_data: 'help_EC2' },
            ],
            [
              { text: '🎨 Media', callback_data: 'help_Media' },
              { text: '🛡️ PM Shield', callback_data: 'help_PM' },
            ],
            [
              { text: '📢 Broadcast', callback_data: 'help_Broadcast' },
              { text: '⚡ Alive Status', callback_data: 'alive_back' },
            ],
            [
              { text: '❌ Close', callback_data: 'help_close' },
            ],
          ],
        });
      } else if (lower === '.ping' || lower === '!ping') {
        addMessage({
          sender: 'assistant',
          senderName: 'DcXAssistantBot (via Inline Query)',
          avatarText: '🤖',
          text: `🏓 **Pong! Latency Benchmark**\n━━━━━━━━━━━━━━━━━━━━━━\n⚡ **Response Latency:** \`1.42 ms\`\n🛰️ **Cloud Node:** \`AWS EC2 (us-east-1)\`\n⏱️ **Server Time:** \`${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC\`\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *Live Interactive Telethon Benchmark via Inline Queries*`,
          replyMarkup: [
            [
              { text: '🔄 Re-Ping', callback_data: 'ping_refresh' },
              { text: '📊 System Metrics', callback_data: 'alive_stats' },
            ],
            [
              { text: '« Back to Alive', callback_data: 'alive_back' },
              { text: '🛰️ AWS Console', url: 'https://aws.amazon.com' },
            ],
          ],
        });
      } else if (lower === '.pmpermit' || lower === '.pm') {
        addMessage({
          sender: 'assistant',
          senderName: 'DcXuserbot Security Shield',
          avatarText: '🛡️',
          text: `👋 **Hello Stranger!**\n\nI am the automated security assistant for [DcX Master](tg://user?id=12345).\nMy master is busy on AWS cloud deployments and has not approved you to send private messages yet.\n\n⚠️ **Warning:** \`1/4 strikes\`.\nSpamming will cause an automatic block.`,
          replyMarkup: [
            [
              { text: '❓ Request Approval', callback_data: 'pm_req' },
              { text: '📢 Official Channel', url: 'https://t.me' },
            ],
          ],
        });
      } else if (lower.startsWith('.update') || lower.startsWith('!update')) {
        const isNow = lower.includes('now') || lower.includes('pull') || lower.includes('force');
        if (!isNow) {
          addMessage({
            sender: 'bot',
            senderName: 'DcXuserbot GitHub Sync',
            avatarText: '🔄',
            text: `🚀 **3 New Update(s) Found on GitHub!**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`7a1e9b2\` - Added auto-updater plugin (.update & !update)\n• \`4f8c210\` - Inline helper buttons parity with CatUserbot\n• \`9b3d014\` - AWS EC2 systemd auto-healing and 2GB swap optimizer\n━━━━━━━━━━━━━━━━━━━━━━\n💡 To pull the latest GitHub code and automatically restart your EC2 bot, run:\n👉 \`.update now\` (or \`!update now\`)`,
            replyMarkup: [
              [
                { text: '⚡ Pull Updates & Restart Now', callback_data: 'run_update_now' },
                { text: '« Dismiss', callback_data: 'help_close' },
              ],
            ],
          });
        } else {
          addMessage({
            sender: 'bot',
            senderName: 'DcXuserbot GitHub Sync',
            avatarText: '⚡',
            text: `📥 **Pulling latest commits from GitHub...**\n━━━━━━━━━━━━━━━━━━━━━━\n• Executed: \`git pull --rebase\`\n• Checking \`requirements.txt\` for new packages... (synchronized)\n• Executing: \`sudo systemctl restart dcxuserbot\`\n\n✅ **Updated successfully!** Bot restarted and live on AWS EC2.\nType \`.alive\` to verify latest version!`,
          });
        }
      } else if (lower.startsWith('.ai')) {
        const query = trimmed.replace(/^\.ai\s*/i, '') || 'Tell me about AWS EC2 and Telegram Userbots';
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Gemini AI',
          avatarText: 'AI',
          text: `🧠 **Gemini AI Response:**\n━━━━━━━━━━━━━━━━━━━━━━\nQuery: *"${query}"*\n\nRunning Telegram userbots on **AWS EC2 (Elastic Compute Cloud)** provides enterprise-grade 99.99% uptime, dedicated network interfaces to Telegram MTProto data centers, and prevents local battery/IP limits. With a 2GB swap file enabled, even an AWS Free Tier \`t2.micro\` or \`t3.micro\` instance runs dual-client Telethon bots 24/7 without out-of-memory errors!`,
        });
      } else if (lower === '.ec2' || lower.startsWith('.ec2')) {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot EC2 Monitor',
          avatarText: '☁️',
          text: `☁️ **AWS EC2 Live Metrics**\n━━━━━━━━━━━━━━━━━━━━━━\n• **Instance ID:** \`i-08a912bf8ec29ab3\`\n• **Type:** \`t3.micro (2 vCPU, 1GB RAM + 2GB Swap)\`\n• **Region:** \`us-east-1 (N. Virginia)\`\n• **CPU Utilization:** \`3.8%\`\n• **RAM Allocated:** \`284 MB / 988 MB\`\n• **Swap In-Use:** \`64 MB / 2048 MB\`\n• **Disk Storage:** \`4.8 GB / 20.0 GB (24%)\`\n• **Systemd Service:** \`dcxuserbot.service (active / running)\``,
        });
      } else if (lower.startsWith('.aidm') || lower.startsWith('!aidm')) {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Groq AI Intelligence',
          avatarText: '⚡',
          text: `⚡ **Groq AI Intelligence** (\`openai/gpt-oss-120b\`)\n━━━━━━━━━━━━━━━━━━━━━━\n👤 **Analyzed User:** [Alex Developer](tg://user?id=184920412) (@alex_dev)\n━━━━━━━━━━━━━━━━━━━━━━\n👋 Greetings Alex! Based on your bio *"Building distributed systems & high-throughput Telegram microservices"*, I've aligned our chat parameters. How can I assist you with your architecture or API workflows today?`,
        });
      } else if (lower.startsWith('.speedtest') || lower.startsWith('!speedtest')) {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Speedtest',
          avatarText: '🚀',
          text: `🚀 **AWS EC2 Speedtest Benchmark Results**\n━━━━━━━━━━━━━━━━━━━━━━\n📍 **Node Server:** \`Frankfurt Cloud Node, Germany\`\n🏓 **Ping:** \`1.42 ms\`\n📥 **Download:** \`942.15 Mbit/s\`\n📤 **Upload:** \`890.64 Mbit/s\`\n━━━━━━━━━━━━━━━━━━━━━━\n🛰️ **Cloud Node:** \`AWS EC2 (Frankfurt / Global 10Gbps Fiber)\``,
        });
      } else if (lower.startsWith('.join') || lower.startsWith('!join')) {
        const target = trimmed.replace(/^[.!](join)\s*/i, '') || '@telegram';
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Channel Suite',
          avatarText: '🔗',
          text: `✅ **Successfully joined:** **Official Telegram Channel** (\`${target}\`)\n• Type: Public Channel\n• Anti-FloodWait Protection: Active`,
        });
      } else if (lower === '.quote') {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Media Suite',
          avatarText: '🎨',
          text: `🎨 **Quotly Sticker Rendered!**\n[Sticker Preview Generated from replied message in WebP format with Telegram sticker attributes.]`,
        });
      } else {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Userbot',
          avatarText: 'AB',
          text: `ℹ️ Unrecognized command: \`${trimmed}\`\nType \`.help\` to view all commands or try \`.alive\`, \`.ping\`, \`.ai <prompt>\`, \`.ec2 status\`.`,
        });
      }
    }, 450);
  };

  const handleCallbackClick = (messageId: string, button: InlineButton) => {
    if (button.url) {
      window.open(button.url, '_blank');
      return;
    }

    const cb = button.callback_data;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        // Simulate callback state updates
        if (cb === 'cb_stats' || cb === 'alive_stats') {
          return {
            ...msg,
            text: `🖥️ **AWS EC2 System Breakdown**\n━━━━━━━━━━━━━━━━━━━━━━\n• **Instance:** \`i-08a912bf8ec29ab3\` (AWS us-east-1)\n• **CPU Cores:** \`2 vCPUs\` (@ 2.50GHz)\n• **CPU Load:** \`4.2%\`\n• **RAM Usage:** \`28% (276 MB / 988 MB)\`\n• **Swap Memory:** \`3.1% (64 MB / 2048 MB)\`\n• **Disk IO:** \`Read 1.2 MB/s | Write 420 KB/s\`\n• **Uptime:** \`4 days, 18 hours\``,
            replyMarkup: [
              [{ text: '« Back to Alive', callback_data: 'alive_back' }, { text: '⚡ Latency Ping', callback_data: 'alive_ping' }],
            ],
          };
        }
        if (cb === 'cb_ping' || cb === 'alive_ping' || cb === 'ping_refresh') {
          const randLat = (1.2 + Math.random() * 0.6).toFixed(2);
          return {
            ...msg,
            text: `⚡ **Live Latency Benchmark**\n━━━━━━━━━━━━━━━━━━━━━━\n• **AWS EC2 -> Telegram DC4:** \`${randLat} ms\`\n• **AWS EC2 -> Telegram DC2:** \`24.1 ms\`\n• **Packet Loss:** \`0.0%\`\n• **Clock Drift:** \`< 1 ms (NTP synced)\``,
            replyMarkup: [
              [
                { text: '🔄 Re-Ping', callback_data: 'ping_refresh' },
                { text: '📊 System Metrics', callback_data: 'alive_stats' },
              ],
              [
                { text: '« Back to Alive', callback_data: 'alive_back' },
                { text: '🛰️ AWS Console', url: 'https://aws.amazon.com' },
              ],
            ],
          };
        }
        if (cb === 'cb_alive_back' || cb === 'alive_back') {
          return {
            ...msg,
            text: `⚡ **DcXuserbot Superior Userbot Online!**\n━━━━━━━━━━━━━━━━━━━━━━\n👑 **Owner:** DcX Master\n⏳ **Uptime:** \`4d 18h 32m 10s\`\n⚙️ **CPU / RAM:** \`4.2% / 18.5%\`\n🛰️ **Host:** \`AWS EC2 (us-east-1)\`\n🤖 **Assistant:** @DcXAssistantBot\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *Interactive inline buttons below:*`,
            replyMarkup: [
              [
                { text: '📊 System Stats', callback_data: 'alive_stats' },
                { text: '⚡ Ping Test', callback_data: 'alive_ping' },
              ],
              [
                { text: '📖 Help Menu', callback_data: 'cb_help' },
                { text: '☁️ AWS EC2 Spec', callback_data: 'cb_ec2' },
              ],
            ],
          };
        }
        if (cb === 'cb_help' || cb === 'help_back' || cb === 'help_main') {
          return {
            ...msg,
            text: `📖 **DcXuserbot Command Codex**\n━━━━━━━━━━━━━━━━━━━━━━\nPrefix: \`.\` | Sudo Prefix: \`!\`\nInteractive module browser powered by companion assistant bot.\n\nSelect a category below to explore available commands:`,
            replyMarkup: [
              [
                { text: '👮 Admin', callback_data: 'help_Admin' },
                { text: '🛠️ Tools', callback_data: 'help_Tools' },
              ],
              [
                { text: '🧠 AI Suite', callback_data: 'help_AI' },
                { text: '☁️ EC2 Status', callback_data: 'help_EC2' },
              ],
              [
                { text: '🎨 Media', callback_data: 'help_Media' },
                { text: '🛡️ PM Shield', callback_data: 'help_PM' },
              ],
              [
                { text: '📢 Broadcast', callback_data: 'help_Broadcast' },
                { text: '⚡ Alive Status', callback_data: 'alive_back' },
              ],
              [
                { text: '❌ Close', callback_data: 'help_close' },
              ],
            ],
          };
        }
        if (cb === 'help_Admin' || cb === 'help_admin') {
          return {
            ...msg,
            text: `👮 **Group Moderation:**\n• \`.ban <reply/user>\` - Ban user\n• \`.unban <reply/user>\` - Unban user\n• \`.mute <reply/user>\` - Mute in group\n• \`.kick <reply/user>\` - Kick user\n• \`.purge <reply>\` - Bulk delete messages\n• \`.pin\` - Pin message silently or loudly\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_Tools' || cb === 'help_tools') {
          return {
            ...msg,
            text: `🛠️ **Utility Arsenal:**\n• \`.ping\` - Real-time latency with interactive inline buttons\n• \`.speedtest\` - Run network speed benchmark\n• \`.whois <reply>\` - Extract full user info & DC\n• \`.join <target>\` - Join channels & private invite hashes\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_AI' || cb === 'help_ai') {
          return {
            ...msg,
            text: `🧠 **Groq & Gemini AI Intelligence:**\n• \`.aidm <query>\` - Profile scanner with Groq openai/gpt-oss-120b\n• \`.ai <prompt>\` - Ask Gemini AI directly\n• \`.summarize\` - Summarize replied chat messages\n• \`.code <prompt>\` - Generate & inspect code snippets\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_EC2' || cb === 'help_ec2' || cb === 'cb_ec2') {
          return {
            ...msg,
            text: `☁️ **AWS EC2 Cloud Controls:**\n• \`.ec2 status\` - Live instance load, CPU, RAM & uptime\n• \`.ec2 reboot\` - Soft reboot the bot daemon\n• \`.ec2 logs\` - Stream recent daemon journalctl output\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_Media' || cb === 'help_media') {
          return {
            ...msg,
            text: `🎨 **Media & Converters:**\n• \`.quote\` - Create Quotly Telegram sticker\n• \`.song <name>\` - Download mp3 via yt-dlp\n• \`.video <name>\` - Download mp4 video\n• \`.telegraph\` - Upload media to Telegraph CDN\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_PM' || cb === 'help_pm') {
          return {
            ...msg,
            text: `🛡️ **Anti-PM Spam Shield:**\n• \`.approve\` - Whitelist user for PM\n• \`.disapprove\` - Remove user from whitelist\n• \`.block\` - Immediately block user\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_Broadcast' || cb === 'help_broadcast') {
          return {
            ...msg,
            text: `📢 **Broadcast & Mentions:**\n• \`.tagall <message>\` - Mention all members\n• \`.gcast <message>\` - Global broadcast to all chats\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click 'Back to Codex' to browse other categories or 'Close' to dismiss.*`,
            replyMarkup: [[{ text: '« Back to Codex', callback_data: 'help_main' }, { text: '❌ Close', callback_data: 'help_close' }]],
          };
        }
        if (cb === 'help_close') {
          return {
            ...msg,
            text: `❌ **Command Codex closed.**\nType \`.help\` anytime to re-open the interactive menu.`,
            replyMarkup: undefined,
          };
        }
        if (cb === 'run_update_now') {
          return {
            ...msg,
            text: `📥 **Pulling latest commits from GitHub...**\n━━━━━━━━━━━━━━━━━━━━━━\n• Executed: \`git pull --rebase\`\n• Checking \`requirements.txt\` for new packages... (synchronized)\n• Executing: \`sudo systemctl restart dcxuserbot\`\n\n✅ **Updated successfully!** Bot restarted and live on AWS EC2.\nType \`.alive\` to verify latest version!`,
            replyMarkup: undefined,
          };
        }
        if (cb === 'pm_req') {
          return {
            ...msg,
            text: `✅ **Approval Request Sent!**\nA notification was dispatched to [DcX Master]. You will be granted permission once reviewed.`,
            replyMarkup: undefined,
          };
        }

        return msg;
      })
    );
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'init-1',
        sender: 'bot',
        senderName: 'DcXuserbot Userbot (You)',
        avatarText: 'AB',
        text: `⚡ **DcXuserbot Dual-Client Engine Active!**\n\n• **Host:** AWS EC2 Cloud Instance (us-east-1)\n• **Architecture:** Telethon 1.34+ & Companion Assistant Bot\n• **Inline Support:** Enabled\n\n*Type commands starting with \`.\` (e.g. \`.alive\`, \`.help\`, \`.ping\`, \`.pmpermit\`) or click quick triggers below!*`,
        time: '12:00',
      },
    ]);
  };

  const quickCommands = [
    { cmd: '.update', label: '.update (GitHub Sync)', icon: RefreshCw },
    { cmd: '.alive', label: '.alive (Interactive Buttons)', icon: Zap },
    { cmd: '.aidm', label: '.aidm (Groq AI Profile)', icon: Sparkles },
    { cmd: '.speedtest', label: '.speedtest (Frankfurt)', icon: Server },
    { cmd: '.join @telegram', label: '.join (@channel / link)', icon: Info },
    { cmd: '.help', label: '.help (Codex Menu)', icon: Info },
    { cmd: '.ping', label: '.ping (Latency)', icon: RefreshCw },
    { cmd: '.ec2 status', label: '.ec2 status (AWS Metrics)', icon: Server },
    { cmd: '.pmpermit', label: '.pmpermit (Anti-Spam Shield)', icon: Shield },
  ];

  return (
    <div id="telegram-simulator-wrapper" className="max-w-4xl mx-auto space-y-4">
      {/* Simulation Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Live Telegram Chat & Dual-Client Simulator
            </h3>
            <p className="text-[11px] text-slate-400">
              Experience real-time commands & interactive inline keyboard buttons just like CatUserbot on Telegram.
            </p>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Simulator</span>
        </button>
      </div>

      {/* Telegram Chat Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
        {/* Chat Window Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                AB
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-200">Saved Messages & Testing Sandbox</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono">
                  Dual-Client
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-mono">online • AWS EC2 Node active</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-mono">Telethon v1.34+</span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : msg.sender === 'assistant'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {msg.avatarText}
                </div>

                {/* Bubble Container */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                  <div className="flex items-center space-x-2 px-1">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{msg.time}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans shadow-md ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Inline Keyboard Buttons (CatUserbot style) */}
                    {msg.replyMarkup && msg.replyMarkup.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-emerald-500/20 space-y-1.5">
                        {msg.replyMarkup.map((row, rowIdx) => (
                          <div
                            key={rowIdx}
                            className={`grid gap-1.5 ${
                              row.length === 1
                                ? 'grid-cols-1'
                                : row.length === 2
                                ? 'grid-cols-2'
                                : row.length === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-4'
                            }`}
                          >
                            {row.map((btn, btnIdx) => (
                              <button
                                key={btnIdx}
                                onClick={() => handleCallbackClick(msg.id, btn)}
                                className="px-3 py-2 text-[11px] font-semibold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-600/40 hover:border-emerald-400/70 transition shadow-sm active:scale-[0.98] text-center flex items-center justify-center space-x-1"
                              >
                                <span>{btn.text}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Command Chips */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 font-mono uppercase whitespace-nowrap">
            Quick Tests:
          </span>
          {quickCommands.map((item) => (
            <button
              key={item.cmd}
              onClick={() => handleCommand(item.cmd)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-800 text-slate-300 hover:text-sky-300 hover:bg-slate-700 border border-slate-700/60 whitespace-nowrap transition"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(inputVal);
            setInputVal('');
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            id="telegram-chat-input"
            type="text"
            placeholder="Type a userbot command (e.g. .alive, .help, .ping, .ai)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition shadow-md shadow-sky-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
