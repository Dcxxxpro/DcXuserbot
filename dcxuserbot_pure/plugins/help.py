"""
DcXuserbot Interactive Help Codex Plugin
Routes command codex queries through the Companion Assistant Bot (BOT_TOKEN)
via Telegram Inline Queries to render rich interactive inline keyboard buttons in 3-column grid
with header photo banner and dynamic category navigation.
"""

import logging
from telethon import Button
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.Help")

HELP_CATEGORIES = {
    "Admin": (
        "👮 **Group Moderation & Administration:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.ban <reply/user>` - Ban user from current chat\n"
        "• `.unban <reply/user>` - Unban user from group\n"
        "• `.mute <reply/user>` - Mute member in group\n"
        "• `.unmute <reply/user>` - Unmute restricted member\n"
        "• `.kick <reply/user>` - Kick member from group\n"
        "• `.purge <reply>` - Lightning bulk purge messages\n"
        "• `.pin [loud]` - Pin replied message silently or with alert\n"
        "• `.promote <title>` - Promote member to admin status\n"
        "• `.demote` - Revoke administrator rights\n"
        "• `.zombies` - Clean deleted Telegram accounts"
    ),
    "Tools": (
        "🛠️ **Utility Arsenal & Diagnostics:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.ping` - Sub-millisecond latency benchmark with inline buttons\n"
        "• `.speedtest` - Run live network bandwidth benchmark\n"
        "• `.whois <reply>` - Extract full user info, ID, DC & bio\n"
        "• `.join <target>` - Join channels & private invite hashes\n"
        "• `.calc <math>` - Built-in high-precision calculator\n"
        "• `.id` - Fetch chat ID, sender ID, and DC number"
    ),
    "AI": (
        "🧠 **Groq & Gemini Artificial Intelligence:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.aidm <query>` - Profile scanner with Groq openai/gpt-oss-120b\n"
        "• `.ai <prompt>` - Ask Google Gemini AI directly with multimodal\n"
        "• `.summarize` - Summarize replied chat conversation\n"
        "• `.code <prompt>` - Generate, explain & inspect code snippets"
    ),
    "EC2": (
        "☁️ **AWS EC2 Cloud Infrastructure:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.ec2 status` - Live instance load, CPU, RAM & disk telemetry\n"
        "• `.ec2 reboot` - Graceful soft reboot of dcxuserbot daemon\n"
        "• `.ec2 logs` - Inspect live systemd service journalctl logs\n"
        "• `Host Node:` AWS EC2 us-east-1 (Amazon Linux 2023)"
    ),
    "Media": (
        "🎨 **Media Converters & Downloader:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.quote` - Convert replied message into Quotly Telegram sticker\n"
        "• `.song <name>` - Download high-res audio mp3 via yt-dlp\n"
        "• `.video <name>` - Download YouTube & social video clips\n"
        "• `.telegraph` - Upload media to Telegraph CDN fast"
    ),
    "Broadcast": (
        "📢 **Broadcast & Mass Mentions:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.tagall [message]` - Mention all group members safely\n"
        "• `.gcast <message>` - Broadcast announcements across joined groups\n"
        "• `.cancel` - Stop ongoing tagall or broadcast task"
    ),
    "PM": (
        "🛡️ **Anti-PM Spam Shield & Gatekeeper:**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "• `.approve` - Whitelist replied user for private messages\n"
        "• `.disapprove` - Remove user from approved whitelist\n"
        "• `.block` - Immediately block spammer and report"
    )
}

@register(pattern="help(?:\s+(.*))?$")
async def help_menu(event):
    """
    Display the interactive command codex with categories and usage.
    Triggers an inline query to BOT_USERNAME to render rich interactive inline buttons in 3 columns.
    """
    arg = (event.pattern_match.group(1) or "").strip()
    help_pic = getattr(Config, "HELP_PIC", Config.ALIVE_MEDIA)
    
    # 1. If specific category query requested directly: e.g. .help admin
    if arg:
        matched_cat = None
        for key in HELP_CATEGORIES:
            if key.lower() == arg.lower():
                matched_cat = key
                break
                
        if matched_cat:
            cat_text = (
                f"[\xad]({help_pic})"
                f"{HELP_CATEGORIES[matched_cat]}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"💡 *Type* `{Config.COMMAND_HAND_LER}help` *to open the interactive 3-column menu.*"
            )
            return await event.client.edit_or_reply(event, cat_text, link_preview=True)
        else:
            return await event.client.edit_or_reply(
                event,
                f"❌ **Unknown category:** `{arg}`\n"
                f"Available: `Admin`, `Tools`, `AI`, `EC2`, `Media`, `Broadcast`, `PM`"
            )

    # 2. Route through Companion Assistant Bot via Telegram Inline Queries
    if Config.BOT_TOKEN and Config.BOT_USERNAME:
        bot_username = Config.BOT_USERNAME.replace("@", "").strip()
        try:
            LOGS.info(f"Querying assistant bot @{bot_username} for inline 3-column help codex...")
            results = await event.client.inline_query(bot_username, "help")
            if results and len(results) > 0:
                await results[0].click(
                    event.chat_id,
                    reply_to=event.reply_to_msg_id,
                    hide_via=True
                )
                await event.delete()
                return
            else:
                LOGS.warning(f"Inline query to @{bot_username} returned 0 results. Check /setinline in @BotFather.")
        except Exception as exc:
            LOGS.warning(f"Could not render inline help menu via @{bot_username}: {exc}")

    # 3. Rich text fallback if companion bot is not active or inline query is disabled
    fallback_text = (
        f"[\xad]({help_pic})"
        f"📖 **DcXuserbot Command Codex**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Prefix: `{Config.COMMAND_HAND_LER}` | Sudo: `{Config.SUDO_COMMAND_HAND_LER}`\n\n"
        f"• **Admin:** `.ban`, `.unban`, `.mute`, `.kick`, `.purge`, `.pin`\n"
        f"• **Tools:** `.ping`, `.speedtest`, `.whois`, `.join`, `.calc`\n"
        f"• **AI Suite:** `.aidm`, `.ai`, `.summarize`, `.code`\n"
        f"• **EC2 Status:** `.ec2 status`, `.ec2 reboot`, `.ec2 logs`\n"
        f"• **Media:** `.quote`, `.song`, `.video`, `.telegraph`\n"
        f"• **PM Shield:** `.approve`, `.disapprove`, `.block`\n"
        f"• **Broadcast:** `.tagall`, `.gcast`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 *Type* `{Config.COMMAND_HAND_LER}help <category>` *to view details.*"
    )
    if not Config.BOT_TOKEN or not Config.BOT_USERNAME:
        fallback_text += f"\n✨ *Configure BOT_TOKEN & enable /setinline in @BotFather for the 3-column interactive menu.*"
        
    await event.client.edit_or_reply(event, fallback_text, link_preview=True)
