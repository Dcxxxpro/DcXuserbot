import React, { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Bot, Zap, Sparkles } from 'lucide-react';
import { SimMessage, InlineButton } from '../types';

const ASSISTANT = 'DcXAssistantBot';

const now = () => new Date().toTimeString().slice(0, 5);

let seq = 0;
const nextId = () => `msg-${++seq}`;

const BOT_AVATAR = '⚡';

function ownerMsg(text: string): SimMessage {
  return {
    id: nextId(), sender: 'user', senderName: 'You (Owner)', avatarText: '🧑‍💻',
    text, time: now(),
  };
}

function botMsg(text: string, extra?: Partial<SimMessage>): SimMessage {
  return {
    id: nextId(), sender: 'bot', senderName: 'DcXuserbot', avatarText: BOT_AVATAR,
    text, time: now(), ...extra,
  };
}

function inlineMsg(text: string, extra?: Partial<SimMessage>): SimMessage {
  return {
    id: nextId(), sender: 'assistant', senderName: `@${ASSISTANT} (inline)`,
    avatarText: '🤖', text, time: now(), ...extra,
  };
}

const WELCOME: SimMessage[] = [
  botMsg(
    `⚡ DcXuserbot v5 is online\n\n` +
    `• 76 chat commands • 26 inline commands\n` +
    `• Inline mode: type @${ASSISTANT} <command> in ANY chat\n` +
    `• .sysinfo & .speedtest render live instance IMAGES\n\n` +
    `Try the quick triggers below — including inline-mode demos!`
  ),
];

// ── canned scenario responses ────────────────────────────────────────────
const ALIVE_BUTTONS: InlineButton[][] = [
  [
    { text: '📊 Stats', callback_data: 'stats' },
    { text: '🏓 Ping', callback_data: 'ping' },
  ],
  [
    { text: '📖 Command Codex', callback_data: 'codex' },
    { text: '⭐ Source', url: 'https://github.com/Dcxxxpro/DcXuserbot' },
  ],
];

const CODEX_BUTTONS: InlineButton[][] = [
  [
    { text: '📡 Status (4)', callback_data: 'cat_status' },
    { text: '🖥️ System (7)', callback_data: 'cat_system' },
  ],
  [
    { text: '👮 Admin (14)', callback_data: 'cat_admin' },
    { text: '🎉 Fun (11)', callback_data: 'cat_fun' },
  ],
  [
    { text: '🧠 AI (6)', callback_data: 'cat_ai' },
    { text: '🛠️ Tools (10)', callback_data: 'cat_tools' },
  ],
  [
    { text: '🏓 Ping', callback_data: 'ping' },
    { text: '❌ Close', callback_data: 'close' },
  ],
];

const CAT_TEXTS: Record<string, string> = {
  cat_status:
    `📂 Status — page 1/1\n━━━━━━━━━━━━━━━━\n` +
    `• \`.alive\` — Interactive alive card\n• \`.ping\` — Real latency\n` +
    `• \`.uptime\` — Bot + host uptime\n• \`.stats\` — Instant metrics`,
  cat_system:
    `📂 System — page 1/1\n━━━━━━━━━━━━━━━━\n` +
    `• \`.sysinfo\` — 🖼 instance dashboard image\n• \`.speedtest [quick]\` — 🖼 network scoreboard\n` +
    `• \`.logs\` — tail service logs\n• \`.update / .restart\` — self-update\n• \`.clean\` — purge caches`,
  cat_admin:
    `📂 Admin — page 1/2\n━━━━━━━━━━━━━━━━\n` +
    `• \`.ban .unban .kick .mute .unmute\`\n• \`.promote [full] .demote\`\n` +
    `• \`.pin [loud] .unpin [all]\`\n• \`.purge .del .zombies .invite .kickme\``,
  cat_fun:
    `📂 Fun — page 1/2\n━━━━━━━━━━━━━━━━\n` +
    `• \`.meme .cat .dog\` — image drops\n• \`.joke .quote\`\n` +
    `• \`.dice .flip .choose\`\n• \`.mock .slap .type\``,
  cat_ai:
    `📂 AI — page 1/1\n━━━━━━━━━━━━━━━━\n` +
    `• \`.ai .groq .gemini\` — pure REST engines\n• \`.code .explain\`\n• \`.summarize [n]\``,
  cat_tools:
    `📂 Tools — page 1/2\n━━━━━━━━━━━━━━━━\n` +
    `• \`.calc .cur .weather .trt\`\n• \`.qr .qrread .tiny .paste .gh .json\``,
};

