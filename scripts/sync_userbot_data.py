#!/usr/bin/env python3
"""Sync the showcase site with the real DcXuserbot source.

Regenerates:
  * ``src/data/userbotFiles.ts`` — the Code Explorer's embedded sources
  * ``public/dcxuserbot.zip``    — the downloadable userbot zip

Run from the repo root:  ``python3 scripts/sync_userbot_data.py``
"""

from __future__ import annotations

import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOT_DIR = os.path.join(ROOT, "dcxuserbot")
OUT_TS = os.path.join(ROOT, "src", "data", "userbotFiles.ts")
OUT_ZIP = os.path.join(ROOT, "public", "dcxuserbot.zip")

SKIP_DIRS = {"__pycache__", "data", "assets", ".git"}
SKIP_SUFFIXES = {".pyc", ".pyo", ".ttf", ".session"}


def category_for(rel_path: str) -> str:
    if rel_path.startswith("dcx/plugins/"):
        return "plugin"
    if rel_path == "dcx/config.py":
        return "config"
    if rel_path in {"requirements.txt", "sample_config.env"}:
        return "config"
    if rel_path in {"Dockerfile", "docker-compose.yml", "Procfile", ".dockerignore"}:
        return "deploy"
    if rel_path.endswith((".md", ".MD")):
        return "docs"
    return "core"


_DESCRIPTIONS = {
    "main.py": "Thin entrypoint — `python main.py` is the same as `python -m dcx`.",
    "dcx/__init__.py": "Package metadata & version banner.",
    "dcx/__main__.py": "Boot orchestrator: validate config → start dual clients → load plugins → inline engine.",
    "dcx/config.py": "Environment-driven configuration with validation (no hard-coded hosts).",
    "dcx/session_string.py": "Interactive Telethon StringSession generator.",
    "dcx/core/__init__.py": "Core runtime namespace.",
    "dcx/core/client.py": "DcX userbot client + optional BotFather assistant client.",
    "dcx/core/registry.py": "Command/inline registries with auth guards and crash shields.",
    "dcx/core/loader.py": "Dynamic plugin discovery and event binding.",
    "dcx/core/helpers.py": "Shared plugin helpers (inline bridge, user resolution).",
    "dcx/inline/__init__.py": "Inline engine namespace.",
    "dcx/inline/engine.py": "InlineQuery dispatcher + CallbackQuery router — every command inline.",
    "dcx/inline/menus.py": "Interactive help codex with paged module buttons.",
    "dcx/inline/results.py": "Inline result builders (articles, photo cards, banners).",
    "dcx/plugins/01_status.py": "Alive, ping, uptime and quick metrics (+ inline variants).",
    "dcx/plugins/02_help.py": "Interactive command codex (inline + chat).",
    "dcx/plugins/03_admin.py": "Group moderation: ban/mute/kick/promote/pin/purge/zombies.",
    "dcx/plugins/04_info.py": "whois, ids, chat info, datacenter lookups (+ inline).",
    "dcx/plugins/05_tools.py": "calc, currency, weather, QR, tinyurl, translate, paste (+ inline).",
    "dcx/plugins/06_fun.py": "memes, jokes, quotes, pets, dice and text games (+ inline).",
    "dcx/plugins/07_media.py": "song/video downloads, TTS and Telegraph uploads.",
    "dcx/plugins/08_system.py": "sysinfo & speedtest dashboard images, logs, restart, update.",
    "dcx/plugins/09_broadcast.py": "tagall mass mentions and group broadcast casting.",
    "dcx/plugins/10_pmpermit.py": "PM anti-spam shield with approve/disapprove/block.",
    "dcx/plugins/11_ai.py": "Groq & Gemini via pure REST (+ inline AI answers).",
    "dcx/plugins/12_sudo.py": "Runtime sudo management persisted to the JSON store.",
    "dcx/plugins/13_owner.py": "Owner-only eval/exec/plugin-registry power tools.",
    "dcx/utils/__init__.py": "Utility namespace.",
    "dcx/utils/format.py": "Human bytes, durations, progress bars and text helpers.",
    "dcx/utils/http.py": "One shared lazy aiohttp session for every plugin.",
    "dcx/utils/data.py": "Atomic JSON state store (sudo, PM permit, caches).",
    "dcx/utils/telegraph.py": "Telegraph CDN uploads with caching (inline photo URLs).",
    "dcx/utils/fonts.py": "Cross-platform font loading with bundled DejaVu fallbacks.",
    "dcx/utils/cards.py": "Pillow renderers: speedtest scoreboard & sysinfo dashboard.",
    "dcx/utils/sysinfo.py": "Host telemetry gathering that works on any platform/host.",
    "dcx/utils/speedtest.py": "Dependency-free HTTP speedtest with quick inline profile.",
    "requirements.txt": "Lean production dependencies (no AI SDK bloat).",
    "sample_config.env": "Documented environment template — copy to .env.",
    "Dockerfile": "One-container build (python 3.11-slim + ffmpeg + fonts).",
    "docker-compose.yml": "Compose service with restart policy and data volume.",
    "Procfile": "Heroku-style worker declaration.",
    ".dockerignore": "Keep runtime artifacts out of the image.",
    "README.md": "Feature tour, inline setup, deploy guide and command table.",
}


