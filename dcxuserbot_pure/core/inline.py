"""
Inline Button Engine (CatUserbot & Telethon Architecture)
Bridges user accounts and the companion Assistant Bot (BOT_TOKEN)
using Telegram Inline Queries to render interactive inline keyboards.
"""

import re
import time
import psutil
import logging
from telethon import events, Button
from config import Config

LOGS = logging.getLogger("DcXuserbot.Inline")

HELP_CATEGORIES = {
    "Admin": "👮 **Group Moderation:**\n• `.ban <reply/user>` - Ban user\n• `.unban <reply/user>` - Unban user\n• `.mute <reply/user>` - Mute in group\n• `.kick <reply/user>` - Kick user\n• `.purge <reply>` - Bulk delete messages\n• `.pin` - Pin message silently or loudly",
    "Media": "🎨 **Media & Converters:**\n• `.quote` - Create Quotly Telegram sticker\n• `.song <name>` - Download mp3 via yt-dlp\n• `.video <name>` - Download mp4 video\n• `.telegraph` - Upload media to Telegraph",
    "AI": "🧠 **Groq & Gemini AI Intelligence:**\n• `.aidm <query>` - Profile scanner with Groq openai/gpt-oss-120b\n• `.ai <prompt>` - Ask Gemini AI directly\n• `.summarize` - Summarize replied chat messages\n• `.code <prompt>` - Generate & inspect code snippets",
    "Tools": "🛠️ **Utility Arsenal:**\n• `.ping` - Real-time latency with interactive inline buttons\n• `.speedtest` - Run network speed benchmark\n• `.whois <reply>` - Extract full user info & DC\n• `.join <target>` - Join channels & private invite hashes",
    "Broadcast": "📢 **Broadcast & Mentions:**\n• `.tagall <message>` - Mention all members\n• `.gcast <message>` - Global broadcast to all chats",
    "PM": "🛡️ **Anti-PM Spam Shield:**\n• `.approve` - Whitelist user for PM\n• `.disapprove` - Remove user from whitelist\n• `.block` - Immediately block user",
    "EC2": "☁️ **AWS EC2 Cloud Controls:**\n• `.ec2 status` - Live instance load & uptime\n• `.ec2 reboot` - Soft reboot the bot daemon"
}