function respond(input: string): SimMessage[] {
  const text = input.trim();
  const lower = text.toLowerCase();

  // INLINE MODE — the headline feature
  if (lower.startsWith('@' + ASSISTANT.toLowerCase())) {
    const query = lower.replace('@' + ASSISTANT.toLowerCase(), '').trim();
    if (query.startsWith('ping')) {
      return [inlineMsg(
        `🏓 Pong! \`1.8 ms\`\n🕒 ${new Date().toUTCString().slice(17, 25)} UTC\n⏳ Uptime \`2d 7h\``,
        { replyMarkup: [[{ text: '🔄 Re-ping', callback_data: 'ping' }, { text: '⚡ Alive', callback_data: 'alive' }]] }
      )];
    }
    if (query.startsWith('speedtest')) {
      return [inlineMsg(
        `⚡ DcX Speed Test (quick)\n⬇️ Download \`512.37 Mbps\`  ⬆️ Upload \`198.62 Mbps\`\n🏓 Ping \`9.4 ms\`  📶 Jitter \`2.1 ms\`\n🖥 Cloudflare Edge • 🌍 DcX Edge Cloud, Frankfurt`,
        { mediaUrl: '/demo_speedtest.png', mediaLabel: 'speedtest scoreboard (rendered live by the bot)' }
      )];
    }
    if (query.startsWith('sysinfo')) {
      return [inlineMsg(
        `🖥️ DcX Instance Telemetry\nHost: \`docker-01\` (Docker/K8s) • Debian 12\nCPU: \`8T 24%\`  RAM: \`1.2 GiB / 4 GiB\`  Uptime: \`6d 2h\``,
        { mediaUrl: '/demo_sysinfo.png', mediaLabel: 'sysinfo dashboard (rendered live by the bot)' }
      )];
    }
    if (query.startsWith('meme')) {
      return [inlineMsg(
        `😂 **When the inline query deploys first try**\nr/ProgrammerHumor • 👍 2.4k`
      )];
    }
    if (query.startsWith('help') || !query) {
      return [inlineMsg(
        `📖 DcXuserbot Command Codex\n━━━━━━━━━━━━━━━━\n👑 Owner: DcX Master\n⚡ Prefixes: \`.\` (owner) • \`!\` (sudo)\n🧩 13 modules • 76 commands • 26 inline\n⌨️ Inline: @${ASSISTANT} <command>`,
        { replyMarkup: CODEX_BUTTONS }
      )];
    }
    if (query.startsWith('calc')) {
      return [inlineMsg(`🧮 \`${query.slice(4).trim() || '2+2'}\` = **${query.includes('2+2') || !query.slice(4).trim() ? '4' : '…(evaluated safely)'}**`)];
    }
    return [inlineMsg(
      `⌨️ Inline command: \`${query.split(' ')[0]}\`\n\nThat command is dispatched to the userbot and answered here.\nUse \`help\` to browse all 26 inline commands.`
    )];
  }

  // CLASSIC COMMANDS
  if (lower.startsWith('.alive')) {
    return [botMsg(
      `⚡ DcXuserbot is alive & savage\n━━━━━━━━━━━━━━━━\n👑 Owner: DcX Master\n🛰️ DcX: \`5.0.0\` • Prefix: \`.\`\n⏳ Uptime: \`2d 7h 12m\`\n⚙️ CPU / RAM: \`18% / 31%\`\n🧩 76 chat • 26 inline commands\n━━━━━━━━━━━━━━━━\n✨ Type @${ASSISTANT} <command> anywhere to control me inline.`,
      { replyMarkup: ALIVE_BUTTONS }
    )];
  }
  if (lower.startsWith('.ping')) {
    return [botMsg(`🏓 Pong! \`0.9 ms\`\n⏳ Uptime: \`2d 7h 12m\`\n🛰️ DcX: \`5.0.0\``)];
  }
  if (lower.startsWith('.sysinfo')) {
    return [botMsg(
      `🖥️ DcX Instance Telemetry\n━━━━━━━━━━━━━━━━\n• Host: \`docker-01\` (Docker/K8s)\n• Distro: \`Debian GNU/Linux 12\`\n• CPU: \`8T 24%\` • RAM: \`1.2 GiB / 4 GiB\`\n• Uptime: \`6d 2h\` • IP: \`203.0.113.20\``,
      { mediaUrl: '/demo_sysinfo.png', mediaLabel: 'Rendered PNG returned by .sysinfo — works on any host' }
    )];
  }
  if (lower.startsWith('.speedtest')) {
    return [botMsg(
      `⚡ DcX Speed Test (deep)\n━━━━━━━━━━━━━━━━\n⬇️ Download: \`512.37 Mbps\`  ⬆️ Upload: \`198.62 Mbps\`\n🏓 Ping: \`9.4 ms\`  📶 Jitter: \`2.1 ms\`\n🖥 Cloudflare Edge • 🌍 DcX Edge Cloud (Frankfurt)`,
      { mediaUrl: '/demo_speedtest.png', mediaLabel: 'Rendered PNG returned by .speedtest' }
    )];
  }
  if (lower.startsWith('.help')) {
    return [botMsg(
      `📖 DcXuserbot Command Codex\n━━━━━━━━━━━━━━━━\n🧩 13 modules • 76 commands\n⌨️ Inline mode: @${ASSISTANT} <command>`,
      { replyMarkup: CODEX_BUTTONS }
    )];
  }
  if (lower.startsWith('.meme')) {
    return [botMsg(`😂 **Fresh meme delivered** — r/ProgrammerHumor • 👍 1.9k\n(Image posts inline too: @${ASSISTANT} meme)`)];
  }
  if (lower.startsWith('.ai') || lower.startsWith('.ask')) {
    return [botMsg(
      `🧠 DcX AI (Groq)\nInline mode is this bot's superpower: every command is dispatched through the BotFather assistant, so \`.ping\` and \`@${ASSISTANT} ping\` share one registry, one result builder and one permission wall.`
    )];
  }
  if (lower.startsWith('.pmguard')) {
    return [botMsg(`🛡️ PM Guard is **ON** — use \`.pmguard on|off\` to toggle.`)];
  }
  return [botMsg(
    `🤔 Unknown demo command. Try:\n\`.alive\` \`.sysinfo\` \`.speedtest\` \`.help\` \`.meme\` \`.ai hello\`\nor inline mode: \`@${ASSISTANT} ping\` / \`speedtest\` / \`sysinfo\` / \`help\``
  )];
}

