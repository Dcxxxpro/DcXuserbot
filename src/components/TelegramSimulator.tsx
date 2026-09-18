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
      } else if (lower.startsWith('.help')) {
        addMessage({
          sender: 'assistant',
          senderName: 'DcXAssistantBot (via Inline)',
          avatarText: '🤖',
          text: `**DcXuserbot Helper**\n**Provided by** DcX Assistant\n━━━━━━━━━━━━━━━━━━━━━━\nPrefix: \`.\` | Active Modules: \`180+\`\nClick any category below to browse commands:`,
          replyMarkup: [
            [
              { text: 'ℹ️ Info', callback_data: 'help_info' },
            ],
            [
              { text: '👮 Admin (10)', callback_data: 'help_admin' },
              { text: '🤖 Bot (2)', callback_data: 'help_bot' },
            ],
            [
              { text: '🎭 Fun (29)', callback_data: 'help_fun' },
              { text: '🧩 Misc (13)', callback_data: 'help_misc' },
            ],
            [
              { text: '🧰 Tools (26)', callback_data: 'help_tools' },
              { text: '📦 Utils (49)', callback_data: 'help_utils' },
            ],
            [
              { text: '➕ Extra (27)', callback_data: 'help_extra' },
              { text: '⚰️ Useless (4)', callback_data: 'help_useless' },
            ],
            [
              { text: '🔒 Close Menu', callback_data: 'help_close' },
            ],
          ],
        });
      } else if (lower === '.ping') {
        addMessage({
          sender: 'bot',
          senderName: 'DcXuserbot Userbot',
          avatarText: 'AB',
          text: `🏓 **Pong!** \`38.4 ms\`\n🛰️ Data Center: **Telegram DC4 (Amsterdam)**\n☁️ Server: **AWS EC2 (us-east-1)**`,
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
        if (cb === 'cb_stats') {
          return {
            ...msg,
            text: `🖥️ **AWS EC2 System Breakdown**\n━━━━━━━━━━━━━━━━━━━━━━\n• **Instance:** \`i-08a912bf8ec29ab3\` (AWS us-east-1)\n• **CPU Cores:** \`2 vCPUs\` (@ 2.50GHz)\n• **CPU Load:** \`4.2%\`\n• **RAM Usage:** \`28% (276 MB / 988 MB)\`\n• **Swap Memory:** \`3.1% (64 MB / 2048 MB)\`\n• **Disk IO:** \`Read 1.2 MB/s | Write 420 KB/s\`\n• **Uptime:** \`4 days, 18 hours\``,
            replyMarkup: [
              [{ text: '« Back to Alive', callback_data: 'cb_alive_back' }],
            ],
          };
        }
        if (cb === 'cb_ping') {
          return {
            ...msg,
            text: `⚡ **Live Latency Benchmark**\n━━━━━━━━━━━━━━━━━━━━━━\n• **AWS EC2 -> Telegram DC4:** \`26.4 ms\`\n• **AWS EC2 -> Telegram DC2:** \`41.2 ms\`\n• **Packet Loss:** \`0.0%\`\n• **Clock Drift:** \`< 1 ms (NTP synced)\``,
            replyMarkup: [
              [{ text: '« Back to Alive', callback_data: 'cb_alive_back' }],
            ],
          };
        }
        if (cb === 'cb_alive_back') {
          return {
            ...msg,
            text: `⚡ **DcXuserbot Superior Userbot Online!**\n━━━━━━━━━━━━━━━━━━━━━━\n👑 **Owner:** DcX Master\n⏳ **Uptime:** \`4d 18h 32m 10s\`\n⚙️ **CPU / RAM:** \`4.2% / 18.5%\`\n🛰️ **Host:** \`AWS EC2 (us-east-1)\`\n🤖 **Assistant:** @DcXAssistantBot\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *Interactive inline buttons below:*`,
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
          };
        }
        if (cb === 'cb_help' || cb === 'help_back') {
          return {
            ...msg,
            text: `**DcXuserbot Helper**\n**Provided by** DcX Assistant\n━━━━━━━━━━━━━━━━━━━━━━\nPrefix: \`.\` | Active Modules: \`180+\`\nClick any category below to browse commands:`,
            replyMarkup: [
              [
                { text: 'ℹ️ Info', callback_data: 'help_info' },
              ],
              [
                { text: '👮 Admin (10)', callback_data: 'help_admin' },
                { text: '🤖 Bot (2)', callback_data: 'help_bot' },
              ],
              [
                { text: '🎭 Fun (29)', callback_data: 'help_fun' },
                { text: '🧩 Misc (13)', callback_data: 'help_misc' },
              ],
              [
                { text: '🧰 Tools (26)', callback_data: 'help_tools' },
                { text: '📦 Utils (49)', callback_data: 'help_utils' },
              ],
              [
                { text: '➕ Extra (27)', callback_data: 'help_extra' },
                { text: '⚰️ Useless (4)', callback_data: 'help_useless' },
              ],
              [
                { text: '🔒 Close Menu', callback_data: 'help_close' },
              ],
            ],
          };
        }
        if (cb === 'help_info') {
          return {
            ...msg,
            text: `ℹ️ **DcXuserbot Architecture & Info:**\n━━━━━━━━━━━━━━━━━━━━━━\n• **Core:** Dual-Client Telethon Engine\n• **Companion Bot:** Handles inline keyboards, PM permits, and interactive menus.\n• **Host:** AWS EC2 Cloud VM with 2GB Swap Memory\n• **Uptime:** 24/7 Background Systemd Service\n• **Modules:** 180+ plugins ported from the top Telegram userbots`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_admin') {
          return {
            ...msg,
            text: `👮 **Admin Modules (10):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.ban <reply/id>\` - Permanent ban\n• \`.unban <reply/id>\` - Remove group ban\n• \`.mute <reply/id>\` - Mute sender in group\n• \`.unmute <reply/id>\` - Lift mute restrictions\n• \`.kick <reply/id>\` - Kick member\n• \`.purge <reply>\` - Lightning bulk message purge\n• \`.pin\` - Silent or alert pin\n• \`.promote <title>\` - Grant admin permissions\n• \`.demote\` - Revoke admin privileges\n• \`.zombies\` - Clean deleted Telegram accounts`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_bot') {
          return {
            ...msg,
            text: `🤖 **Bot Companion Modules (2):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.botstart\` - Check companion bot status\n• \`.inline\` - Inline menu generator & token validator`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_fun') {
          return {
            ...msg,
            text: `🎭 **Fun Modules (29):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.quote\` - Create Quotly Telegram sticker\n• \`.meme <top> ; <bottom>\` - Generate meme\n• \`.type <text>\` - Typewriter animation\n• \`.slap <reply>\` - Slap someone with funny item\n• \`.dice\` - Roll animated Telegram dice\n• \`.roast <reply>\` - Hilarious burns & roasts`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_misc') {
          return {
            ...msg,
            text: `🧩 **Misc Modules (13):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.whois <reply>\` - Inspect User ID, DC, status\n• \`.id\` - Fetch chat & sender IDs\n• \`.time\` - Current local and UTC times\n• \`.ud <query>\` - Urban Dictionary definition\n• \`.google <query>\` - Instant search links`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_tools') {
          return {
            ...msg,
            text: `🧰 **Tools Modules (26):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.ping\` - Sub-millisecond latency measurement\n• \`.speedtest\` - Live network speed test\n• \`.calc <math>\` - Built-in calculator\n• \`.wiki <query>\` - Wikipedia article lookup\n• \`.shorturl <url>\` - Shorten link`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_utils') {
          return {
            ...msg,
            text: `📦 **Utils Modules (49):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.song <name>\` - High quality MP3 via yt-dlp\n• \`.video <name>\` - Download YouTube video\n• \`.telegraph\` - Upload media to Telegraph CDN\n• \`.ocr\` - Optical Character Recognition\n• \`.tts <text>\` - Text to speech audio clip`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_extra') {
          return {
            ...msg,
            text: `➕ **Extra Modules (27):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.tagall <text>\` - Mention all group members\n• \`.gcast <text>\` - Global broadcast to all chats\n• \`.ai <prompt>\` - Google Gemini AI assistant\n• \`.ec2 status\` - Live AWS cloud metrics\n• \`.pmpermit\` - Anti-spam security shield`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_useless') {
          return {
            ...msg,
            text: `⚰️ **Useless Modules (4):**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.f\` - Press F to pay respects\n• \`.shrug\` - ¯\\_(ツ)_/¯\n• \`.tableflip\` - (╯°□°)╯︵ ┻━┻\n• \`.unflip\` - ┬─┬ノ( º _ ºノ)`,
            replyMarkup: [[{ text: '« Back to Helper', callback_data: 'help_back' }]],
          };
        }
        if (cb === 'help_close') {
          return {
            ...msg,
            text: `🔒 **Helper menu closed by user.**\nType \`.help\` anytime to re-open the interactive menu.`,
            replyMarkup: undefined,
          };
        }
        if (cb === 'help_ec2' || cb === 'cb_ec2') {
          return {
            ...msg,
            text: `☁️ **AWS EC2 Cloud Plugin:**\n━━━━━━━━━━━━━━━━━━━━━━\n• \`.ec2 status\` - Live CPU/RAM/Swap & instance metrics\n• \`.ec2 reboot\` - Graceful restart of dcxuserbot.service\n• \`.ec2 logs\` - Stream recent journalctl output`,
            replyMarkup: [[{ text: '« Back to Index', callback_data: 'help_back' }]],
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
    { cmd: '.alive', label: '.alive (Interactive Buttons)', icon: Zap },
    { cmd: '.help', label: '.help (Codex Menu)', icon: Info },
    { cmd: '.ping', label: '.ping (Latency)', icon: RefreshCw },
    { cmd: '.ec2 status', label: '.ec2 status (AWS Metrics)', icon: Server },
    { cmd: '.pmpermit', label: '.pmpermit (Anti-Spam Shield)', icon: Shield },
    { cmd: '.ai Explain AWS EC2 benefits for userbot', label: '.ai (Gemini)', icon: Sparkles },
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
