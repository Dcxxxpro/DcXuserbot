"""Pillow renderers that turn raw telemetry into clean dashboard images.

These are the "screenshots of your instance": a speedtest scoreboard and a
full system dashboard, rendered locally (no browser required) so they work
on literally any host.
"""

from __future__ import annotations

import os
import time

from PIL import Image, ImageDraw, ImageFilter

from dcx import DCX_VERSION
from dcx.config import Config
from dcx.utils import fonts
from dcx.utils.format import clamp, fmt_float, time_formatter
from dcx.utils.speedtest import SpeedResult
from dcx.utils.sysinfo import SysReport

# ── palette ──────────────────────────────────────────────────────────────
_BG_TOP = (10, 14, 26)
_BG_BOTTOM = (17, 24, 39)
_PANEL = (24, 32, 50)
_PANEL_EDGE = (45, 55, 79)
_TEXT = (229, 236, 246)
_SUBTEXT = (148, 163, 184)
_CYAN = (34, 211, 238)
_GREEN = (52, 211, 153)
_AMBER = (251, 191, 36)
_RED = (248, 113, 113)
_PURPLE = (167, 139, 250)
_BAR_BG = (39, 50, 74)


def _gradient_bg(width: int, height: int) -> Image.Image:
    base = Image.new("RGB", (1, height))
    for y in range(height):
        ratio = y / max(1, height - 1)
        base.putpixel(
            (0, y),
            tuple(int(_BG_TOP[i] + (_BG_BOTTOM[i] - _BG_TOP[i]) * ratio) for i in range(3)),
        )
    return base.resize((width, height))


def _rounded_panel(draw: ImageDraw.ImageDraw, box, radius: int = 18,
                   fill=_PANEL, edge=_PANEL_EDGE) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=edge, width=2)


def _text(draw: ImageDraw.ImageDraw, xy, text: str, font, fill=_TEXT) -> None:
    draw.text(xy, str(text), font=font, fill=fill)