function callbackResponse(data: string): SimMessage[] {
  if (data === 'ping') {
    const lat = (0.6 + Math.random() * 1.8).toFixed(2);
    return [inlineMsg(`🏓 Re-pinged: **${lat} ms**`)];
  }
  if (data === 'stats') {
    return [inlineMsg(`📊 DcX Live Metrics\n• CPU \`18%\` • RAM \`31%\` • Disk \`24%\`\nRun \`.sysinfo\` for the full dashboard image.`)];
  }
  if (data === 'alive') {
    return [inlineMsg(`⚡ Alive — uptime \`2d 7h\`, all systems nominal.`, { replyMarkup: ALIVE_BUTTONS })];
  }
  if (data === 'codex') {
    return [inlineMsg(
      `📖 DcXuserbot Command Codex\nPick a module below:`,
      { replyMarkup: CODEX_BUTTONS }
    )];
  }
  if (CAT_TEXTS[data]) {
    return [inlineMsg(CAT_TEXTS[data], {
      replyMarkup: [[{ text: '« Codex', callback_data: 'codex' }, { text: '❌ Close', callback_data: 'close' }]],
    })];
  }
  if (data === 'close') {
    return [inlineMsg(`_Codex closed._`)];
  }
  return [];
}

// ── component ─────────────────────────────────────────────────────────────
const QUICK_TRIGGERS = [
  { cmd: '.alive', label: '.alive', icon: <Zap className="w-3 h-3" /> },
  { cmd: '.sysinfo', label: '.sysinfo 🖼', icon: <ImageIcon className="w-3 h-3" /> },
  { cmd: '.speedtest', label: '.speedtest 🖼', icon: <ImageIcon className="w-3 h-3" /> },
  { cmd: `@${ASSISTANT} ping`, label: 'inline: ping', icon: <Bot className="w-3 h-3" /> },
  { cmd: `@${ASSISTANT} speedtest`, label: 'inline: speedtest 🖼', icon: <Bot className="w-3 h-3" /> },
  { cmd: `@${ASSISTANT} sysinfo`, label: 'inline: sysinfo 🖼', icon: <Bot className="w-3 h-3" /> },
  { cmd: `@${ASSISTANT} help`, label: 'inline: help', icon: <Bot className="w-3 h-3" /> },
];

