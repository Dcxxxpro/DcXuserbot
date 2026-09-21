# ⚡ DcXuserbot v5

A clean, powerful, dual-client Telegram userbot — rewritten from scratch.

- **🎮 Every command works in inline mode** — type `@YourAssistantBot ping`
  (or `sysinfo`, `speedtest`, `meme`, `weather`…) in **any chat** and the
  BotFather assistant bot answers on your behalf, with buttons.
- **🖥️ `.sysinfo`** — a rendered **dashboard image** of the exact instance
  the bot runs on: distro, kernel, CPU model/cores/load, RAM, disks, network,
  uptime, processes, temperature, container/VM type. Works identically on AWS,
  GCP, Heroku, Docker, VPS or Termux — no browser, no root needed.
- **⚡ `.speedtest`** — dependency-free network benchmark (Cloudflare edge)
  that returns a beautiful **scoreboard image**. `quick` profile finishes
  inside the inline-query time slot.
- **🛡️ Sudo + PM-permit security**, AI (Groq/Gemini via REST), admin tools,
  media grabbers, fun pack — all wrapped in crash shields.

## 🚀 Quick start

```bash
pip install -r requirements.txt

# 1. generate your session string
python -m dcx.session_string

# 2. configure
cp sample_config.env .env   # then edit .env

# 3. fly
python -m dcx
```

## 🤖 Inline mode setup (one-time, ~1 minute)

1. Talk to **@BotFather** → `/newbot` (or reuse an existing bot).
2. Send **`/setinline`**, pick your bot, answer e.g. `DcXuserbot inline`.
3. *(optional)* `/setinlinefeedback` → **Enable** (nice "run from here" UX).
4. Put the bot token/username in `.env` as `BOT_TOKEN` / `BOT_USERNAME`.
5. Start the bot; then in **any chat** type:
   `@YourBotUsername alive` / `ping` / `sysinfo` / `speedtest` / `meme` …

> Only you (and sudo users) get real results — everyone else sees a locked
> brand card. Inline queries are private by design.

## 🧩 Commands

76 chat commands · 26 inline commands. `.help` (or `@bot help`) opens the
interactive codex with per-module buttons.

| Module | Highlights |
| --- | --- |
| Status | `alive` `ping` `uptime` `stats` |
| System | `sysinfo`🖼 `speedtest`🖼 `logs` `update` `restart` `clean` |
| Admin | `ban` `unban` `kick` `mute` `unmute` `promote` `demote` `pin` `purge` `del` `zombies` `invite` |
| Info | `whois` `id` `chatinfo` `dc` |
| Tools | `calc` `cur` `weather` `qr`/`qrread` `tiny` `trt` `gh` `paste` `json` |
| Fun | `meme`🖼 `joke` `quote` `cat`🖼 `dog`🖼 `dice` `flip` `choose` `mock` `slap` `type` |
| Media | `song` `video` `tts` `telegraph` |
| AI | `ai` `groq` `gemini` `code` `explain` `summarize` |
| Broadcast | `tagall` `gcast` `cancel` |
| Security | `approve` `disapprove` `block` `unblock` `approved` `pmguard` |
| Sudo/Owner | `addsudo` `remsudo` `sudolist` · `eval` `exec` `plugins` |

## 🚢 Deploy anywhere

**Docker (recommended)**
```bash
docker compose up -d --build   # restart: unless-stopped → .restart works
```

**VPS / systemd**
```ini
[Unit]
Description=DcXuserbot
After=network.target
[Service]
WorkingDirectory=/opt/dcxuserbot
EnvironmentFile=/opt/dcxuserbot/.env
ExecStart=/usr/bin/python3 -m dcx
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
```

**Heroku-ish** → uses the included `Procfile` (`worker: python -m dcx`),
set config vars from `sample_config.env`.

**Termux** → `pkg install python ffmpeg libjpeg-turbo`, then the quick start above.

## 📁 Layout

```
dcxuserbot/
├── main.py                 # python main.py == python -m dcx
├── dcx/
│   ├── __main__.py         # boot: config → clients → plugins → inline engine
│   ├── config.py           # validated env config
│   ├── core/               # clients, registry (auth+crash shield), loader
│   ├── inline/             # inline dispatcher, codex menus, result builders
│   ├── plugins/            # 13 feature modules (auto-discovered)
│   ├── utils/              # http, telemetry, speedtest, card renderers…
│   └── assets/fonts/       # bundled DejaVu fonts (any-host rendering)
├── data/                   # runtime state (sessions, JSON store, cache)
├── Dockerfile / docker-compose.yml / Procfile
└── sample_config.env
```

## 🙏 Credits

Inspired by the best ideas of CatUserbot, Ultroid and Userge — rebuilt into a
single clean codebase with pure-REST AI, built-in image dashboards and an
inline-first command system.