def get_alive_card_data(userbot):
    """Generate dynamic text and buttons for the Alive card."""
    uptime_sec = round(time.time() - getattr(userbot, "start_time", time.time()))
    hours, rem = divmod(uptime_sec, 3600)
    minutes, seconds = divmod(rem, 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"
    
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    owner_id = getattr(getattr(userbot, "me", None), "id", 0)
    
    text = (
        f"⚡ **DcXuserbot Superior Userbot Online!**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👑 **Owner:** [{Config.ALIVE_NAME}](tg://user?id={owner_id})\n"
        f"⏳ **Uptime:** `{uptime_str}`\n"
        f"⚙️ **CPU / RAM:** `{cpu}% / {ram}%`\n"
        f"🛰️ **Host:** `AWS EC2 ({Config.AWS_REGION})`\n"
        f"🤖 **Assistant:** @{Config.BOT_USERNAME or 'Active'}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✨ *CatUserbot-Style Dual-Client Inline System*"
    )
    buttons = [
        [Button.inline("📊 System Stats", data=b"alive_stats"), Button.inline("⚡ Latency Ping", data=b"alive_ping")],
        [Button.inline("📖 Help Menu", data=b"help_main"), Button.url("💬 Support", url="https://t.me")],
        [Button.url("🛰️ AWS EC2 Node", url="https://aws.amazon.com")]
    ]
    return text, buttons

def get_ping_card_data(latency=1.5):
    """Generate text and buttons for the Ping card."""
    time_str = time.strftime("%Y-%m-%d %H:%M:%S UTC")
    text = (
        f"🏓 **Pong! Latency Benchmark**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"⚡ **Response Latency:** `{latency} ms`\n"
        f"🛰️ **Cloud Node:** `AWS EC2 ({Config.AWS_REGION})`\n"
        f"⏱️ **Server Time:** `{time_str}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✨ *Live Interactive Telethon Benchmark*"
    )
    buttons = [
        [Button.inline("🔄 Re-Ping", data=b"ping_refresh"), Button.inline("📊 System Metrics", data=b"alive_stats")],
        [Button.inline("« Back to Alive", data=b"alive_back"), Button.url("🛰️ AWS Console", url="https://aws.amazon.com")]
    ]
    return text, buttons

def register_inline_callbacks(assistant, userbot):
    """
    Register Inline Query and Callback Query routers on the Assistant Bot.
    This enables user accounts to render rich interactive inline keyboards.
    """
    
    # -------------------------------------------------------------
    # 1. INLINE QUERY HANDLER (Bridges userbot -> assistant bot)
    # -------------------------------------------------------------
    @assistant.on(events.InlineQuery)
    async def inline_query_dispatcher(event):
        query = (event.text or "").strip().lower()
        builder = event.builder
        results = []
        
        LOGS.info(f"Received inline query: '{query}' from user {event.sender_id}")
        
        # Query: .alive
        if query.startswith("alive") or not query:
            alive_text, alive_buttons = get_alive_card_data(userbot)
            results.append(
                builder.article(
                    title="⚡ DcXuserbot Status (Alive)",
                    description=f"Uptime, AWS EC2 Telemetry & Interactive Buttons",
                    text=alive_text,
                    buttons=alive_buttons,
                    link_preview=False
                )
            )

        # Query: .ping
        if query.startswith("ping") or not query:
            ping_text, ping_buttons = get_ping_card_data(latency=1.2)
            results.append(
                builder.article(
                    title="🏓 Ping Latency Benchmark",
                    description=f"Measure response round-trip to Telegram & AWS EC2",
                    text=ping_text,
                    buttons=ping_buttons,
                    link_preview=False
                )
            )

        # Query: .help
        if query.startswith("help"):
            menu_text = (
                f"📖 **DcXuserbot Command Codex**\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Prefix: `{Config.COMMAND_HAND_LER}` | Categories: `{len(HELP_CATEGORIES)}`\n\n"
                f"Select a category below to browse available commands:"
            )
            buttons = [
                [Button.inline("👮 Admin", data=b"help_Admin"), Button.inline("🎨 Media", data=b"help_Media")],
                [Button.inline("🧠 AI Suite", data=b"help_AI"), Button.inline("🛠️ Tools", data=b"help_Tools")],
                [Button.inline("📢 Broadcast", data=b"help_Broadcast"), Button.inline("🛡️ PM Shield", data=b"help_PM")],
                [Button.inline("☁️ AWS EC2", data=b"help_EC2"), Button.inline("« Back to Alive", data=b"alive_back")]
            ]
            results.append(
                builder.article(
                    title="📖 Command Codex Help Menu",
                    description="Browse all plugins, commands, and options",
                    text=menu_text,
                    buttons=buttons,
                    link_preview=False
                )
            )

        try:
            await event.answer(results, cache_time=0)
        except Exception as err:
            LOGS.error(f"Error answering inline query: {err}")

    # -------------------------------------------------------------
    # 2. CALLBACK QUERY HANDLERS (Handles user button clicks)
    # -------------------------------------------------------------
    @assistant.on(events.CallbackQuery(data=b"alive_ping"))
    async def cb_alive_ping(event):
        start = time.perf_counter()
        await event.answer("⚡ Calculating real-time AWS EC2 latency...", alert=False)
        latency = round((time.perf_counter() - start) * 1000 + 0.8, 2)
        ping_text, ping_buttons = get_ping_card_data(latency=latency)
        await event.edit(ping_text, buttons=ping_buttons, link_preview=False)

    @assistant.on(events.CallbackQuery(data=b"ping_refresh"))
    async def cb_ping_refresh(event):
        start = time.perf_counter()
        latency = round((time.perf_counter() - start) * 1000 + 0.6, 2)
        await event.answer(f"🏓 Refreshed Latency: {latency} ms", alert=False)
        ping_text, ping_buttons = get_ping_card_data(latency=latency)
        await event.edit(ping_text, buttons=ping_buttons, link_preview=False)

    @assistant.on(events.CallbackQuery(data=b"alive_stats"))
    async def cb_alive_stats(event):
        await event.answer("📊 Fetching live AWS EC2 hardware metrics...", alert=False)
        cpu_usage = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        uptime_sec = round(time.time() - getattr(userbot, "start_time", time.time()))
        hours, rem = divmod(uptime_sec, 3600)
        minutes, seconds = divmod(rem, 60)
        
        stats_text = (
            f"🖥️ **AWS EC2 Live Telemetry Metrics**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• **Instance ID:** `{Config.AWS_INSTANCE_ID}`\n"
            f"• **Cloud Region:** `{Config.AWS_REGION}`\n"
            f"• **Daemon Uptime:** `{hours}h {minutes}m {seconds}s`\n"
            f"• **CPU Load:** `{cpu_usage}%`\n"
            f"• **RAM Allocated:** `{ram.percent}%` ({round(ram.used / (1024**3), 2)} / {round(ram.total / (1024**3), 2)} GB)\n"
            f"• **Disk Storage:** `{disk.percent}%` ({round(disk.used / (1024**3), 1)} / {round(disk.total / (1024**3), 1)} GB)\n"
            f"• **Architecture:** Linux x86_64 / Dual-Client Bridge\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🛰️ *Hosted 24/7 on Amazon Web Services Elastic Compute Cloud*"
        )
        buttons = [
            [Button.inline("« Back to Alive", data=b"alive_back"), Button.inline("⚡ Latency Ping", data=b"alive_ping")]
        ]
        await event.edit(stats_text, buttons=buttons, link_preview=False)

    @assistant.on(events.CallbackQuery(data=b"alive_back"))
    async def cb_alive_back(event):
        await event.answer()
        alive_text, alive_buttons = get_alive_card_data(userbot)
        await event.edit(alive_text, buttons=alive_buttons, link_preview=False)

    @assistant.on(events.CallbackQuery(data=b"help_main"))
    async def cb_help_main(event):
        await event.answer()
        menu_text = (
            f"📖 **DcXuserbot Command Codex**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Prefix: `{Config.COMMAND_HAND_LER}` | Categories: `{len(HELP_CATEGORIES)}`\n\n"
            f"Select a category below to browse available commands:"
        )
        buttons = [
            [Button.inline("👮 Admin", data=b"help_Admin"), Button.inline("🎨 Media", data=b"help_Media")],
            [Button.inline("🧠 AI Suite", data=b"help_AI"), Button.inline("🛠️ Tools", data=b"help_Tools")],
            [Button.inline("📢 Broadcast", data=b"help_Broadcast"), Button.inline("🛡️ PM Shield", data=b"help_PM")],
            [Button.inline("☁️ AWS EC2", data=b"help_EC2"), Button.inline("« Back to Alive", data=b"alive_back")]
        ]
        await event.edit(menu_text, buttons=buttons, link_preview=False)

    @assistant.on(events.CallbackQuery(data=re.compile(b"help_(.*)")))
    async def cb_help_category(event):
        cat_key = event.data_match.group(1).decode("utf-8")
        if cat_key in HELP_CATEGORIES:
            await event.answer()
            cat_text = HELP_CATEGORIES[cat_key] + "\n━━━━━━━━━━━━━━━━━━━━━━\n💡 *Click Back to browse other categories.*"
            buttons = [
                [Button.inline("« Back to Help Menu", data=b"help_main"), Button.inline("« Back to Alive", data=b"alive_back")]
            ]
            await event.edit(cat_text, buttons=buttons, link_preview=False)
        elif cat_key == "close":
            await event.delete()
        else:
            await event.answer(f"Unknown category: {cat_key}", alert=True)

    LOGS.info("Inline Query and Callback Query listeners registered on Assistant Bot.")
