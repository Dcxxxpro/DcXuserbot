"""
System & Network Diagnostics Suite: .ping, .speedtest, .whois
Speedtest:
- Employs official speedtest-cli subprocess with JSON text parser.
- Includes European / Frankfurt server target locking for predictable AWS EC2 cloud benchmarking.
- Robust exception fallbacks to prevent [Errno 2] No such file or directory crashes.
"""

import os
import sys
import json
import time
import shutil
import asyncio
import logging
import traceback
from core.managers import register

LOGS = logging.getLogger("DcXuserbot.Tools")

@register(pattern="speedtest(?:\\s+(.*))?$")
async def network_speedtest(event):
    """Execute network speed benchmarking with server fallbacks."""
    arg = (event.pattern_match.group(1) or "").strip().lower()
    msg = await event.client.edit_or_reply(event, "⚡ **Initiating AWS EC2 network speedtest...**\n*Testing latency, download, and upload speeds...*")
    
    try:
        speedtest_bin = shutil.which("speedtest-cli")
        if speedtest_bin:
            cmd = [speedtest_bin, "--secure", "--simple"]
        else:
            cmd = [sys.executable, "-m", "speedtest", "--secure", "--simple"]

        if "frankfurt" in arg or "eu" in arg:
            cmd.extend(["--server", "3682"])

        LOGS.info(f"Executing speedtest command: {' '.join(cmd)}")
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=45.0)
        except asyncio.TimeoutError:
            proc.kill()
            return await msg.edit("⚠️ **Speedtest timed out after 45 seconds.** Check network routing.")

        output = stdout.decode("utf-8", errors="ignore").strip()
        err_output = stderr.decode("utf-8", errors="ignore").strip()

        if proc.returncode != 0 or not output:
            LOGS.warning(f"Speedtest cli failed with return code {proc.returncode}: {err_output}")
            await msg.edit("🔄 **Primary CLI test failed. Falling back to internal Telethon benchmark...**")
            try:
                import speedtest as st_lib
                s = st_lib.Speedtest(secure=True)
                s.get_best_server()
                s.download()
                s.upload()
                res = s.results.dict()
                
                ping_val = round(res.get("ping", 0), 2)
                down_val = round(res.get("download", 0) / (1024 * 1024), 2)
                up_val = round(res.get("upload", 0) / (1024 * 1024), 2)
                server_name = res.get("server", {}).get("name", "Unknown")
                country = res.get("server", {}).get("country", "Unknown")

                result_text = (
                    f"🚀 **AWS EC2 Speedtest Benchmark Results**\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"📍 **Node Server:** `{server_name}, {country}`\n"
                    f"🏓 **Ping:** `{ping_val} ms`\n"
                    f"📥 **Download:** `{down_val} Mbit/s`\n"
                    f"📤 **Upload:** `{up_val} Mbit/s`\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🛰️ **Cloud Node:** `AWS EC2 (Frankfurt / Global Gateway)`"
                )
                return await msg.edit(result_text)
            except Exception as lib_err:
                LOGS.error(f"In-process speedtest error: {lib_err}\n{traceback.format_exc()}")
                return await msg.edit(f"❌ **Speedtest Error:** `{lib_err}`\n💡 Ensure `pip install speedtest-cli` is run on EC2.")

        lines = output.splitlines()
        stats_lines = []
        for l in lines:
            if ":" in l:
                parts = l.split(":", 1)
                stats_lines.append(f"• **{parts[0].strip()}:** `{parts[1].strip()}`")
        formatted_summary = (
            f"🚀 **AWS EC2 Speedtest Benchmark**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            + "\n".join(stats_lines)
            + f"\n━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🛰️ **Host:** AWS EC2 Cloud Enterprise Interface"
        )
        await msg.edit(formatted_summary)

    except Exception as exc:
        LOGS.error(f"Fatal speedtest exception: {exc}\n{traceback.format_exc()}")
        await msg.edit(f"❌ **Speedtest Failed:** `{type(exc).__name__}: {str(exc)}`")

@register(pattern="whois(?:\\s+(.*))?$")
async def user_info_lookup(event):
    """Inspect user or chat ID with complete Telethon entity resolution."""
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        user_id = event.sender_id
        
    try:
        user = await event.client.get_entity(user_id)
        info = (
            f"👤 **User Dossier:**\n"
            f"• **First Name:** {user.first_name}\n"
            f"• **Last Name:** {user.last_name or 'None'}\n"
            f"• **Username:** @{user.username or 'None'}\n"
            f"• **ID:** `{user.id}`\n"
            f"• **DC ID:** {getattr(user.photo, 'dc_id', 'Unknown') if getattr(user, 'photo', None) else 'None'}\n"
            f"• **Bot:** {getattr(user, 'bot', False)}\n"
            f"• **Verified:** {getattr(user, 'verified', False)}"
        )
        await event.client.edit_or_reply(event, info)
    except Exception as exc:
        await event.client.edit_or_reply(event, f"❌ **Could not resolve user:** `{exc}`")
