"""Status module — alive, ping, uptime, quick stats."""

from __future__ import annotations

import time

from telethon import Button

from dcx import DCX_VERSION
from dcx.config import Config
from dcx.core import registry
from dcx.core.helpers import inline_via_bot
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import engine as inline_engine
from dcx.inline import results
from dcx.utils.format import truncate, uptime_since

_CATEGORY = "Status"


# ── chat commands ────────────────────────────────────────────────────────
@dcx_cmd("alive", category=_CATEGORY, desc="Show the interactive alive card "
         "(with assistant: real inline buttons).")
async def alive_cmd(event, args):
    if await inline_via_bot(event.client, event, "alive"):
        return
    await event.edit(await inline_engine.alive_text(event.client), parse_mode="md")


@dcx_cmd("ping", category=_CATEGORY, desc="Measure real edit round-trip latency.")
async def ping_cmd(event, args):
    start = time.perf_counter()
    message = await event.client.edit_or_reply(event, "🏓")
    latency = round((time.perf_counter() - start) * 1000, 2)
    await message.edit(
        f"🏓 **Pong!** `{latency} ms`\n"
        f"⏳ **Uptime:** `{uptime_since(event.client.dcx_start_time)}`\n"
        f"🛰️ **DcX:** `{DCX_VERSION}`",
        parse_mode="md",
    )


@dcx_cmd("uptime", category=_CATEGORY, desc="Bot uptime + host uptime.")
async def uptime_cmd(event, args):
    host = "N/A"
    try:
        import psutil

        host = uptime_since(psutil.boot_time())
    except Exception:
        pass
    await event.client.edit_or_reply(
        event,
        f"⏳ **DcX uptime:** `{uptime_since(event.client.dcx_start_time)}`\n"
        f"🖥️ **Host uptime:** `{host}`",
    )


@dcx_cmd("stats", category=_CATEGORY,
         desc="Instant CPU/RAM/disk snapshot (see .sysinfo for the full dashboard).")
async def stats_cmd(event, args):
    try:
        import psutil

        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory()
        swap = psutil.swap_memory()
        disk = psutil.disk_usage("/")
        text = (
            "📊 **DcX Quick Metrics**\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚙️ **CPU:** `{cpu}%`\n"
            f"🧠 **RAM:** `{ram.percent}%`\n"
            f"🔁 **Swap:** `{swap.percent}%`\n"
            f"💽 **Disk /:** `{disk.percent}%`\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"_{Config.CMD_PREFIX}sysinfo renders the full dashboard image._"
        )
    except Exception as exc:
        text = f"❌ Metrics unavailable: `{truncate(str(exc), 150)}`"
    await event.client.edit_or_reply(event, text)


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("alive", category=_CATEGORY, desc="Interactive alive card with buttons")
async def alive_inline(ctx):
    return [await results.banner_article(
        ctx.builder, title="⚡ DcXuserbot — Alive",
        description="Status card with inline buttons",
        text=await inline_engine.alive_text(ctx.userbot),
        buttons=inline_engine.alive_buttons(),
        id=results.result_id("alive"),
    )]


@inline_cmd("ping", category=_CATEGORY, desc="Server round-trip latency")
async def ping_inline(ctx):
    latency = await inline_engine._server_latency(ctx.userbot)
    return [await results.banner_article(
        ctx.builder, title=f"🏓 Ping — {latency} ms",
        description="Round-trip latency right now",
        text=(f"🏓 **Pong!** `{latency} ms`\n"
              f"🕒 `{time.strftime('%H:%M:%S UTC', time.gmtime())}`\n"
              f"⏳ Uptime `{uptime_since(ctx.userbot.dcx_start_time)}`"),
        buttons=[[Button.inline("🔄 Re-ping", data=b"dcx|ping"),
                  Button.inline("⚡ Alive", data=b"dcx|alive")]],
        id=results.result_id("ping"),
    )]


@inline_cmd("uptime", category=_CATEGORY, desc="Bot + host uptime")
async def uptime_inline(ctx):
    host = "N/A"
    try:
        import psutil

        host = uptime_since(psutil.boot_time())
    except Exception:
        pass
    return [await results.article(
        ctx.builder, title="⏳ Uptime",
        description="How long DcX and the host have been running",
        text=(f"⏳ **DcX uptime:** `{uptime_since(ctx.userbot.dcx_start_time)}`\n"
              f"🖥️ **Host uptime:** `{host}`"),
        id=results.result_id("uptime"),
    )]


@inline_cmd("stats", category=_CATEGORY, desc="Instant CPU/RAM/disk snapshot")
async def stats_inline(ctx):
    try:
        import psutil

        text = (
            f"📊 **DcX Metrics** — CPU `{psutil.cpu_percent()}%` • "
            f"RAM `{psutil.virtual_memory().percent}%` • "
            f"Disk `{psutil.disk_usage('/').percent}%`"
        )
    except Exception:
        text = "❌ Metrics unavailable on this host."
    return [await results.article(ctx.builder, title="📊 DcX Metrics",
                            description="CPU / RAM / disk right now", text=text,
                            id=results.result_id("stats", int(time.time() // 30)))]


@inline_cmd("dcx", category=_CATEGORY, desc="About DcXuserbot")
async def dcx_inline(ctx):
    return [await results.banner_article(
        ctx.builder, title=f"⚡ DcXuserbot v{DCX_VERSION}",
        description="About this userbot",
        text=("⚡ **DcXuserbot**\n"
              f"Version `{DCX_VERSION}` — clean dual-client userbot,\n"
              "every command available inline. Built with Telethon."),
        buttons=[[Button.url("⭐ GitHub", "https://github.com/Dcxxxpro/DcXuserbot")]],
        id=results.result_id("about"),
    )]
