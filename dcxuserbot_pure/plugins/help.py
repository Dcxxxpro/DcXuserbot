"""
DcXuserbot Interactive Help Codex Plugin
Routes command codex queries through the Companion Assistant Bot (BOT_TOKEN)
via Telegram Inline Queries to render interactive inline keyboard buttons:
Admin, Tools, AI, EC2 Status, Media, PM Shield, Broadcast, and Close.
"""

import logging
from telethon import Button
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.Help")

HELP_CATEGORIES = {
    "Admin": "👮 **Group Moderation:**\n• `.ban <reply/user>` - Ban user\n• `.unban <reply/user>` - Unban user\n• `.mute <reply/user>` - Mute in group\n• `.kick <reply/user>` - Kick user\n• `.purge <reply>` - Bulk delete messages\n• `.pin` - Pin message silently or loudly",
    "Tools": "🛠️ **Utility Arsenal:**\n• `.ping` - Real-time latency with interactive inline buttons\n• `.speedtest` - Run network speed benchmark\n• `.whois <reply>` - Extract full user info & DC\n• `.join <target>` - Join channels & private invite hashes",
    "AI": "🧠 **Groq & Gemini AI Intelligence:**\n• `.aidm <query>` - Profile scanner with Groq openai/gpt-oss-120b\n• `.ai <prompt>` - Ask Gemini AI directly\n• `.summarize` - Summarize replied chat messages\n• `.code <prompt>` - Generate & inspect code snippets",
    "EC2": "☁️ **AWS EC2 Cloud Controls:**\n• `.ec2 status` - Live instance load, CPU, RAM & uptime\n• `.ec2 reboot` - Soft reboot the bot daemon",
    "Media": "🎨 **Media & Converters:**\n• `.quote` - Create Quotly Telegram sticker\n• `.song <name>` - Download mp3 via yt-dlp\n• `.video <name>` - Download mp4 video\n• `.telegraph` - Upload media to Telegraph",
    "Broadcast": "📢 **Broadcast & Mentions:**\n• `.tagall <message>` - Mention all members\n• `.gcast <message>` - Global broadcast to all chats",
    "PM": "🛡️ **Anti-PM Spam Shield:**\n• `.approve` - Whitelist user for PM\n• `.disapprove` - Remove user from whitelist\n• `.block` - Immediately block user"
}

@register(pattern="help(?:\s+(.*))?$")
async def help_menu(event):
    """
    Display the interactive command codex with categories and usage.
    Triggers an inline query to BOT_USERNAME to render interactive inline buttons.
    """
    arg = (event.pattern_match.group(1) or "").strip()
    
    # If specific category query requested directly: e.g. .help admin
    if arg:
        matched_cat = None
        for key in HELP_CATEGORIES:
            if key.lower() == arg.lower():
                matched_cat = key
                break
                
        if matched_cat:
            cat_text = (
                f"{HELP_CATEGORIES[matched_cat]}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"💡 *Type* `{Config.COMMAND_HAND_LER}help` *for interactive category buttons.*"
            )
            return await event.client.edit_or_reply(event, cat_text)
        else:
            return await event.client.edit_or_reply(
                event,
                f"❌ **Unknown category:** `{arg}`\n"
                f"Available: `Admin`, `Tools`, `AI`, `EC2`, `Media`, `Broadcast`, `PM`"
            )

    # 1. Route through Companion Assistant Bot via Telegram Inline Queries
    if Config.BOT_TOKEN and Config.BOT_USERNAME:
        bot_username = Config.BOT_USERNAME.replace("@", "").strip()
        try:
            LOGS.info(f"Querying assistant bot @{bot_username} for inline help codex...")
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

    # 2. Text fallback if companion bot is not active or inline query is disabled
    fallback_text = (
        f"📖 **DcXuserbot Command Codex**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Prefix: `{Config.COMMAND_HAND_LER}` | Sudo: `{Config.SUDO_COMMAND_HAND_LER}`\n\n"
        f"• **Admin:** `.ban`, `.unban`, `.mute`, `.kick`, `.purge`, `.pin`\n"
        f"• **Tools:** `.ping`, `.speedtest`, `.whois`, `.join`\n"
        f"• **AI Suite:** `.aidm`, `.ai`, `.summarize`, `.code`\n"
        f"• **EC2 Status:** `.ec2 status`, `.ec2 reboot`\n"
        f"• **Media:** `.quote`, `.song`, `.video`, `.telegraph`\n"
        f"• **PM Shield:** `.approve`, `.disapprove`, `.block`\n"
        f"• **Broadcast:** `.tagall`, `.gcast`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 *Type* `{Config.COMMAND_HAND_LER}help <category>` *to view details.*"
    )
    if not Config.BOT_TOKEN or not Config.BOT_USERNAME:
        fallback_text += f"\n✨ *Configure BOT_TOKEN and enable /setinline in @BotFather for interactive inline buttons.*"
        
    await event.client.edit_or_reply(event, fallback_text)
