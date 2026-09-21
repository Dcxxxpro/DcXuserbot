"""System module — instance dashboards, speedtest, logs and lifecycle.

The flagship commands: `.sysinfo` and `.speedtest` render beautiful PNG
reports of the running host — no matter where the bot is deployed.
"""

from __future__ import annotations

import asyncio
import os
import sys
import time

from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import results
from dcx.utils import cards, speedtest, sysinfo
from dcx.utils.format import fmt_float, truncate
from dcx.utils.sysinfo import summary_text

_CATEGORY = "System"

_SPEED_CACHE: dict = {"ts": 0.0, "result": None, "path": None}
_SPEED_LOCK = asyncio.Lock()
_SYS_LOCK = asyncio.Lock()


async def _render_sysinfo() -> tuple[str, str]:
    """Render the dashboard, return (image_path, caption). Cached 45s."""
    async with _SYS_LOCK:
        cached_path = _SPEED_CACHE.get("sys_path")
        if cached_path and time.time() - _SPEED_CACHE.get("sys_ts", 0) < 45 \
                and os.path.exists(cached_path):
            return cached_path, _SPEED_CACHE["sys_caption"]
        report = await sysinfo.collect()
        path = await asyncio.get_running_loop().run_in_executor(
            None, cards.render_sysinfo, report)
        caption = summary_text(report)
        _SPEED_CACHE.update(sys_ts=time.time(), sys_path=path, sys_caption=caption)
        return path, caption


async def _run_speedtest(quick: bool, on_stage=None):
    """Run a benchmark (cache 3-minute freshness for inline)."""
    async with _SPEED_LOCK:
        cached = _SPEED_CACHE
        if cached["result"] is not None and cached["result"].quick == quick \
                and time.time() - cached["ts"] < 180 \
                and cached["path"] and os.path.exists(cached["path"]):
            return cached["result"], cached["path"]
        result = await speedtest.run_speedtest(quick=quick, on_stage=on_stage)
        path = await asyncio.get_running_loop().run_in_executor(
            None, cards.render_speedtest, result)
        cached.update(ts=time.time(), result=result, path=path)
        return result, path


def _speed_caption(result) -> str:
    return (
        "⚡ **DcX Speed Test** ({mode})\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "⬇️ **Download:** `{dl} Mbps`   ⬆️ **Upload:** `{ul} Mbps`\n"
        "🏓 **Ping:** `{ping} ms`   📶 **Jitter:** `{jitter} ms`\n"
        "🖥 **Server:** `{server}`\n"
        "🌍 **ISP:** `{isp}` • `{loc}`"
    ).format(
        mode="quick" if result.quick else "deep",
        dl=fmt_float(result.download_mbps), ul=fmt_float(result.upload_mbps),
        ping=fmt_float(result.ping_ms, 1), jitter=fmt_float(result.jitter_ms, 1),
        server=result.server, isp=truncate(result.isp, 30), loc=result.location,
    )


# ── chat commands ────────────────────────────────────────────────────────
@dcx_cmd("sysinfo", category=_CATEGORY,
         desc="Full instance dashboard rendered as an image — works on any host.",
         aliases=("serverinfo", "specs"))
async def sysinfo_cmd(event, args):
    status = await event.client.edit_or_reply(event, "🖥️ Collecting instance telemetry…")
    try:
        path, caption = await _render_sysinfo()
        await event.client.send_file(
            event.chat_id, path, caption=caption, reply_to=event.reply_to_msg_id)
        await status.delete()
    except Exception as exc:
        await status.edit(f"🖥️ Dashboard failed: `{truncate(str(exc), 200)}`", parse_mode="md")


@dcx_cmd("speedtest", category=_CATEGORY,
         desc="Network benchmark with image result (add `quick` for a fast scan).",
         usage=".speedtest [quick]")
async def speedtest_cmd(event, args):
    quick = "quick" in args.lower().split()
    status = await event.client.edit_or_reply(
        event, "⚡ **DcX Speed Test** starting…")

    async def stage(name: str) -> None:
        try:
            await status.edit(f"⚡ **DcX Speed Test**\n{name}", parse_mode="md")
        except Exception:
            pass

    try:
        result, path = await _run_speedtest(quick=quick, on_stage=stage)
        if not result.ok:
            await status.edit(
                "❌ Speed test failed on this host "
                f"({'; '.join(result.errors) or 'no network'}).", parse_mode="md")
            return
        await event.client.send_file(
            event.chat_id, path, caption=_speed_caption(result),
            reply_to=event.reply_to_msg_id)
        await status.delete()
    except Exception as exc:
        await status.edit(f"❌ Speed test crashed: `{truncate(str(exc), 200)}`", parse_mode="md")


