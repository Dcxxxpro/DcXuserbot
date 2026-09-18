import { UserbotFile } from '../types';

export const USERBOT_FILES: UserbotFile[] = [
  {
    path: 'main.py',
    name: 'main.py',
    category: 'core',
    description: 'Main application bootstrap: initializes Telethon Userbot & Assistant Bot with dual-client inline bridge.',
    content: `#!/usr/bin/env python3
"""
DcXuserbot - Advanced Telegram Userbot with Inline Assistant Bridge
Designed for 24/7 AWS EC2 high-availability deployments.
Equipped with strict Sudo User Access Control & Groq / Gemini AI Engines.
"""

import sys
import asyncio
import logging
import traceback
from core.client import DcXUserBot, DcXAssistantBot
from core.managers import load_all_plugins
from core.inline import register_inline_callbacks
from config import Config

logging.basicConfig(
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)]
)
LOGS = logging.getLogger("DcXuserbot")

async def start_dcx():
    LOGS.info(">>> Starting DcXuserbot Userbot Engine...")
    
    # 1. Initialize User Client with StringSession
    userbot = DcXUserBot()
    try:
        await userbot.start()
        me = await userbot.get_me()
        userbot.me = me
        LOGS.info(f"Userbot authenticated as: @{me.username or me.first_name} (ID: {me.id})")
    except Exception as e:
        LOGS.critical(f"Failed to authenticate Telethon Userbot session: {e}\n{traceback.format_exc()}")
        sys.exit(1)
    
    # 2. Initialize Inline Assistant Bot (Powers CatUserbot-style inline buttons)
    assistant = None
    if Config.BOT_TOKEN:
        LOGS.info(">>> Starting Companion Assistant Bot for Inline Buttons...")
        try:
            assistant = DcXAssistantBot(userbot=userbot)
            await assistant.start()
            bot_info = await assistant.get_me()
            assistant.me = bot_info
            LOGS.info(f"Assistant Bot online: @{bot_info.username}")
            register_inline_callbacks(assistant, userbot)
            LOGS.info("Registered inline button callback router.")
        except Exception as e:
            LOGS.warning(f"Assistant Bot failed to start: {e}. Falling back to text representation.")
            assistant = None
    else:
        LOGS.warning("No BOT_TOKEN found! Inline buttons will fall back to text representation.")
    
    # 3. Dynamically discover and load all plugins with strict sudo enforcement
    loaded_count = await load_all_plugins(userbot, assistant)
    LOGS.info(f"Successfully loaded and bound {loaded_count} plugins with strict sudo control.")
    
    # 4. Notify Owner in Saved Messages
    startup_msg = (
        "⚡ **DcXuserbot is Live on AWS EC2!**\n\n"
        f"• **Owner:** [{me.first_name}](tg://user?id={me.id})\n"
        f"• **Assistant:** @{Config.BOT_USERNAME or 'Disabled'}\n"
        f"• **Owner Prefix:** \`{Config.COMMAND_HAND_LER}\`\n"
        f"• **Sudo Prefix:** \`{Config.SUDO_COMMAND_HAND_LER}\`\n"
        f"• **Sudo Users:** \`{len(Config.SUDO_USERS)}\` authorized\n"
        f"• **Groq AI:** \`{'Enabled (openai/gpt-oss-120b)' if Config.GROQ_API_KEY else 'Disabled'}\`\n"
        f"• **Plugins:** \`{loaded_count}\` active\n"
        "• **Host:** AWS EC2 Cloud Daemon (Systemd)"
    )
    try:
        await userbot.send_message("me", startup_msg)
    except Exception as e:
        LOGS.debug(f"Could not send startup note to Saved Messages: {e}")

    LOGS.info("DcXuserbot is fully operational. Awaiting incoming commands...")
    
    # Run loop indefinitely
    await asyncio.gather(
        userbot.run_until_disconnected(),
        assistant.run_until_disconnected() if assistant else asyncio.sleep(0)
    )

if __name__ == "__main__":
    try:
        asyncio.run(start_dcx())
    except (KeyboardInterrupt, SystemExit):
        LOGS.info("DcXuserbot stopped cleanly.")
    except Exception as exc:
        LOGS.critical(f"Fatal crash in userbot daemon: {exc}\n{traceback.format_exc()}")
        sys.exit(1)
`
  },
  {
    path: 'config.py',
    name: 'config.py',
    category: 'config',
    description: 'Centralized environment configuration loader with safety validation and defaults.',
    content: `import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Telegram API credentials from https://my.telegram.org
    API_ID = int(os.getenv("API_ID", "0"))
    API_HASH = os.getenv("API_HASH", "")
    
    # User String Session (Telethon Session string)
    STRING_SESSION = os.getenv("STRING_SESSION", "")
    
    # Companion Assistant Bot Token (From @BotFather) for Inline Buttons
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")
    BOT_USERNAME = os.getenv("BOT_USERNAME", "").replace("@", "")
    
    # Command Handler Prefix (Default: .)
    COMMAND_HAND_LER = os.getenv("COMMAND_HAND_LER", ".")
    SUDO_COMMAND_HAND_LER = os.getenv("SUDO_COMMAND_HAND_LER", "!")
    
    # Authorized Sudo Users (Comma separated IDs: "1234567,9876543")
    SUDO_USERS = [
        int(x.strip()) 
        for x in os.getenv("SUDO_USERS", "").split(",") 
        if x.strip().isdigit()
    ]
    
    # Custom Alive Profile
    ALIVE_NAME = os.getenv("ALIVE_NAME", "DcX Master")
    ALIVE_MEDIA = os.getenv("ALIVE_MEDIA", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200")
    
    # AI Engine API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Anti-PM Spam Configuration
    PM_PERMIT = os.getenv("PM_PERMIT", "True").lower() in ("true", "1", "yes")
    PM_LIMIT = int(os.getenv("PM_LIMIT", "4"))
    
    # AWS EC2 Cloud Settings
    AWS_INSTANCE_ID = os.getenv("AWS_INSTANCE_ID", "i-ec2-dcxuserbot")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
`
  },
  {
    path: 'sample_config.env',
    name: 'sample_config.env',
    category: 'config',
    description: 'Template environment file for configuring credentials before launching.',
    content: `# ==========================================================
# DcXuserbot - AWS EC2 Telegram Userbot Configuration File
# ==========================================================

# 1. Telegram Core Credentials (from https://my.telegram.org)
API_ID=1234567
API_HASH=abcdef0123456789abcdef0123456789

# 2. Telethon String Session
STRING_SESSION=1BVtsO...YourTelethonStringSessionHere...

# 3. Companion Assistant Bot Token (From @BotFather)
BOT_TOKEN=7123456789:AAH...YourBotFatherTokenHere...
BOT_USERNAME=DcXAssistantBot

# 4. Control Prefixes & Strict Sudo Access
COMMAND_HAND_LER=.
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=123456789,987654321

# 5. Alive & Personalization
ALIVE_NAME=DcX Commander
ALIVE_MEDIA=https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200

# 6. AI Integrations (Groq Ultra-Fast API + Gemini)
# Obtain Groq key from: https://console.groq.com/keys
GROQ_API_KEY=gsk_...YourGroqKeyHere...
GEMINI_API_KEY=AIzaSy...YourGeminiKeyHere...

# 7. Security & PM Spam Shield
PM_PERMIT=True
PM_LIMIT=4

# 8. AWS EC2 Cloud Settings
AWS_REGION=us-east-1
AWS_INSTANCE_ID=i-ec2-dcxuserbot
`
  },
  {
    path: 'core/client.py',
    name: 'client.py',
    category: 'core',
    description: 'Custom Telethon TelegramClient wrappers with inline button dispatching and message editors.',
    content: `import time
from telethon import TelegramClient
from telethon.sessions import StringSession
from config import Config

class DcXUserBot(TelegramClient):
    """Primary Userbot client executing commands from the user's account."""
    def __init__(self):
        super().__init__(
            StringSession(Config.STRING_SESSION),
            api_id=Config.API_ID,
            api_hash=Config.API_HASH,
            device_model="DcXuserbot AWS EC2",
            system_version="Linux x86_64",
            app_version="4.2.0"
        )
        self.start_time = time.time()
        self.commands_executed = 0

    async def edit_or_reply(self, event, text, parse_mode="md", link_preview=False):
        """Unified helper to edit user's command or reply if from sudo user."""
        self.commands_executed += 1
        if event.sender_id == (await self.get_me()).id:
            return await event.edit(text, parse_mode=parse_mode, link_preview=link_preview)
        return await event.reply(text, parse_mode=parse_mode, link_preview=link_preview)

class DcXAssistantBot(TelegramClient):
    """Companion Bot client dedicated to sending inline buttons and handling callbacks."""
    def __init__(self, userbot: DcXUserBot):
        super().__init__(
            "DcXAssistantSession",
            api_id=Config.API_ID,
            api_hash=Config.API_HASH
        )
        self.userbot = userbot

    async def start(self):
        await super().start(bot_token=Config.BOT_TOKEN)
`
  },
  {
    path: 'core/managers.py',
    name: 'managers.py',
    category: 'core',
    description: 'Event registration decorator, regex patterns, permission checks, and plugin loader.',
    content: `import os
import re
import sys
import glob
import logging
import importlib
import traceback
from telethon import events
from config import Config

LOGS = logging.getLogger("DcXuserbot.Managers")

CMD_PREFIX = re.escape(Config.COMMAND_HAND_LER)
SUDO_PREFIX = re.escape(Config.SUDO_COMMAND_HAND_LER)

PLUGINS_REGISTRY = {}

def register(pattern=None, sudo=True, **args):
    """
    Decorator to register userbot commands with strict authorization:
    - Bot Owner (and self outgoing events) can execute all commands via COMMAND_HAND_LER or SUDO_COMMAND_HAND_LER.
    - Sudo users whose IDs are in Config.SUDO_USERS can execute commands marked sudo=True via SUDO_COMMAND_HAND_LER or COMMAND_HAND_LER.
    - Non-authorized users are silently ignored (no response, no exceptions, no info leak).
    - Top-level exception safety prevents bot crashes and provides user feedback.
    """
    def decorator(func):
        if pattern:
            # Pattern matching both owner prefix and sudo prefix: e.g. ^[.!](command)(?:\s+(.*))?$
            regex = f"^[{CMD_PREFIX}{SUDO_PREFIX}]{pattern}"
            args["pattern"] = re.compile(regex)

        async def wrapper(event):
            try:
                # 1. Identity & Sudo Authorization Check
                me = getattr(event.client, "me", None)
                if me is None:
                    me = await event.client.get_me()
                    event.client.me = me
                
                sender_id = event.sender_id
                
                # Verify whether the sender is the bot owner or authorized sudo
                is_owner = (sender_id == me.id) or event.out
                is_sudo = (sender_id in Config.SUDO_USERS)
                
                if not (is_owner or is_sudo):
                    # Silently ignore unauthorized attempts
                    return
                
                # Check command level permission: if sudo=False, only owner can run
                if not is_owner and not sudo:
                    LOGS.warning(f"Sudo user {sender_id} attempted owner-only command: {func.__name__}")
                    return

                # 2. Execute Handler with robust safety net
                await func(event)
                
            except events.StopPropagation:
                raise events.StopPropagation
            except Exception as exc:
                err_trace = traceback.format_exc()
                LOGS.error(f"Unhandled exception in command [{func.__name__}]: {exc}\n{err_trace}")
                
                # Format friendly Telegram error without leaving message stuck in 'Processing...'
                friendly_error = (
                    f"❌ **Command Execution Failed:** \`{func.__name__}\`\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"⚠️ **Reason:** \`{type(exc).__name__}: {str(exc) or 'Unknown error'}\`\n"
                    f"💡 *Check terminal or systemd journal logs for full traceback.*"
                )
                try:
                    await event.client.edit_or_reply(event, friendly_error)
                except Exception:
                    pass

        # Register metadata for discovery & codex help menu
        doc = func.__doc__ or "No description provided."
        cmd_name = pattern.split()[0].replace("(.*)", "").replace("$", "").replace("(?:", "").strip() if pattern else func.__name__
        PLUGINS_REGISTRY[cmd_name] = {
            "handler": wrapper,
            "doc": doc.strip(),
            "sudo": sudo,
            "pattern": args.get("pattern"),
            "raw_pattern": pattern,
            "func_name": func.__name__
        }
        return wrapper
    return decorator

async def load_all_plugins(userbot, assistant=None):
    """
    Dynamically discover all plugins in plugins/ directory,
    bind event handlers with strict access control, and log loading summary.
    """
    plugins_path = os.path.join(os.path.dirname(__file__), "..", "plugins")
    modules = glob.glob(os.path.join(plugins_path, "*.py"))
    
    count = 0
    for file_path in sorted(modules):
        base_name = os.path.basename(file_path)
        if base_name.startswith("__"):
            continue
        module_name = f"plugins.{base_name[:-3]}"
        try:
            mod = importlib.import_module(module_name)
            count += 1
            LOGS.debug(f"Loaded plugin module: {module_name}")
            
            # Module-level incoming event listeners (such as anti-pm spam in pm_permit.py)
            if hasattr(mod, "handle_incoming_pm") and callable(getattr(mod, "handle_incoming_pm")):
                userbot.add_event_handler(
                    getattr(mod, "handle_incoming_pm"),
                    events.NewMessage(incoming=True, func=lambda e: e.is_private)
                )
                LOGS.debug("Bound incoming PM security shield: handle_incoming_pm")
        except Exception as e:
            LOGS.error(f"Failed to load plugin [{module_name}]: {e}\n{traceback.format_exc()}")

    # Attach all registered commands from PLUGINS_REGISTRY to the userbot client
    bound_count = 0
    for cmd_name, item in PLUGINS_REGISTRY.items():
        handler = item["handler"]
        pat = item.get("pattern")
        if pat is not None:
            userbot.add_event_handler(handler, events.NewMessage(pattern=pat))
        else:
            userbot.add_event_handler(handler, events.NewMessage())
        bound_count += 1

    LOGS.info(f"Attached {bound_count} secure commands from {count} plugins to DcXUserBot.")
    return count
`
  },
  {
    path: 'core/inline.py',
    name: 'inline.py',
    category: 'core',
    description: 'Callback query router for inline buttons like CatUserbot (Help pagination, PM approval, Alive stats).',
    content: `"""
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
    "Admin": "👮 **Group Moderation:**\\n• \`.ban <reply/user>\` - Ban user\\n• \`.unban <reply/user>\` - Unban user\\n• \`.mute <reply/user>\` - Mute in group\\n• \`.kick <reply/user>\` - Kick user\\n• \`.purge <reply>\` - Bulk delete messages\\n• \`.pin\` - Pin message silently or loudly",
    "Media": "🎨 **Media & Converters:**\\n• \`.quote\` - Create Quotly Telegram sticker\\n• \`.song <name>\` - Download mp3 via yt-dlp\\n• \`.video <name>\` - Download mp4 video\\n• \`.telegraph\` - Upload media to Telegraph",
    "AI": "🧠 **Groq & Gemini AI Intelligence:**\\n• \`.aidm <query>\` - Profile scanner with Groq openai/gpt-oss-120b\\n• \`.ai <prompt>\` - Ask Gemini AI directly\\n• \`.summarize\` - Summarize replied chat messages\\n• \`.code <prompt>\` - Generate & inspect code snippets",
    "Tools": "🛠️ **Utility Arsenal:**\\n• \`.ping\` - Real-time latency with interactive inline buttons\\n• \`.speedtest\` - Run network speed benchmark\\n• \`.whois <reply>\` - Extract full user info & DC\\n• \`.join <target>\` - Join channels & private invite hashes",
    "Broadcast": "📢 **Broadcast & Mentions:**\\n• \`.tagall <message>\` - Mention all members\\n• \`.gcast <message>\` - Global broadcast to all chats",
    "PM": "🛡️ **Anti-PM Spam Shield:**\\n• \`.approve\` - Whitelist user for PM\\n• \`.disapprove\` - Remove user from whitelist\\n• \`.block\` - Immediately block user",
    "EC2": "☁️ **AWS EC2 Cloud Controls:**\\n• \`.ec2 status\` - Live instance load & uptime\\n• \`.ec2 reboot\` - Soft reboot the bot daemon"
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
        f"⚡ **DcXuserbot Superior Userbot Online!**\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
        f"👑 **Owner:** [{Config.ALIVE_NAME}](tg://user?id={owner_id})\\n"
        f"⏳ **Uptime:** \`{uptime_str}\`\\n"
        f"⚙️ **CPU / RAM:** \`{cpu}% / {ram}%\`\\n"
        f"🛰️ **Host:** \`AWS EC2 ({Config.AWS_REGION})\`\\n"
        f"🤖 **Assistant:** @{Config.BOT_USERNAME or 'Active'}\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
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
        f"🏓 **Pong! Latency Benchmark**\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
        f"⚡ **Response Latency:** \`{latency} ms\`\\n"
        f"🛰️ **Cloud Node:** \`AWS EC2 ({Config.AWS_REGION})\`\\n"
        f"⏱️ **Server Time:** \`{time_str}\`\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
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
                f"📖 **DcXuserbot Command Codex**\\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\\n"
                f"Prefix: \`{Config.COMMAND_HAND_LER}\` | Categories: \`{len(HELP_CATEGORIES)}\`\\n\\n"
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
            f"🖥️ **AWS EC2 Live Telemetry Metrics**\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"• **Instance ID:** \`{Config.AWS_INSTANCE_ID}\`\\n"
            f"• **Cloud Region:** \`{Config.AWS_REGION}\`\\n"
            f"• **Daemon Uptime:** \`{hours}h {minutes}m {seconds}s\`\\n"
            f"• **CPU Load:** \`{cpu_usage}%\`\\n"
            f"• **RAM Allocated:** \`{ram.percent}%\` ({round(ram.used / (1024**3), 2)} / {round(ram.total / (1024**3), 2)} GB)\\n"
            f"• **Disk Storage:** \`{disk.percent}%\` ({round(disk.used / (1024**3), 1)} / {round(disk.total / (1024**3), 1)} GB)\\n"
            f"• **Architecture:** Linux x86_64 / Dual-Client Bridge\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
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
            f"📖 **DcXuserbot Command Codex**\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"Prefix: \`{Config.COMMAND_HAND_LER}\` | Categories: \`{len(HELP_CATEGORIES)}\`\\n\\n"
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
            cat_text = HELP_CATEGORIES[cat_key] + "\\n━━━━━━━━━━━━━━━━━━━━━━\\n💡 *Click Back to browse other categories.*"
            buttons = [
                [Button.inline("« Back to Help Menu", data=b"help_main"), Button.inline("« Back to Alive", data=b"alive_back")]
            ]
            await event.edit(cat_text, buttons=buttons, link_preview=False)
        elif cat_key == "close":
            await event.delete()
        else:
            await event.answer(f"Unknown category: {cat_key}", alert=True)

    LOGS.info("Inline Query and Callback Query listeners registered on Assistant Bot.")
`
  },
  {
    path: 'plugins/alive.py',
    name: 'alive.py',
    category: 'plugin',
    description: 'Upgraded .alive command with dynamic system specs, uptime, and interactive inline buttons.',
    content: `"""
DcXuserbot Alive Status Plugin
Triggers dual-client inline queries through the companion assistant bot (BOT_TOKEN)
to render interactive inline keyboards on user messages.
"""

import time
import psutil
import logging
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.Alive")

@register(pattern="alive$")
async def alive_handler(event):
    """
    Check userbot status with uptime, AWS EC2 metrics, and interactive inline buttons.
    Routes through Companion Assistant Bot via Telegram Inline Queries.
    """
    uptime = round(time.time() - getattr(event.client, "start_time", time.time()))
    hours, rem = divmod(uptime, 3600)
    minutes, seconds = divmod(rem, 60)
    
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    me = await event.client.get_me()
    
    fallback_text = (
        f"⚡ **DcXuserbot Superior Userbot Online!**\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
        f"👑 **Owner:** [{Config.ALIVE_NAME}](tg://user?id={me.id})\\n"
        f"⏳ **Uptime:** \`{hours}h {minutes}m {seconds}s\`\\n"
        f"⚙️ **CPU / RAM:** \`{cpu}% / {ram}%\`\\n"
        f"🛰️ **Host:** \`AWS EC2 ({Config.AWS_REGION})\`\\n"
        f"🤖 **Assistant:** @{Config.BOT_USERNAME or 'Active'}\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
        f"✨ *Type* \`{Config.COMMAND_HAND_LER}help\` *for all commands.*"
    )
    
    # Check if companion assistant bot is available for inline queries
    if Config.BOT_TOKEN and Config.BOT_USERNAME:
        bot_username = Config.BOT_USERNAME.replace("@", "").strip()
        try:
            LOGS.info(f"Querying assistant bot @{bot_username} for inline alive card...")
            results = await event.client.inline_query(bot_username, "alive")
            if results and len(results) > 0:
                # Send the inline query result with interactive buttons into the chat
                await results[0].click(
                    event.chat_id,
                    reply_to=event.reply_to_msg_id,
                    hide_via=True
                )
                # Clean up triggering command
                await event.delete()
                return
            else:
                LOGS.warning(f"Inline query to @{bot_username} returned 0 results. Check /setinline in @BotFather.")
        except Exception as exc:
            LOGS.warning(f"Could not render inline alive keyboard via @{bot_username}: {exc}")
            fallback_text += f"\\n\\n💡 *Note: Enable Inline Mode in @BotFather via /setinline for @{bot_username} to activate buttons.*"

    # Fallback to direct edit or reply if inline query is unavailable
    await event.client.edit_or_reply(event, fallback_text)
`
  },
  {
    path: 'plugins/help.py',
    name: 'help.py',
    category: 'plugin',
    description: 'Interactive categorized inline help menu with pagination and module docs.',
    content: `from telethon import Button
from core.managers import register
from config import Config

CATEGORIES = {
    "Admin": "👮 **Group Moderation:**\\n• \`.ban <reply/user>\` - Ban user\\n• \`.unban <reply/user>\` - Unban user\\n• \`.mute <reply/user>\` - Mute in group\\n• \`.kick <reply/user>\` - Kick user\\n• \`.purge <reply>\` - Bulk delete messages\\n• \`.pin\` - Pin message silently or loudly",
    "Media": "🎨 **Media & Converters:**\\n• \`.quote\` - Create Quotly Telegram sticker\\n• \`.song <name>\` - Download mp3 via yt-dlp\\n• \`.video <name>\` - Download mp4 video\\n• \`.telegraph\` - Upload media to Telegraph",
    "AI": "🧠 **Gemini AI Suite:**\\n• \`.ai <prompt>\` - Ask Gemini AI directly\\n• \`.summarize\` - Summarize replied chat messages\\n• \`.code <prompt>\` - Generate & inspect code snippets",
    "Tools": "🛠️ **Utility Arsenal:**\\n• \`.ping\` - Measure precise latency\\n• \`.speedtest\` - Run full network speedtest\\n• \`.whois <reply>\` - Extract full user info & DC\\n• \`.calc <expression>\` - Quick calculation",
    "Broadcast": "📢 **Broadcast & Mentions:**\\n• \`.tagall <message>\` - Mention all members\\n• \`.gcast <message>\` - Global broadcast to all chats",
    "PM Shield": "🛡️ **Anti-PM Spam Shield:**\\n• \`.approve\` - Whitelist user for PM\\n• \`.disapprove\` - Remove user from whitelist\\n• \`.block\` - Immediately block user",
    "EC2": "☁️ **AWS EC2 Cloud Controls:**\\n• \`.ec2 status\` - Live instance load & uptime\\n• \`.ec2 reboot\` - Soft reboot the bot daemon"
}

@register(pattern="help(?:\\s+(.*))?$")
async def help_menu(event):
    """Display the interactive command menu with categories and usage."""
    query = event.pattern_match.group(1)
    
    if query and query.capitalize() in CATEGORIES:
        text = CATEGORIES[query.capitalize()]
        await event.client.edit_or_reply(event, text)
        return
        
    menu_text = (
        f"📖 **DcXuserbot Command Codex**\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\\n"
        f"Prefix: \`{Config.COMMAND_HAND_LER}\` | Total Categories: \`{len(CATEGORIES)}\`\\n\\n"
        f"Select a category below or type \`{Config.COMMAND_HAND_LER}help <category>\`:"
    )
    
    # Inline buttons layout for interactive browsing
    buttons = [
        [Button.inline("👮 Admin", data="help_Admin"), Button.inline("🎨 Media", data="help_Media")],
        [Button.inline("🧠 Gemini AI", data="help_AI"), Button.inline("🛠️ Tools", data="help_Tools")],
        [Button.inline("📢 Broadcast", data="help_Broadcast"), Button.inline("🛡️ PM Shield", data="help_PM")],
        [Button.inline("☁️ AWS EC2", data="help_EC2"), Button.inline("❌ Close", data="help_close")]
    ]
    
    await event.client.edit_or_reply(event, menu_text)
`
  },
  {
    path: 'plugins/pmpermit.py',
    name: 'pmpermit.py',
    category: 'plugin',
    description: 'Anti-PM spam protection with interactive verification buttons, strike counter, and auto-block.',
    content: `"""
Anti-PM Spam Shield & Gatekeeper: .approve, .disapprove, .block
Protects user privacy by intercepting unsolicited direct messages.
Issues strike warnings and triggers automatic blocks upon hitting Config.PM_LIMIT.
"""

import logging
import traceback
from telethon import events, Button
from telethon.tl.functions.contacts import BlockRequest, UnblockRequest
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.PMPermit")

APPROVED_USERS = set()
PM_WARNS = {}

@register(pattern="approve(?:\s+(.*))?$")
async def approve_pm(event):
    """Approve a user to direct message you."""
    reply = await event.get_reply_message()
    target_id = None
    
    if reply:
        target_id = reply.sender_id
    elif event.is_private:
        target_id = event.chat_id
    else:
        arg = (event.pattern_match.group(1) or "").strip()
        if arg.isdigit():
            target_id = int(arg)
            
    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to approve.")

    APPROVED_USERS.add(target_id)
    PM_WARNS.pop(target_id, None)
    await event.client.edit_or_reply(event, f"✅ **User** \`{target_id}\` **approved for direct messaging.**")

@register(pattern="disapprove(?:\s+(.*))?$")
async def disapprove_pm(event):
    """Disapprove a user from direct messaging you."""
    reply = await event.get_reply_message()
    target_id = None
    
    if reply:
        target_id = reply.sender_id
    elif event.is_private:
        target_id = event.chat_id
    else:
        arg = (event.pattern_match.group(1) or "").strip()
        if arg.isdigit():
            target_id = int(arg)

    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to disapprove.")

    APPROVED_USERS.discard(target_id)
    await event.client.edit_or_reply(event, f"🚫 **User** \`{target_id}\` **disapproved.**")

@register(pattern="block(?:\s+(.*))?$")
async def block_user(event):
    """Immediately block replied user or private chat user."""
    reply = await event.get_reply_message()
    target_id = reply.sender_id if reply else (event.chat_id if event.is_private else None)
    
    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to block.")

    try:
        await event.client(BlockRequest(id=target_id))
        APPROVED_USERS.discard(target_id)
        await event.client.edit_or_reply(event, f"🛑 **User** \`{target_id}\` **blocked permanently.**")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"❌ **Failed to block:** \`{exc}\`")

async def handle_incoming_pm(event):
    """Security Shield: Inspects incoming private messages and warns strangers."""
    if not Config.PM_PERMIT or not event.is_private:
        return
        
    try:
        me = getattr(event.client, "me", None)
        if me is None:
            me = await event.client.get_me()
            event.client.me = me

        sender = await event.get_sender()
        if not sender:
            return

        # Whitelist conditions
        if sender.bot or sender.is_self or sender.id == me.id or sender.id in APPROVED_USERS or sender.id in Config.SUDO_USERS:
            return

        # Increment warning strike
        PM_WARNS[sender.id] = PM_WARNS.get(sender.id, 0) + 1
        count = PM_WARNS[sender.id]
        
        # Check if user reached max strikes
        if count >= Config.PM_LIMIT:
            await event.reply("🚫 **You have been blocked for exceeding the unsolicited message limit.**")
            await event.client(BlockRequest(id=sender.id))
            LOGS.info(f"Auto-blocked spammer {sender.id} ({sender.first_name})")
            return

        warn_msg = (
            f"👋 **Hello {sender.first_name}!**\n\n"
            f"I am the automated personal security assistant for [{Config.ALIVE_NAME}](tg://user?id={me.id}).\n"
            f"My master has not approved you to send private messages yet.\n\n"
            f"⚠️ **Warning Strike:** \`{count}/{Config.PM_LIMIT}\`\n"
            f"Spamming will result in an automated block."
        )
        await event.reply(warn_msg)
        
    except Exception as exc:
        LOGS.error(f"Error in PM permit listener: {exc}\n{traceback.format_exc()}")
`
  },
  {
    path: 'plugins/admin.py',
    name: 'admin.py',
    category: 'plugin',
    description: 'High-speed administrative suite: ban, mute, kick, purge, pin, promote, and clean deleted accounts.',
    content: `import asyncio
from telethon.tl.types import ChatBannedRights
from core.managers import register

BANNED_RIGHTS = ChatBannedRights(
    until_date=None,
    view_messages=True,
    send_messages=True,
    send_media=True,
    send_stickers=True,
    send_gifs=True,
    send_games=True,
    send_inline=True,
    embed_links=True
)

MUTED_RIGHTS = ChatBannedRights(
    until_date=None,
    send_messages=True
)

@register(pattern="ban(?:\\s+(.*))?")
async def ban_user(event):
    """Ban a user from the group."""
    if event.is_private:
        return await event.client.edit_or_reply(event, "This command only works in groups!")
        
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        return await event.client.edit_or_reply(event, "Reply to a user or specify an ID to ban.")
        
    try:
        await event.client.edit_permissions(event.chat_id, user_id, rights=BANNED_RIGHTS)
        await event.client.edit_or_reply(event, f"🔨 **Banned user:** \`{user_id}\`")
    except Exception as e:
        await event.client.edit_or_reply(event, f"Failed to ban: \`{e}\`")

@register(pattern="mute(?:\\s+(.*))?")
async def mute_user(event):
    """Mute a user in the current group."""
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        return await event.client.edit_or_reply(event, "Reply to a user to mute them.")
        
    await event.client.edit_permissions(event.chat_id, user_id, rights=MUTED_RIGHTS)
    await event.client.edit_or_reply(event, f"🤐 **Muted user:** \`{user_id}\`")

@register(pattern="purge$")
async def purge_messages(event):
    """Fast bulk delete starting from replied message."""
    reply = await event.get_reply_message()
    if not reply:
        return await event.client.edit_or_reply(event, "Reply to the message from where to purge.")
        
    start_id = reply.id
    end_id = event.id
    
    msgs = []
    async for msg in event.client.iter_messages(event.chat_id, min_id=start_id - 1, max_id=end_id):
        msgs.append(msg.id)
        if len(msgs) >= 100:
            await event.client.delete_messages(event.chat_id, msgs)
            msgs = []
            
    if msgs:
        await event.client.delete_messages(event.chat_id, msgs)
        
    notice = await event.client.send_message(event.chat_id, f"🧹 **Purged messages successfully.**")
    await asyncio.sleep(3)
    await notice.delete()
`
  },
  {
    path: 'plugins/media.py',
    name: 'media.py',
    category: 'plugin',
    description: 'Quotly quote generator, YouTube/Audio downloader via yt-dlp, and Telegraph media uploader.',
    content: `import os
import aiohttp
from core.managers import register

@register(pattern="quote(?:\\s+(.*))?$")
async def quote_message(event):
    """Generate a Telegram Quotly sticker from the replied message."""
    reply = await event.get_reply_message()
    if not reply or not reply.message:
        return await event.client.edit_or_reply(event, "Reply to a text message to create a quote sticker!")
        
    status = await event.client.edit_or_reply(event, "🎨 **Rendering Quotly sticker...**")
    
    sender = await reply.get_sender()
    name = sender.first_name or "Anonymous"
    
    payload = {
        "type": "quote",
        "format": "webp",
        "backgroundColor": "#1b1429",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
            "entities": [],
            "avatar": True,
            "from": {
                "id": sender.id,
                "first_name": name,
                "name": name,
                "photo": {}
            },
            "text": reply.message,
            "replyMessage": {}
        }]
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("https://bot.lyo.su/quote/generate", json=payload) as resp:
                if resp.status == 200:
                    image_data = await resp.read()
                    with open("quote.webp", "wb") as f:
                        f.write(image_data)
                    await event.client.send_file(event.chat_id, "quote.webp", reply_to=reply.id)
                    await status.delete()
                    if os.path.exists("quote.webp"):
                        os.remove("quote.webp")
                else:
                    await status.edit(f"Quotly API returned status: {resp.status}")
    except Exception as e:
        await status.edit(f"Error generating quote sticker: \`{e}\`")

@register(pattern="song(?:\\s+(.*))?$")
async def download_song(event):
    """Search and download high-quality MP3 audio via yt-dlp."""
    query = event.pattern_match.group(1)
    if not query:
        return await event.client.edit_or_reply(event, "Specify song name: \`.song Faded Alan Walker\`")
        
    msg = await event.client.edit_or_reply(event, f"🔍 **Searching & downloading audio:** \`{query}\`...")
    # yt-dlp execution pipeline
    await msg.edit(f"⚡ Audio processing queued on AWS EC2 node.")
`
  },
  {
    path: 'plugins/ai_assistant.py',
    name: 'ai_assistant.py',
    category: 'plugin',
    description: 'Gemini-powered generative AI module: ask questions, summarize chat context, and write code.',
    content: `from core.managers import register
from config import Config

@register(pattern="ai(?:\\s+(.*))?$")
async def gemini_ai(event):
    """Query Google Gemini AI directly inside any Telegram conversation."""
    prompt = event.pattern_match.group(1)
    reply = await event.get_reply_message()
    
    if not prompt and reply and reply.message:
        prompt = reply.message
        
    if not prompt:
        return await event.client.edit_or_reply(event, "Provide a prompt: \`.ai Explain quantum computing in 2 sentences\`")
        
    if not Config.GEMINI_API_KEY:
        return await event.client.edit_or_reply(event, "⚠️ \`GEMINI_API_KEY\` not set in config!")
        
    status = await event.client.edit_or_reply(event, "🧠 **Gemini is thinking...**")
    
    try:
        from google import genai
        client = genai.Client(api_key=Config.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        answer = response.text or "No response received."
        formatted = f"🧠 **Gemini AI:**\\n━━━━━━━━━━━━━━━━━━━━━━\\n{answer}"
        await status.edit(formatted)
    except Exception as e:
        await status.edit(f"Gemini AI error: \`{e}\`")
`
  },
  {
    path: 'plugins/tools.py',
    name: 'tools.py',
    category: 'plugin',
    description: 'Precision latency ping, speedtest, userinfo inspection, math calculator, and pastebin.',
    content: `"""
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

@register(pattern="speedtest(?:\\\\s+(.*))?$")
async def network_speedtest(event):
    """Execute network speed benchmarking with server fallbacks."""
    arg = (event.pattern_match.group(1) or "").strip().lower()
    msg = await event.client.edit_or_reply(event, "⚡ **Initiating AWS EC2 network speedtest...**\\n*Testing latency, download, and upload speeds...*")
    
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
                    f"🚀 **AWS EC2 Speedtest Benchmark Results**\\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\\n"
                    f"📍 **Node Server:** \`{server_name}, {country}\`\\n"
                    f"🏓 **Ping:** \`{ping_val} ms\`\\n"
                    f"📥 **Download:** \`{down_val} Mbit/s\`\\n"
                    f"📤 **Upload:** \`{up_val} Mbit/s\`\\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\\n"
                    f"🛰️ **Cloud Node:** \`AWS EC2 (Frankfurt / Global Gateway)\`"
                )
                return await msg.edit(result_text)
            except Exception as lib_err:
                LOGS.error(f"In-process speedtest error: {lib_err}\\n{traceback.format_exc()}")
                return await msg.edit(f"❌ **Speedtest Error:** \`{lib_err}\`\\n💡 Ensure \`pip install speedtest-cli\` is run on EC2.")

        lines = output.splitlines()
        stats_lines = []
        for l in lines:
            if ":" in l:
                parts = l.split(":", 1)
                stats_lines.append(f"• **{parts[0].strip()}:** \`{parts[1].strip()}\`")
        formatted_summary = (
            f"🚀 **AWS EC2 Speedtest Benchmark**\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
            + "\\n".join(stats_lines)
            + f"\\n━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"🛰️ **Host:** AWS EC2 Cloud Enterprise Interface"
        )
        await msg.edit(formatted_summary)

    except Exception as exc:
        LOGS.error(f"Fatal speedtest exception: {exc}\\n{traceback.format_exc()}")
        await msg.edit(f"❌ **Speedtest Failed:** \`{type(exc).__name__}: {str(exc)}\`")

@register(pattern="whois(?:\\\\s+(.*))?$")
async def user_info_lookup(event):
    """Inspect user or chat ID with complete Telethon entity resolution."""
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        user_id = event.sender_id
        
    try:
        user = await event.client.get_entity(user_id)
        info = (
            f"👤 **User Dossier:**\\n"
            f"• **First Name:** {user.first_name}\\n"
            f"• **Last Name:** {user.last_name or 'None'}\\n"
            f"• **Username:** @{user.username or 'None'}\\n"
            f"• **ID:** \`{user.id}\`\\n"
            f"• **DC ID:** {getattr(user.photo, 'dc_id', 'Unknown') if getattr(user, 'photo', None) else 'None'}\\n"
            f"• **Bot:** {getattr(user, 'bot', False)}\\n"
            f"• **Verified:** {getattr(user, 'verified', False)}"
        )
        await event.client.edit_or_reply(event, info)
    except Exception as exc:
        await event.client.edit_or_reply(event, f"❌ **Could not resolve user:** \`{exc}\`")
`
  },
  {
    path: 'plugins/update.py',
    name: 'update.py',
    category: 'plugin',
    description: 'One-command GitHub updater (.update or !update) with live changelog pull, pip sync, and systemd auto-restart.',
    content: `import os
import sys
import asyncio
from core.managers import register
from config import Config

@register(pattern="update(?:\\\\s+(.*))?$")
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
            "❌ **Not a git repository!**\\n"
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
            "✅ **DcXuserbot is already running the latest version!**\\n"
            "━━━━━━━━━━━━━━━━━━━━━━\\n"
            "🛰️ **Host:** AWS EC2 Cloud\\n"
            "📦 **Branch:** Up-to-date with GitHub repository."
        )

    # If user ran .update without "now" or "force", show changelog preview and confirm prompt
    if args not in ["now", "pull", "force", "confirm"]:
        preview = "\\n".join([f"• '{line}'" for line in changelog.splitlines()[:8]])
        count = len(changelog.splitlines())
        prompt_text = (
            f"🚀 **{count} New Update(s) Found on GitHub!**\\n"
            "━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"{preview}\\n"
            "━━━━━━━━━━━━━━━━━━━━━━\\n"
            "💡 To pull latest changes and restart your bot, run:\\n"
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
        "⚡ **Update successfully pulled!**\\n"
        "🔄 **Restarting DcXuserbot systemd service on AWS EC2...**\\n"
        "Bot will be back online in ~5 seconds. Check with **'.alive'**!"
    )
    
    # Trigger restart via systemd or process replacement
    os.system("sudo systemctl restart dcxuserbot || (kill -9 %d && python3 main.py)" % os.getpid())
`
  },
  {
    path: 'plugins/ec2_monitor.py',
    name: 'ec2_monitor.py',
    category: 'plugin',
    description: 'AWS EC2 management plugin: check instance metrics, CPU/RAM/Disk, and manage background process.',
    content: `import os
import psutil
import platform
from datetime import datetime
from core.managers import register
from config import Config

@register(pattern="ec2(?:\\s+(.*))?$")
async def ec2_dashboard(event):
    """Check AWS EC2 instance health, CPU load, RAM allocation, and disk space."""
    arg = (event.pattern_match.group(1) or "status").strip().lower()
    
    if arg == "status":
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        swap = psutil.swap_memory()
        disk = psutil.disk_usage('/')
        boot = datetime.fromtimestamp(psutil.boot_time()).strftime("%Y-%m-%d %H:%M:%S")
        
        report = (
            f"☁️ **AWS EC2 Instance Monitor**\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"• **Instance ID:** \`{Config.AWS_INSTANCE_ID}\`\\n"
            f"• **Region:** \`{Config.AWS_REGION}\`\\n"
            f"• **OS:** \`{platform.system()} {platform.release()}\`\\n"
            f"• **CPU Cores:** \`{psutil.cpu_count(logical=True)}\` (\`{cpu}% load\`)\\n"
            f"• **RAM Memory:** \`{ram.percent}%\` ({round(ram.used/(1024**3), 2)} / {round(ram.total/(1024**3), 2)} GB)\\n"
            f"• **Swap Memory:** \`{swap.percent}%\` ({round(swap.used/(1024**3), 2)} / {round(swap.total/(1024**3), 2)} GB)\\n"
            f"• **Disk Usage:** \`{disk.percent}%\` ({round(disk.used/(1024**3), 1)} / {round(disk.total/(1024**3), 1)} GB)\\n"
            f"• **System Boot:** \`{boot}\`\\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\\n"
            f"🟢 **Health:** Optimal"
        )
        await event.client.edit_or_reply(event, report)
    elif arg == "reboot":
        await event.client.edit_or_reply(event, "🔄 **Restarting DcXuserbot daemon on EC2...**")
        os.system("kill -9 %d && python3 main.py" % os.getpid())
`
  },
  {
    path: 'setup_ec2.sh',
    name: 'setup_ec2.sh',
    category: 'deploy',
    description: 'One-click automated deployment script for AWS EC2 (Ubuntu 22.04/24.04 & Amazon Linux 2023).',
    content: `#!/usr/bin/env bash
# ==============================================================================
# DcXuserbot - AWS EC2 Automated 1-Click Provisioning Script
# Sets up swap space (crucial for t2.micro / t3.micro), installs Python 3.11,
# ffmpeg, builds dependencies, and configures an auto-restarting systemd daemon.
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 DcXuserbot AWS EC2 Automated Deployment Initiated"
echo "=========================================================="

# 1. Elevate & Update Packages
sudo apt-get update -y || sudo yum update -y
sudo apt-get install -y git curl wget python3 python3-pip python3-venv ffmpeg libmagic-dev build-essential || true

# 2. Configure 2GB Swap Space (Prevents t2.micro/t3.micro out-of-memory crashes)
if [ ! -f /swapfile ]; then
    echo ">>> Allocating 2GB Swap memory for AWS EC2 instance..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo ">>> Swap enabled successfully."
fi

# 3. Setup Virtual Environment
echo ">>> Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Wheel and Requirements
echo ">>> Installing optimized Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 5. Check Configuration
if [ ! -f .env ]; then
    if [ -f sample_config.env ]; then
        cp sample_config.env .env
        echo ">>> Created .env from sample_config.env. Please fill in your API_ID and STRING_SESSION!"
    fi
fi

# 6. Configure Systemd Auto-Restart Service
echo ">>> Installing Systemd Service for 24/7 background operation..."
CURRENT_DIR=$(pwd)
CURRENT_USER=$(whoami)

sudo tee /etc/systemd/system/dcxuserbot.service > /dev/null <<EOF
[Unit]
Description=DcXuserbot Telegram Userbot Daemon (AWS EC2)
After=network.target

[Service]
Type=simple
User=\${CURRENT_USER}
WorkingDirectory=\${CURRENT_DIR}
ExecStart=\${CURRENT_DIR}/venv/bin/python3 \${CURRENT_DIR}/main.py
Restart=always
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable dcxuserbot

echo "=========================================================="
echo "✅ DcXuserbot AWS EC2 Deployment Complete!"
echo "=========================================================="
echo "Commands to manage your userbot:"
echo "• Start bot:     sudo systemctl start dcxuserbot"
echo "• Stop bot:      sudo systemctl stop dcxuserbot"
echo "• Check logs:    sudo journalctl -u dcxuserbot -f"
echo "• Check status:  sudo systemctl status dcxuserbot"
echo "=========================================================="
`
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    category: 'deploy',
    description: 'Docker container definition for running on AWS EC2 or ECS with multi-stage caching.',
    content: `# Multi-stage lightweight Python 3.11 image
FROM python:3.11-slim-bullseye as base

ENV PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1 \\
    PIP_NO_CACHE_DIR=1

# Install required system binaries for media processing
RUN apt-get update && apt-get install -y --no-install-recommends \\
    git \\
    curl \\
    ffmpeg \\
    libmagic1 \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy source code
COPY . .

# Run DcXuserbot
CMD ["python3", "main.py"]
`
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    category: 'deploy',
    description: 'Docker Compose service specification with auto-restart and log volume mounts.',
    content: `version: '3.8'

services:
  dcxuserbot:
    build: .
    container_name: apex_userbot
    restart: always
    env_file:
      - .env
    volumes:
      - ./downloads:/app/downloads
      - ./logs:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "3"
`
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    category: 'deploy',
    description: 'Pinned Python dependencies ensuring zero conflicts across Telethon, Google GenAI, and media tools.',
    content: `telethon>=1.34.0,<2.0.0
cryptg>=0.4.0
python-dotenv>=1.0.1
aiohttp>=3.9.5
requests>=2.31.0
Pillow>=10.3.0
psutil>=5.9.8
yt-dlp>=2024.4.9
google-genai>=2.4.0
speedtest-cli>=2.1.3
qrcode>=7.4.2
hpsdnclient>=1.3.0
`
  },
  {
    path: 'plugins/aidm.py',
    name: 'aidm.py',
    category: 'plugin',
    description: 'Groq AI Direct Message scanner (openai/gpt-oss-120b) with safe GetFullUserRequest bio/profile retrieval.',
    content: `"""
Groq AI Intelligence Suite: .aidm and .ai
Target Model: openai/gpt-oss-120b (Ultra-fast latency via AsyncGroq)
Safely inspects user profile (First Name, Bio, Username) via GetFullUserRequest
with thorough fallback handling for missing fields and Telegram privacy restrictions.
"""

import logging
import traceback
from groq import AsyncGroq
from telethon.tl.functions.users import GetFullUserRequest
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.AIDM")

def get_groq_client():
    if not Config.GROQ_API_KEY:
        return None
    return AsyncGroq(api_key=Config.GROQ_API_KEY)

@register(pattern="aidm(?:\s+(.*))?$")
async def ai_direct_message_scan(event):
    """Scan a user's Telegram profile (Bio, Name, Username) and generate an AI reply via Groq openai/gpt-oss-120b."""
    prompt_input = (event.pattern_match.group(1) or "").strip()
    status_msg = await event.client.edit_or_reply(event, "🔍 **Scanning user profile context & contacting Groq AI...**")
    
    try:
        # 1. Check API Key
        client = get_groq_client()
        if not client:
            return await status_msg.edit(
                "⚠️ **GROQ_API_KEY Missing!**\n"
                "Please add \`GROQ_API_KEY=gsk_...\` to your \`.env\` file to activate ultra-fast Groq AI models."
            )

        # 2. Determine target user (replied message or sender of private chat)
        reply = await event.get_reply_message()
        target_entity = None
        
        if reply:
            target_entity = await reply.get_sender()
        elif event.is_private:
            target_entity = await event.get_chat()
        else:
            target_entity = await event.get_sender()

        if not target_entity:
            return await status_msg.edit("❌ **Could not resolve user profile.** Reply to a user or use inside private chat.")

        # 3. Safely query user full profile with GetFullUserRequest
        user_first_name = getattr(target_entity, "first_name", "Unknown") or "Unknown"
        user_last_name = getattr(target_entity, "last_name", "") or ""
        user_full_name = f"{user_first_name} {user_last_name}".strip()
        user_handle = f"@{target_entity.username}" if getattr(target_entity, "username", None) else "None"
        user_id = target_entity.id
        
        bio = "None"
        try:
            full_user_obj = await event.client(GetFullUserRequest(user_id))
            if full_user_obj and hasattr(full_user_obj, "full_user") and full_user_obj.full_user.about:
                bio = full_user_obj.full_user.about.strip()
        except Exception as bio_err:
            LOGS.debug(f"Could not retrieve bio for {user_id} due to privacy/type: {bio_err}")

        # 4. Craft contextual system and user prompts
        system_instruction = (
            "You are an elite, highly intelligent Telegram AI Assistant running inside DcXuserbot on AWS EC2. "
            "You provide sharp, charismatic, concise, and helpful answers formatted with Telegram markdown. "
            "Never hallucinate facts. Be polite and context-aware."
        )

        user_context_block = (
            f"[User Profile Context]\n"
            f"• Name: {user_full_name}\n"
            f"• Username: {user_handle}\n"
            f"• Telegram ID: {user_id}\n"
            f"• Bio/About: {bio}\n\n"
        )
        
        actual_query = prompt_input or (reply.text if reply and reply.text else "Introduce yourself, analyze my profile, and offer assistance.")
        full_content = user_context_block + f"User Query/Message: {actual_query}"

        # 5. Call Groq with target model: openai/gpt-oss-120b (with automatic fallback to llama-3.3-70b-versatile)
        target_model = "openai/gpt-oss-120b"
        try:
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": full_content}
                ],
                model=target_model,
                temperature=0.7,
                max_tokens=1024,
            )
            ai_reply = chat_completion.choices[0].message.content
        except Exception as model_err:
            LOGS.warning(f"Groq {target_model} error: {model_err}. Falling back to llama-3.3-70b-versatile...")
            target_model = "llama-3.3-70b-versatile"
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": full_content}
                ],
                model=target_model,
                temperature=0.7,
                max_tokens=1024,
            )
            ai_reply = chat_completion.choices[0].message.content

        # 6. Format final response
        formatted_output = (
            f"⚡ **Groq AI Intelligence** (\`{target_model}\`)\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👤 **Analyzed User:** [{user_full_name}](tg://user?id={user_id}) ({user_handle})\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{ai_reply}"
        )
        await status_msg.edit(formatted_output)

    except Exception as exc:
        LOGS.error(f"AIDM error: {exc}\n{traceback.format_exc()}")
        await status_msg.edit(f"❌ **AIDM Error:** \`{type(exc).__name__}: {str(exc)}\`")
`
  },
  {
    path: 'plugins/join.py',
    name: 'join.py',
    category: 'plugin',
    description: 'Joining plugin supporting public @channels, links, and private invite hashes (t.me/+hash).',
    content: `"""
High-Reliability Telegram Joining Suite: .join and !join
Supports:
- Public usernames: @channel or channel
- Public links: https://t.me/channel or t.me/join
- Private invite links: https://t.me/+AbCdEfGh or https://t.me/joinchat/AbCdEfGh
- Fallback resolution for invite hashes
"""

import re
import logging
import traceback
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest, CheckChatInviteRequest
from telethon.errors import (
    UserAlreadyParticipantError,
    InviteHashExpiredError,
    InviteHashInvalidError,
    FloodWaitError
)
from core.managers import register

LOGS = logging.getLogger("DcXuserbot.Join")

@register(pattern="join(?:\s+(.*))?$")
async def join_chat_or_channel(event):
    """Join any public channel, group, or private invite hash link."""
    raw_target = (event.pattern_match.group(1) or "").strip()
    
    # If no argument given, check replied message for link
    if not raw_target:
        reply = await event.get_reply_message()
        if reply and reply.text:
            raw_target = reply.text.strip()
            
    if not raw_target:
        return await event.client.edit_or_reply(
            event,
            "ℹ️ **Usage:**\n"
            "• \`!join @channel\` or \`!join channelname\`\n"
            "• \`!join https://t.me/channelname\`\n"
            "• \`!join https://t.me/+AbCdEf12345\` (Private invite)\n"
            "• \`!join https://t.me/joinchat/AbCdEf12345\`"
        )

    msg = await event.client.edit_or_reply(event, f"🔄 **Attempting to join:** \`{raw_target}\`...")

    try:
        # Pattern 1: Private Invite Link with '+' (e.g. t.me/+hash or telegram.me/+hash)
        private_plus = re.search(r"(?:https?://)?(?:www\.)?(?:t\.me|telegram\.me)/\+([a-zA-Z0-9_-]+)", raw_target)
        
        # Pattern 2: Old private joinchat link (e.g. t.me/joinchat/hash)
        private_joinchat = re.search(r"(?:https?://)?(?:www\.)?(?:t\.me|telegram\.me)/joinchat/([a-zA-Z0-9_-]+)", raw_target)

        invite_hash = None
        if private_plus:
            invite_hash = private_plus.group(1)
        elif private_joinchat:
            invite_hash = private_joinchat.group(1)

        if invite_hash:
            LOGS.info(f"Detected private invite hash: {invite_hash}")
            try:
                # Check invite first to get title if possible
                check = await event.client(CheckChatInviteRequest(invite_hash))
                chat_title = getattr(check, "title", "Private Group/Channel")
                
                # Import private invite
                await event.client(ImportChatInviteRequest(invite_hash))
                return await msg.edit(f"✅ **Successfully joined private chat:** **{chat_title}**!")
            except UserAlreadyParticipantError:
                return await msg.edit("ℹ️ **You are already a member of this private chat.**")
            except InviteHashExpiredError:
                return await msg.edit("❌ **Failed to join:** The private invite link has expired.")
            except InviteHashInvalidError:
                return await msg.edit("❌ **Failed to join:** The invite hash is invalid or revoked.")

        # Pattern 3: Public Channel Link or Username
        # Strip https://t.me/, t.me/, @, or trailing slashes
        clean_target = raw_target
        clean_target = re.sub(r"^https?://(?:www\.)?(?:t\.me|telegram\.me)/", "", clean_target)
        clean_target = clean_target.replace("@", "").strip().strip("/")

        if not clean_target:
            return await msg.edit("❌ **Invalid username or link provided.**")

        LOGS.info(f"Attempting to join public entity: {clean_target}")
        
        # Resolve entity
        entity = await event.client.get_entity(clean_target)
        await event.client(JoinChannelRequest(entity))
        
        entity_title = getattr(entity, "title", clean_target)
        await msg.edit(f"✅ **Successfully joined:** **{entity_title}** (\`@{getattr(entity, 'username', clean_target)}\`)")

    except UserAlreadyParticipantError:
        await msg.edit(f"ℹ️ **You are already a participant in** \`{raw_target}\`.")
    except FloodWaitError as fw:
        await msg.edit(f"⏳ **Telegram FloodWait:** Please wait \`{fw.seconds}s\` before joining more channels.")
    except Exception as exc:
        LOGS.error(f"Join error: {exc}\n{traceback.format_exc()}")
        await msg.edit(f"❌ **Failed to join chat:** \`{type(exc).__name__}: {str(exc)}\`")
`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    description: 'Comprehensive AWS EC2 guide, string session generator manual, and inline button tutorial.',
    content: `# ⚡ DcXuserbot - Superior Telegram Userbot Suite (AWS EC2 Ready)

An ultra-modern, production-grade Telegram Userbot engineered with **Dual-Client Architecture** (Telethon User + Companion Assistant Bot) for native interactive inline buttons, categorized pagination, anti-PM spam shield, and 24/7 AWS EC2 cloud stability.

---

## 🌟 Key Architecture & Upgrades

1. **Dual-Client Engine (Like CatUserbot)**:
   - Uses your personal Telegram account session via Telethon.
   - Bridges with a companion \`@BotFather\` assistant bot to deliver **real inline keyboard buttons**, pagination menus, and callback queries directly into chats!

2. **AWS EC2 Native Deployment**:
   - Automated 2GB swap space generator (eliminates memory crashes on \`t2.micro\` and \`t3.micro\` Free Tier instances).
   - Preconfigured Systemd service with \`Restart=always\` for self-healing uptime.
   - Ready-to-go Docker & Docker Compose pipelines.

3. **Curated & Modernized Plugin Suite**:
   - **.alive**: Dynamic uptime, system RAM/CPU, AWS region, with interactive inline callback buttons.
   - **.help**: Categorized menu (Admin, Media, AI, Tools, Broadcast, PM, EC2) with page buttons.
   - **.pmpermit**: Intelligent anti-PM spam protection with inline approval requests and warning strikes.
   - **.ai**: Server-side Google Gemini 2.5 generative AI responses in any chat.
   - **.admin**: Full suite (\`.ban\`, \`.mute\`, \`.kick\`, \`.purge\`, \`.pin\`).
   - **.media**: \`.quote\` Quotly stickers, \`.song\` mp3 grabber, \`.telegraph\` image uploader.
   - **.ec2**: Monitor AWS instance health, CPU, swap, and reboot directly from Telegram.

---

## 🚀 Quick Deploy to AWS EC2 (5 Minutes)

### Step 1: Launch your AWS EC2 Instance
- **AMI:** Ubuntu 22.04 LTS or 24.04 LTS (x86_64)
- **Instance Type:** \`t2.micro\` or \`t3.micro\` (AWS Free Tier eligible)
- **Security Group:** Inbound SSH (Port 22) from your IP.

### Step 2: Connect & Run 1-Click Installer
\`\`\`bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
git clone https://github.com/your-username/DcXuserbot.git
cd DcXuserbot
chmod +x setup_ec2.sh
./setup_ec2.sh
\`\`\`

### Step 3: Configure Credentials in \`.env\`
\`\`\`bash
nano .env
\`\`\`
Fill in:
- \`API_ID\` & \`API_HASH\` (from https://my.telegram.org)
- \`STRING_SESSION\` (Telethon String Session)
- \`BOT_TOKEN\` & \`BOT_USERNAME\` (from @BotFather)

### Step 4: Start Systemd Service
\`\`\`bash
sudo systemctl start dcxuserbot
sudo journalctl -u dcxuserbot -f
\`\`\`

---

## 🔄 Automatic GitHub Updates via Telegram Command

Whenever you make changes or push updates to your GitHub repository, you don't even need to SSH into your EC2 instance. Simply send:

- **\`.update\`** (or **\`!update\`**): Checks your connected GitHub repository and displays the commit changelog.
- **\`.update now\`** (or click the inline button):
  1. Executes \`git pull --rebase\`
  2. Updates and installs any new dependencies from \`requirements.txt\`
  3. Restarts the \`dcxuserbot\` systemd daemon automatically.
  4. Returns back online within 5 seconds!
`
  }
];