def _fit(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> str:
    """Truncate *text* so it never exceeds *max_width* pixels."""
    text = str(text)
    if draw.textlength(text, font=font) <= max_width:
        return text
    ell = "…"
    while text and draw.textlength(text + ell, font=font) > max_width:
        text = text[:-1]
    return (text + ell) if text else ell


def _meter(draw: ImageDraw.ImageDraw, box, fraction: float, color) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=(y2 - y1) // 2, fill=_BAR_BG)
    width = int((x2 - x1) * clamp(fraction, 0.0, 1.0))
    if width > 10:
        draw.rounded_rectangle((x1, y1, x1 + width, y2), radius=(y2 - y1) // 2, fill=color)


def _save(img: Image.Image, stem: str) -> str:
    path = os.path.join(Config.cache_dir(), f"{stem}_{int(time.time() * 1000)}.png")
    img.save(path, "PNG", optimize=True)
    try:  # keep the cache folder tidy: remember only the 16 newest files
        folder = Config.cache_dir()
        files = sorted((os.path.join(folder, f) for f in os.listdir(folder)),
                       key=os.path.getmtime)
        for old in files[:-16]:
            os.remove(old)
    except OSError:
        pass
    return path


# ═════════════════════════════════════════════════════════════════════════
# SPEEDTEST SCOREBOARD
# ═════════════════════════════════════════════════════════════════════════
def render_speedtest(result: SpeedResult) -> str:
    width, height = 1080, 700
    img = _gradient_bg(width, height)
    draw = ImageDraw.Draw(img)

    f_title = fonts.sans(44, bold=True)
    f_sub = fonts.sans(24)
    f_big = fonts.mono(64, bold=True)
    f_unit = fonts.sans(24)
    f_label = fonts.sans(22, bold=True)
    f_val = fonts.mono(24, bold=True)
    f_small = fonts.mono(20)

    # header
    draw.rounded_rectangle((40, 36, width - 40, 128), radius=22,
                           fill=_PANEL, outline=_PANEL_EDGE, width=2)
    draw.rounded_rectangle((40, 36, 56, 128), radius=8, fill=_CYAN)
    _text(draw, (84, 52), "⚡ DcX Speed Test", f_title)
    when = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    mode = "QUICK SCAN" if result.quick else "DEEP SCAN"
    _text(draw, (86, 100), f"{when}   •   {mode}", f_sub, fill=_SUBTEXT)

    # download / upload columns
    col_w = (width - 120) // 2
    for idx, (label, value, color, icon) in enumerate((
        ("DOWNLOAD", result.download_mbps, _CYAN, "⬇"),
        ("UPLOAD", result.upload_mbps, _GREEN, "⬆"),
    )):
        x0 = 40 + idx * (col_w + 40)
        _rounded_panel(draw, (x0, 152, x0 + col_w, 372))
        _text(draw, (x0 + 28, 172), f"{icon} {label}", f_label, fill=_SUBTEXT)
        shown = fmt_float(value, 2)
        _text(draw, (x0 + 28, 212), shown, f_big, fill=color)
        unit_w = draw.textlength(shown, font=f_big)
        _text(draw, (x0 + 40 + unit_w, 262), "Mbps", f_unit, fill=_SUBTEXT)
        fraction = (value or 0.0) / (500.0 if idx == 0 else 200.0)
        _meter(draw, (x0 + 28, 316, x0 + col_w - 28, 344), fraction, color)

    # metrics row (3 × 2)
    rows = [
        ("PING", f"{fmt_float(result.ping_ms, 1)} ms", _AMBER),
        ("JITTER", f"{fmt_float(result.jitter_ms, 1)} ms", _PURPLE),
        ("SERVER", result.server, _CYAN),
        ("PUBLIC IP", result.ip, _GREEN),
        ("ISP", result.isp or "N/A", _AMBER),
        ("LOCATION", result.location or "N/A", _PURPLE),
    ]
    gw = (width - 100) // 3
    for i, (label, value, color) in enumerate(rows):
        row, colr = divmod(i, 3)
        x0 = 40 + colr * (gw + 10)
        y0 = 404 + row * 122
        _rounded_panel(draw, (x0, y0, x0 + gw, y0 + 104), radius=14)
        _text(draw, (x0 + 22, y0 + 16), label, f_label, fill=_SUBTEXT)
        _text(draw, (x0 + 22, y0 + 52), _fit(draw, value, f_val, gw - 44), f_val, fill=color)

    # footer
    notes = "; ".join(result.errors) if result.errors else "Cloudflare edge test • rendered by DcXuserbot"
    _text(draw, (46, height - 36), _fit(draw, notes, f_small, width - 260), f_small, fill=_SUBTEXT)
    tail = "DcXuserbot ⚡"
    _text(draw, (width - 46 - draw.textlength(tail, font=f_small), height - 36),
          tail, f_small, fill=_CYAN)

    return _save(img, "dcx_speedtest")


# ═════════════════════════════════════════════════════════════════════════
# SYSINFO DASHBOARD ("screenshot of the instance")
# ═════════════════════════════════════════════════════════════════════════
def render_sysinfo(report: SysReport) -> str:
    width = 1120
    row_h = 44
    pad = 24  # inner horizontal padding inside panels

    def _rows(*entries):
        return list(entries)

    sections: list[tuple[str, list[tuple[str, str, tuple[int, int, int]]]]] = [
        ("SYSTEM", _rows(
            ("Hostname", report.hostname, _CYAN),
            ("Distro", report.distro, _TEXT),
            ("Kernel", f"{report.os_name} {report.kernel}", _TEXT),
            ("Arch / Env", f"{report.arch} • {report.container}", _AMBER),
            ("Python / Telethon", f"{report.python} / {report.telethon}", _TEXT),
            ("DcX Version", DCX_VERSION, _CYAN),
        )),
        ("CPU", _rows(
            ("Model", report.cpu_model, _TEXT),
            ("Cores / Threads", f"{report.cpu_cores}C / {report.cpu_threads}T", _TEXT),
            ("Frequency", f"{report.cpu_freq:.2f} GHz" if report.cpu_freq else "N/A", _TEXT),
            ("Load Avg 1/5/15", " / ".join(str(x) for x in report.load_avg), _AMBER),
            ("Usage", f"{report.cpu_percent:.1f}%",
             _GREEN if report.cpu_percent < 75 else _RED),
        )),
        ("MEMORY", _rows(
            ("RAM", f"{report.ram_used} / {report.ram_total}  ({report.ram_percent:.1f}%)",
             _GREEN if report.ram_percent < 80 else _RED),
            ("Swap", f"{report.swap_total}  ({report.swap_percent:.1f}%)", _TEXT),
        )),
        ("STORAGE", _rows(*[
            (f"Disk {d.mount}", f"{d.used} / {d.total}  ({d.percent:.0f}%)",
             _GREEN if d.percent < 85 else _RED) for d in report.disks
        ] or [("Disk", "N/A", _TEXT)])),
        ("NETWORK", _rows(
            ("Public IP", report.public_ip, _CYAN),
            ("Local IP", report.local_ip, _TEXT),
            ("Location", report.location, _AMBER),
            ("ISP", report.isp, _TEXT),
            ("Sent / Recv", f"{report.net_sent} / {report.net_recv}", _TEXT),
        )),
        ("RUNTIME", _rows(
            ("GPU", report.gpu, _TEXT),
            ("Processes", str(report.processes), _TEXT),
            ("Temperature", report.temperature, _TEXT),
            ("Boot Time", report.boot_time, _TEXT),
            ("Uptime", time_formatter(report.uptime), _GREEN),
            ("Run As", f"{report.user}@{report.hostname}", _TEXT),
        )),
    ]

    f_title = fonts.sans(46, bold=True)
    f_sub = fonts.sans(24)
    f_head = fonts.sans(28, bold=True)
    f_label = fonts.mono(22, bold=True)
    f_value = fonts.mono(22)
    f_small = fonts.mono(20)

    margin = 40
    header_h = 120
    footer_h = 52
    head_h = 52
    gap = 20
    left_w = (width - margin * 3) // 2

    # measure once for layout
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))

    def section_height(rows) -> int:
        return head_h + len(rows) * row_h + 16

    # ── masonry balance first so the canvas height is exact ──
    columns: list[list[tuple[str, list]]] = [[], []]
    col_heights = [0, 0]
    for title, rows in sections:
        needed = section_height(rows)
        col = 0 if col_heights[0] <= col_heights[1] else 1
        columns[col].append((title, rows))
        col_heights[col] += needed + gap

    body_h = max(col_heights) - gap
    height = margin + header_h + gap + body_h + footer_h + margin

    img = _gradient_bg(width, height)
    glow = Image.new("RGB", (width, height), (0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((width - 340, -120, width + 120, 340), fill=(24, 52, 78))
    gdraw.ellipse((-160, height - 340, 300, height + 120), fill=(38, 30, 70))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.25)
    draw = ImageDraw.Draw(img)

    # header card
    draw.rounded_rectangle((margin, margin, width - margin, margin + header_h),
                           radius=22, fill=_PANEL, outline=_PANEL_EDGE, width=2)
    draw.rounded_rectangle((margin, margin, margin + 16, margin + header_h),
                           radius=8, fill=_CYAN)
    _text(draw, (margin + 44, margin + 20), "⚡ DcX System Dashboard", f_title)
    stamp = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(report.timestamp or time.time()))
    _text(draw, (margin + 46, margin + 78), f"Live host telemetry • {stamp}",
          f_sub, fill=_SUBTEXT)

    y0 = margin + header_h + gap
    for col in (0, 1):
        x0 = margin + col * (left_w + margin)
        cy = y0
        for title, rows in columns[col]:
            box_h = section_height(rows)
            _rounded_panel(draw, (x0, cy, x0 + left_w, cy + box_h - 4), radius=18)
            _text(draw, (x0 + pad, cy + 12), f"▸ {title}", f_head, fill=_CYAN)

            # per-panel label column: width of widest label, capped at 45%
            label_w = 0
            for label, _, _ in rows:
                label_w = max(label_w, int(probe.textlength(label, font=f_label)))
            label_w = min(label_w, int(left_w * 0.45))
            value_x = x0 + pad + label_w + 26
            value_max = x0 + left_w - pad - value_x

            ry = cy + head_h
            for label, value, color in rows:
                _text(draw, (x0 + pad, ry), _fit(draw, label, f_label, label_w),
                      f_label, fill=_SUBTEXT)
                _text(draw, (value_x, ry), _fit(draw, value, f_value, value_max),
                      f_value, fill=color)
                ry += row_h
            cy += box_h + gap

    foot_l = f"{report.user}@{report.hostname} — rendered in-process, no browser needed"
    _text(draw, (margin + 6, height - footer_h + 6),
          _fit(draw, foot_l, f_small, width - 340), f_small, fill=_SUBTEXT)
    tail = "DcXuserbot ⚡ sysinfo"
    _text(draw, (width - margin - draw.textlength(tail, font=f_small), height - footer_h + 6),
          tail, f_small, fill=_CYAN)

    return _save(img, "dcx_sysinfo")