@dcx_cmd("logs", category=_CATEGORY, desc="Tail service logs (journalctl or file).",
         sudo=False, usage=".logs [lines]")
async def logs_cmd(event, args):
    count = int(args) if args.strip().isdigit() else 25
    count = max(5, min(count, 60))
    output = ""

    async def _shell(cmd: str) -> tuple[int, str]:
        proc = await asyncio.create_subprocess_shell(
            cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
        try:
            out, _ = await asyncio.wait_for(proc.communicate(), timeout=20)
        except asyncio.TimeoutError:
            proc.kill()
            return 1, "timeout"
        return proc.returncode or 0, out.decode(errors="ignore")

    rc, out = await _shell(f"journalctl -u dcxuserbot -n {count} --no-pager 2>&1")
    if rc == 0 and out.strip():
        output = out
    else:
        for candidate in ("nohup.out", "dcx.log", "../dcx.log"):
            if os.path.isfile(candidate):
                with open(candidate, "r", errors="ignore") as fh:
                    output = "".join(fh.readlines()[-count:])
                break
    await event.client.edit_or_reply(
        event,
        f"📜 **Last log lines:**\n```\n{truncate(output.strip() or 'No log source found.', 3400)}```",
    )


@dcx_cmd("restart", category=_CATEGORY, desc="Restart the bot (service manager "
         "will relaunch it).", sudo=False)
async def restart_cmd(event, args):
    await event.client.edit_or_reply(
        event, "♻️ **Restarting DcXuserbot…** (requires systemd/docker restart policy)")
    await asyncio.sleep(1)
    os._exit(133)  # distinctive code; systemd/docker brings us back


@dcx_cmd("shutdown", category=_CATEGORY, sudo=False,
         desc="Power off the bot process.")
async def shutdown_cmd(event, args):
    await event.client.edit_or_reply(event, "🛑 **DcXuserbot shutting down.**")
    await asyncio.sleep(1)
    os._exit(0)


@dcx_cmd("update", category=_CATEGORY, sudo=False,
         desc="git pull the repo and tell you to restart.")
async def update_cmd(event, args):
    status = await event.client.edit_or_reply(event, "⬆️ Pulling latest code…")
    proc = await asyncio.create_subprocess_shell(
        "git pull --ff-only 2>&1", cwd=os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=60)
        text = out.decode(errors="ignore").strip() or "(no output)"
    except asyncio.TimeoutError:
        proc.kill()
        text = "timed out"
    tail = "\n".join(text.splitlines()[-8:])
    await status.edit(
        f"⬆️ **git pull:**\n```\n{truncate(tail, 800)}```\n"
        "_Run_ `.restart` _to boot the new code._", parse_mode="md")


@dcx_cmd("clean", category=_CATEGORY, desc="Clear generated caches & downloads.")
async def clean_cmd(event, args):
    import shutil

    from dcx.config import Config

    removed = 0
    for folder in (Config.cache_dir(), Config.downloads_dir()):
        for name in os.listdir(folder):
            target = os.path.join(folder, name)
            try:
                if os.path.isfile(target):
                    os.remove(target)
                    removed += 1
                elif os.path.isdir(target):
                    shutil.rmtree(target)
                    removed += 1
            except OSError:
                pass
    await event.client.edit_or_reply(event, f"🧹 Cleaned `{removed}` temporary files.")


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("sysinfo", category=_CATEGORY, photo=True,
            desc="Instance dashboard image (works on any host)")
async def sysinfo_inline(ctx):
    path, caption = await _render_sysinfo()
    return [await results.photo_from_file(
        ctx.builder, path=path, caption=caption,
        id=results.result_id("sysinfo", int(time.time() // 45)))]


@inline_cmd("speedtest", category=_CATEGORY, photo=True,
            desc="Quick speedtest with image result (add 'deep' for full scan)")
async def speedtest_inline(ctx):
    quick = "deep" not in ctx.args.lower().split()
    result, path = await _run_speedtest(quick=quick)
    if not result.ok:
        return [await results.article(
            ctx.builder, title="❌ speedtest failed",
            description="; ".join(result.errors) or "no network",
            text=("❌ **Speed test failed**\n"
                  f"`{truncate('; '.join(result.errors) or 'host network blocked', 200)}`"),
            id=results.result_id("speed-err"))]
    return [await results.photo_from_file(
        ctx.builder, path=path, caption=_speed_caption(result),
        id=results.result_id("speedtest", int(time.time() // 180), quick))]
