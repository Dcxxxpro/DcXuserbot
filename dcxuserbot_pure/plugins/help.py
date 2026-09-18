from telethon import Button
from core.managers import register
from config import Config

CATEGORIES = {
    "Admin": "👮 **Group Moderation:**\n• `.ban <reply/user>` - Ban user\n• `.unban <reply/user>` - Unban user\n• `.mute <reply/user>` - Mute in group\n• `.kick <reply/user>` - Kick user\n• `.purge <reply>` - Bulk delete messages\n• `.pin` - Pin message silently or loudly",
    "Media": "🎨 **Media & Converters:**\n• `.quote` - Create Quotly Telegram sticker\n• `.song <name>` - Download mp3 via yt-dlp\n• `.video <name>` - Download mp4 video\n• `.telegraph` - Upload media to Telegraph",
    "AI": "🧠 **Gemini AI Suite:**\n• `.ai <prompt>` - Ask Gemini AI directly\n• `.summarize` - Summarize replied chat messages\n• `.code <prompt>` - Generate & inspect code snippets",
    "Tools": "🛠️ **Utility Arsenal:**\n• `.ping` - Measure precise latency\n• `.speedtest` - Run full network speedtest\n• `.whois <reply>` - Extract full user info & DC\n• `.calc <expression>` - Quick calculation",
    "Broadcast": "📢 **Broadcast & Mentions:**\n• `.tagall <message>` - Mention all members\n• `.gcast <message>` - Global broadcast to all chats",
    "PM Shield": "🛡️ **Anti-PM Spam Shield:**\n• `.approve` - Whitelist user for PM\n• `.disapprove` - Remove user from whitelist\n• `.block` - Immediately block user",
    "EC2": "☁️ **AWS EC2 Cloud Controls:**\n• `.ec2 status` - Live instance load & uptime\n• `.ec2 reboot` - Soft reboot the bot daemon"
}

@register(pattern="help(?:\s+(.*))?$")
async def help_menu(event):
    """Display the interactive command menu with categories and usage."""
    query = event.pattern_match.group(1)
    
    if query and query.capitalize() in CATEGORIES:
        text = CATEGORIES[query.capitalize()]
        await event.client.edit_or_reply(event, text)
        return
        
    menu_text = (
        f"📖 **DcXuserbot Command Codex**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Prefix: `{Config.COMMAND_HAND_LER}` | Total Categories: `{len(CATEGORIES)}`\n\n"
        f"Select a category below or type `{Config.COMMAND_HAND_LER}help <category>`:"
    )
    
    # Inline buttons layout for interactive browsing
    buttons = [
        [Button.inline("👮 Admin", data="help_Admin"), Button.inline("🎨 Media", data="help_Media")],
        [Button.inline("🧠 Gemini AI", data="help_AI"), Button.inline("🛠️ Tools", data="help_Tools")],
        [Button.inline("📢 Broadcast", data="help_Broadcast"), Button.inline("🛡️ PM Shield", data="help_PM")],
        [Button.inline("☁️ AWS EC2", data="help_EC2"), Button.inline("❌ Close", data="help_close")]
    ]
    
    await event.client.edit_or_reply(event, menu_text)