export const TelegramSimulator: React.FC = () => {
  const [messages, setMessages] = useState<SimMessage[]>(WELCOME);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fire = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((prev) => [...prev, ownerMsg(text)]);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, ...respond(text)]);
    }, 420);
  };

  const clickButton = (btn: InlineButton) => {
    if (btn.url) {
      window.open(btn.url, '_blank', 'noopener');
      return;
    }
    if (!btn.callback_data) return;
    window.setTimeout(() => {
      setMessages((prev) => [...prev, ...callbackResponse(btn.callback_data!)]);
    }, 220);
  };

  return (
    <div id="telegram-simulator" className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-base">
            🤖
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">DcXuserbot saved messages</p>
            <p className="text-[11px] text-emerald-400 font-mono">online • inline assistant @{ASSISTANT}</p>
          </div>
        </div>
        <button
          id="sim-reset"
          onClick={() => setMessages(WELCOME)}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          Reset
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-950/40">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 border ${
                msg.sender === 'user'
                  ? 'ml-auto bg-sky-600/20 border-sky-500/25 rounded-br-sm'
                  : msg.sender === 'assistant'
                    ? 'bg-indigo-600/15 border-indigo-500/30 rounded-bl-sm'
                    : 'bg-slate-800/70 border-slate-700/60 rounded-bl-sm'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{msg.avatarText}</span>
                <span
                  className={`text-[10px] font-mono ${
                    msg.sender === 'assistant' ? 'text-indigo-300' : 'text-slate-400'
                  }`}
                >
                  {msg.senderName}
                </span>
              </div>
              {msg.mediaUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950">
                  <img src={msg.mediaUrl} alt={msg.mediaLabel || 'media'} className="w-full block" />
                  <p className="text-[10px] text-slate-500 font-mono px-2 py-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> {msg.mediaLabel}
                  </p>
                </div>
              )}
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                {msg.text}
              </p>
              <div className="text-[9px] text-slate-500 text-right mt-1 font-mono">{msg.time}</div>
            </div>
            {msg.replyMarkup && (
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto' : ''}`}>
                {msg.replyMarkup.map((row, i) => (
                  <div key={i} className="flex gap-1">
                    {row.map((btn, j) => (
                      <button
                        key={j}
                        onClick={() => clickButton(btn)}
                        className="flex-1 text-[11px] font-medium py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-sky-300 border border-slate-700/70 transition text-center"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* quick triggers */}
      <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/60 flex gap-1.5 overflow-x-auto">
        {QUICK_TRIGGERS.map((t) => (
          <button
            key={t.label}
            onClick={() => fire(t.cmd)}
            className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 transition"
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* input */}
      <div className="px-3 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <input
          id="sim-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              fire(input);
              setInput('');
            }
          }}
          placeholder={`Type a command — try "@${ASSISTANT} sysinfo"…`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60"
        />
        <button
          id="sim-send"
          onClick={() => {
            fire(input);
            setInput('');
          }}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <p className="text-[11px] text-slate-500">
          Simulated locally. The dashboard images above are real renders from the v5 renderer.
        </p>
      </div>
    </div>
  );
};
