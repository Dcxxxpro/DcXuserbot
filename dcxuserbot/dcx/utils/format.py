"""Small presentation helpers shared by every plugin."""

from __future__ import annotations

import math


def humanbytes(size: float | int | None, precision: int = 2) -> str:
    """Format a byte count into a short human readable string."""
    if size is None:
        return "N/A"
    size = float(size)
    if size < 0:
        size = 0.0
    units = ("B", "KiB", "MiB", "GiB", "TiB", "PiB")
    idx = 0
    while size >= 1024.0 and idx < len(units) - 1:
        size /= 1024.0
        idx += 1
    return f"{size:.{precision}f} {units[idx]}"


def time_formatter(seconds: float | int) -> str:
    """`3661.4` -> ``1h 1m 1s``."""
    seconds = int(max(0, seconds))
    days, seconds = divmod(seconds, 86400)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    chunks: list[str] = []
    if days:
        chunks.append(f"{days}d")
    if hours or days:
        chunks.append(f"{hours}h")
    if minutes or hours or days:
        chunks.append(f"{minutes}m")
    chunks.append(f"{seconds}s")
    return " ".join(chunks)


def progress_bar(fraction: float, length: int = 12) -> str:
    """A compact unicode progress bar."""
    fraction = min(1.0, max(0.0, fraction))
    filled = int(round(length * fraction))
    return "▰" * filled + "▱" * (length - filled)


def bold(text: object) -> str:
    return f"**{text}**"


def mono(text: object) -> str:
    return f"`{text}`"


def mention(name: str, user_id: int) -> str:
    safe = (name or "user").replace("[", "").replace("]", "")[:32] or "user"
    return f"[{safe}](tg://user?id={user_id})"


def truncate(text: str, limit: int = 3800) -> str:
    text = text or ""
    return text if len(text) <= limit else text[: limit - 15] + "\n…(truncated)"


def uptime_since(start_ts: float) -> str:
    import time

    return time_formatter(time.time() - start_ts)


def mbps(bytes_count: int, seconds: float) -> float:
    if seconds <= 0:
        return 0.0
    return round((bytes_count * 8) / seconds / 1_000_000, 2)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def fmt_float(value: float | None, digits: int = 2, suffix: str = "") -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return "N/A"
    return f"{value:.{digits}f}{suffix}"
