"""Font loading with graceful, cross-platform fallbacks."""

from __future__ import annotations

import os

from PIL import ImageFont

_BUNDLED = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "fonts")

_SEARCH_PATHS: dict[str, list[str]] = {
    "mono_bold": [
        os.path.join(_BUNDLED, "DejaVuSansMono-Bold.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf",
        "/data/data/com.termux/files/usr/share/fonts/DejaVuSansMono-Bold.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "C:/Windows/Fonts/consolab.ttf",
    ],
    "mono": [
        os.path.join(_BUNDLED, "DejaVuSansMono.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
        "/data/data/com.termux/files/usr/share/fonts/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "C:/Windows/Fonts/consola.ttf",
    ],
    "sans_bold": [
        os.path.join(_BUNDLED, "DejaVuSans-Bold.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ],
    "sans": [
        os.path.join(_BUNDLED, "DejaVuSans.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ],
}

_cache: dict[tuple[str, int], ImageFont.FreeTypeFont | ImageFont.ImageFont] = {}


def _first_existing(kind: str) -> str | None:
    for candidate in _SEARCH_PATHS[kind]:
        if os.path.isfile(candidate):
            return candidate
    return None


def get_font(kind: str = "mono", size: int = 20):
    key = (kind, size)
    if key in _cache:
        return _cache[key]
    path = _first_existing(kind)
    font = None
    if path:
        try:
            font = ImageFont.truetype(path, size=size)
        except OSError:
            font = None
    if font is None:
        font = ImageFont.load_default(size) if hasattr(ImageFont, "load_default") else ImageFont.load_default()
    _cache[key] = font
    return font


def mono(size: int = 20, bold: bool = False):
    return get_font("mono_bold" if bold else "mono", size)


def sans(size: int = 20, bold: bool = False):
    return get_font("sans_bold" if bold else "sans", size)
