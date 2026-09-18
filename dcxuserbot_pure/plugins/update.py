import os
import sys
import asyncio
from core.managers import register
from config import Config

@register(pattern="update(?:\\s+(.*))?$")
async def git_update(event):
    """Pull latest code from GitHub and auto-restart the userbot on AWS EC2."""
    msg = await event.client.edit_or_reply(event, "🔄 **Checking for updates from GitHub repository...**")
    
    # 1. Verify git repository status
    check_git = await asyncio.create_subprocess_shell(
        "git status",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await check_git.communicate()
    
    if check_git.returncode != 0:
        return await msg.edit(
            "❌ **Not a git repository!**\n"
            "Please deploy using: 'git clone <repo_url>' on your AWS EC2 instance to enable automatic updates."
        )

    # 2. Fetch updates from remote origin
    fetch_proc = await asyncio.create_subprocess_shell(
        "git fetch origin",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await fetch_proc.communicate()

    # 3. Check commits behind
    diff_proc = await asyncio.create_subprocess_shell(
        "git log HEAD..origin/main --oneline",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    diff_out, _ = await diff_proc.communicate()
    changelog = diff_out.decode("utf-8").strip()

    if not changelog:
        # Also check master branch if main has no diff
        diff_master = await asyncio.create_subprocess_shell(
            "git log HEAD..origin/master --oneline",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        m_out, _ = await diff_master.communicate()
        changelog = m_out.decode("utf-8").strip()

    args = (event.pattern_match.group(1) or "").strip().lower()

    if not changelog:
        return await msg.edit(
            "✅ **DcXuserbot is already running the latest version!**\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "🛰️ **Host:** AWS EC2 Cloud\n"
            "📦 **Branch:** Up-to-date with GitHub repository."
        )

    # If user ran .update without "now" or "force", show changelog preview and confirm prompt
    if args not in ["now", "pull", "force", "confirm"]:
        preview = "\n".join([f"• '{line}'" for line in changelog.splitlines()[:8]])
        count = len(changelog.splitlines())
        prompt_text = (
            f"🚀 **{count} New Update(s) Found on GitHub!**\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{preview}\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "💡 To pull latest changes and restart your bot, run:\n"
            f"👉 **'{Config.COMMAND_HAND_LER}update now'**"
        )
        return await msg.edit(prompt_text)

    # 4. Pull latest changes
    await msg.edit("📥 **Pulling latest updates from GitHub...**")
    pull_proc = await asyncio.create_subprocess_shell(
        "git pull --rebase || git pull",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    p_out, p_err = await pull_proc.communicate()

    # 5. Check if requirements.txt was updated and install dependencies
    await msg.edit("📦 **Checking & syncing Python dependencies...**")
    pip_proc = await asyncio.create_subprocess_shell(
        "pip install --upgrade -r requirements.txt",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await pip_proc.communicate()

    # 6. Inform user & Gracefully restart userbot
    await msg.edit(
        "⚡ **Update successfully pulled!**\n"
        "🔄 **Restarting DcXuserbot systemd service on AWS EC2...**\n"
        "Bot will be back online in ~5 seconds. Check with **'.alive'**!"
    )
    
    # Trigger restart via systemd or process replacement
    os.system("sudo systemctl restart dcxuserbot || (kill -9 %d && python3 main.py)" % os.getpid())
