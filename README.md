# ⚡ DcXuserbot

**v5 — a clean, inline-first Telegram userbot, rewritten from scratch.**

This repository contains:

| Path | What it is |
| --- | --- |
| [`dcxuserbot/`](dcxuserbot/) | **The userbot itself** — dual Telethon clients, 13 plugin modules, 76 chat + 26 inline commands, image-based `.sysinfo` / `.speedtest` dashboards that render on any host. |
| `src/`, `index.html` | Showcase web app: source explorer, interactive Telegram **inline-mode simulator**, plugin catalog and deploy wizard. |
| `scripts/sync_userbot_data.py` | Regenerates the site's embedded sources (`src/data/userbotFiles.ts`) and `public/dcxuserbot.zip` from the real code. |
| `public/dcxuserbot.zip` | Ready-to-download copy of the userbot (auto-synced). |

## Highlights

- 🎮 **Every command in inline mode** — `@YourAssistantBot ping | sysinfo | speedtest | meme …` in any chat, backed by one shared registry and permission wall.
- 🖥️ **.sysinfo** — a rendered "screenshot" of your instance: distro, kernel, CPU model/cores/load, RAM, disks, network, uptime — identical on AWS, Heroku, Docker, VPS or Termux (pure Python + Pillow, no browser).
- ⚡ **.speedtest** — dependency-free Cloudflare edge benchmark rendered as a scoreboard image (`quick` profile fits inline query timeouts).
- 🛡️ Sudo access control, PM-permit anti-spam, crash-shielded plugins, pure-REST AI (Groq/Gemini), lean dependencies.

## Run the userbot

```bash
cd dcxuserbot
pip install -r requirements.txt
python -m dcx.session_string   # → STRING_SESSION
cp sample_config.env .env      # fill values (incl. BOT_TOKEN for inline mode)
python -m dcx
```

Full guide: **[dcxuserbot/README.md](dcxuserbot/README.md)**

## Run the showcase site

```bash
npm install --legacy-peer-deps
npm run dev
```
