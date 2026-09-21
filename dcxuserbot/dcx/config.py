"""DcXuserbot configuration — validated, typed and documented.

All values come from environment variables (or a ``.env`` file next to
``main.py``). Nothing is hard-coded, so the bot boots identically on AWS,
Heroku, a VPS, Docker, or your phone (Termux/Pydroid).
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _int(name: str, default: int = 0) -> int:
    raw = os.getenv(name, "").strip()
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def _bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on", "y"}


def _int_list(name: str) -> list[int]:
    out: list[int] = []
    for chunk in os.getenv(name, "").split(","):
        chunk = chunk.strip()
        if chunk.lstrip("-").isdigit():
            out.append(int(chunk))
    return out


_PACKAGE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../dcxuserbot/dcx
BASE_DIR = os.path.dirname(_PACKAGE_DIR)                           # .../dcxuserbot


class Config:
    """Runtime configuration. Import once, read anywhere."""

    # ── Telegram credentials ──────────────────────────────────────────
    API_ID: int = _int("API_ID")
    API_HASH: str = os.getenv("API_HASH", "").strip()
    STRING_SESSION: str = os.getenv("STRING_SESSION", "").strip()

    # ── Companion assistant bot (BotFather) for inline mode ───────────
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "").strip()
    BOT_USERNAME: str = os.getenv("BOT_USERNAME", "").strip().lstrip("@")

    # ── Command prefixes ──────────────────────────────────────────────
    CMD_PREFIX: str = (os.getenv("COMMAND_HAND_LER", ".") or ".")[0]
    SUDO_PREFIX: str = (os.getenv("SUDO_COMMAND_HAND_LER", "!") or "!")[0]
    SUDO_USERS: list[int] = _int_list("SUDO_USERS")

    # ── Branding / status cards ───────────────────────────────────────
    ALIVE_NAME: str = os.getenv("ALIVE_NAME", "DcX Master")
    ALIVE_MEDIA: str = os.getenv(
        "ALIVE_MEDIA",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
    ).strip()
    HELP_MEDIA: str = os.getenv("HELP_MEDIA", ALIVE_MEDIA).strip()

    # ── AI engines (optional, pure-REST, no SDKs required) ────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

    # ── PM-permit anti-spam shield ────────────────────────────────────
    PM_PERMIT: bool = _bool("PM_PERMIT", True)
    PM_LIMIT: int = max(1, _int("PM_LIMIT", 4))

    # ── Housekeeping ──────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    DATA_DIR: str = os.getenv("DCX_DATA_DIR", os.path.join(BASE_DIR, "data"))

    @classmethod
    def cache_dir(cls) -> str:
        path = os.path.join(cls.DATA_DIR, "cache")
        os.makedirs(path, exist_ok=True)
        return path

    @classmethod
    def downloads_dir(cls) -> str:
        path = os.path.join(cls.DATA_DIR, "downloads")
        os.makedirs(path, exist_ok=True)
        return path

    @classmethod
    def validate(cls) -> list[str]:
        """Return a list of fatal configuration problems (empty == OK)."""
        problems: list[str] = []
        if not cls.API_ID:
            problems.append("API_ID is missing (get one at https://my.telegram.org)")
        if not cls.API_HASH:
            problems.append("API_HASH is missing (get one at https://my.telegram.org)")
        if not cls.STRING_SESSION:
            problems.append(
                "STRING_SESSION is missing — run `python -m dcx.session_string` to generate one"
            )
        return problems