def _docstring(text: str) -> str:
    match = re.match(r'\s*"""(.+?)(?:"""|$)', text, re.S)
    if match:
        return " ".join(match.group(1).split())[:160]
    return "DcXuserbot module."


def collect_files() -> list[dict]:
    entries: list[dict] = []
    for dirpath, _dirnames, filenames in os.walk(BOT_DIR):
        _dirnames[:] = [d for d in _dirnames if d not in SKIP_DIRS]
        for filename in sorted(filenames):
            if os.path.splitext(filename)[1] in SKIP_SUFFIXES:
                continue
            full = os.path.join(dirpath, filename)
            rel = os.path.relpath(full, BOT_DIR)
            with open(full, "r", encoding="utf-8", errors="replace") as fh:
                content = fh.read()
            entries.append({
                "path": rel,
                "name": os.path.basename(rel),
                "category": category_for(rel),
                "description": _DESCRIPTIONS.get(rel, _docstring(content)),
                "content": content,
            })
    return sorted(entries, key=lambda e: e["path"])


def write_ts(entries: list[dict]) -> None:
    rows = []
    for entry in entries:
        rows.append(
            "  {\n"
            f"    path: {json.dumps(entry['path'])},\n"
            f"    name: {json.dumps(entry['name'])},\n"
            f"    category: {json.dumps(entry['category'])} as const,\n"
            f"    description: {json.dumps(entry['description'])},\n"
            f"    content: {json.dumps(entry['content'])},\n"
            "  }"
        )
    body = (
        "import { UserbotFile } from '../types';\n\n"
        "// AUTO-GENERATED by scripts/sync_userbot_data.py — do not edit by hand.\n"
        f"// Synced with dcxuserbot/ ({len(entries)} files).\n\n"
        "export const USERBOT_FILES: UserbotFile[] = [\n"
        + ",\n".join(rows)
        + "\n];\n"
    )
    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, "w", encoding="utf-8") as fh:
        fh.write(body)


def write_zip() -> None:
    count = 0
    os.makedirs(os.path.dirname(OUT_ZIP), exist_ok=True)
    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(BOT_DIR):
            dirnames[:] = [d for d in dirnames if d not in {"__pycache__", "data", ".git"}]
            for filename in sorted(filenames):
                if filename.endswith((".pyc", ".pyo", ".session")):
                    continue
                full = os.path.join(dirpath, filename)
                rel = os.path.relpath(full, os.path.dirname(BOT_DIR))
                zf.write(full, rel)
                count += 1
    return count


if __name__ == "__main__":
    entries = collect_files()
    write_ts(entries)
    zipped = write_zip()
    print(f"✔ {len(entries)} files → {os.path.relpath(OUT_TS, ROOT)}")
    print(f"✔ {zipped} files → {os.path.relpath(OUT_ZIP, ROOT)}")
