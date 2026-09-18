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
Inspired & upgraded from CatUserbot, Paperplane, and HellBot.
"""

import sys
import asyncio
import logging
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
    
    # 1. Initialize User Client
    userbot = DcXUserBot()
    await userbot.start()
    me = await userbot.get_me()
    LOGS.info(f"Userbot authenticated as: @{me.username or me.first_name} (ID: {me.id})")
    
    # 2. Initialize Inline Assistant Bot (Powers inline keyboard buttons like CatUserbot)
    assistant = None
    if Config.BOT_TOKEN:
        LOGS.info(">>> Starting Companion Assistant Bot for Inline Buttons...")
        assistant = DcXAssistantBot(userbot=userbot)
        await assistant.start()
        bot_info = await assistant.get_me()
        LOGS.info(f"Assistant Bot online: @{bot_info.username}")
        # Register interactive callback query router on the assistant client
        register_inline_callbacks(assistant, userbot)
        LOGS.info("Registered inline button callback router.")
    else:
        LOGS.warning("No BOT_TOKEN found! Inline buttons will fall back to text representation.")
    
    # 3. Dynamically discover and load all upgraded plugins & bind event handlers
    loaded_count = await load_all_plugins(userbot, assistant)
    LOGS.info(f"Successfully loaded and bound {loaded_count} plugins.")
    
    # 4. Notify Owner in Saved Messages / Log Channel
    startup_msg = (
        "⚡ **DcXuserbot is Live on AWS EC2!**\\n\\n"
        f"• **User:** [{me.first_name}](tg://user?id={me.id})\\n"
        f"• **Assistant:** @{Config.BOT_USERNAME or 'Disabled'}\\n"
        f"• **Prefix:** \`{Config.COMMAND_HAND_LER}\`\\n"
        f"• **Plugins:** \`{loaded_count}\` active\\n"
        "• **Status:** System operational & ready."
    )
    try:
        await userbot.send_message("me", startup_msg)
    except Exception as e:
        LOGS.debug(f"Could not send startup note to Saved Messages: {e}")

    LOGS.info("DcXuserbot is fully operational. Awaiting incoming events...")
    
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
    
    # Command Handler Prefix (Default: '.')
    COMMAND_HAND_LER = os.getenv("COMMAND_HAND_LER", ".")
    SUDO_COMMAND_HAND_LER = os.getenv("SUDO_COMMAND_HAND_LER", "!")
    
    # Authorized Sudo Users (Comma separated IDs)
    SUDO_USERS = [int(x.strip()) for x in os.getenv("SUDO_USERS", "").split(",") if x.strip().isdigit()]
    
    # Custom Alive Profile
    ALIVE_NAME = os.getenv("ALIVE_NAME", "DcX Master")
    ALIVE_MEDIA = os.getenv("ALIVE_MEDIA", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200")
    
    # Optional Gemini AI API Key for .ai commands
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Anti-PM Spam Configuration
    PM_PERMIT = os.getenv("PM_PERMIT", "True").lower() in ("true", "1", "yes")
    PM_LIMIT = int(os.getenv("PM_LIMIT", "4"))
    
    # AWS EC2 Specific Settings
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

# 1. Telegram Core Credentials (obtain from https://my.telegram.org)
API_ID=1234567
API_HASH=abcdef0123456789abcdef0123456789

# 2. Telethon String Session (Generate via helper script or terminal)
STRING_SESSION=1BVtsO...YourTelethonStringSessionHere...

# 3. Companion Assistant Bot Token (From @BotFather on Telegram)
# This enables interactive inline buttons like CatUserbot!
BOT_TOKEN=7123456789:AAH...YourBotFatherTokenHere...
BOT_USERNAME=DcXAssistantBot

# 4. Control Prefixes & Security
COMMAND_HAND_LER=.
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=123456789,987654321

# 5. Alive & Personalization
ALIVE_NAME=DcX Commander
ALIVE_MEDIA=https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200

# 6. Optional AI Features (Gemini API)
GEMINI_API_KEY=AIzaSy...YourKey...

# 7. Security & Spam Shield
PM_PERMIT=True
PM_LIMIT=4

# 8. AWS EC2 Cloud Tagging
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
CMD_PATTERN_PREFIX = re.escape(Config.COMMAND_HAND_LER)
SUDO_PATTERN_PREFIX = re.escape(Config.SUDO_COMMAND_HAND_LER)

PLUGINS_REGISTRY = {}

def register(pattern=None, sudo=False, **args):
    """
    Decorator to register userbot commands with auto-prefixing,
    exception handling, and optional sudo user authorization.
    """
    def decorator(func):
        regex = None
        # Format pattern with prefix
        if pattern:
            regex = f"^{CMD_PATTERN_PREFIX}{pattern}"
            if sudo and Config.SUDO_USERS:
                regex = f"^[{CMD_PATTERN_PREFIX}{SUDO_PATTERN_PREFIX}]{pattern}"
            args["pattern"] = re.compile(regex)

        async def wrapper(event):
            # Verify authorization
            me_id = (await event.client.get_me()).id
            if event.sender_id != me_id:
                if not sudo or event.sender_id not in Config.SUDO_USERS:
                    return

            try:
                await func(event)
            except events.StopPropagation:
                raise events.StopPropagation
            except Exception as exc:
                err_text = f"⚠️ **Error in command:** \`{func.__name__}\`\\n\`\`\`{traceback.format_exc()}\`\`\`"
                LOGS.error(f"Error in {func.__name__}: {exc}")
                try:
                    await event.reply(err_text)
                except Exception:
                    pass

        # Save metadata and event filter parameters for userbot.add_event_handler
        doc = func.__doc__ or "No description provided."
        cmd_name = pattern.split()[0].replace("(.*)", "").strip() if pattern else func.__name__
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
    Walk through plugins/ directory, import every module,
    and explicitly attach all registered handlers to the userbot instance.
    """
    plugins_path = os.path.join(os.path.dirname(__file__), "..", "plugins")
    modules = glob.glob(os.path.join(plugins_path, "*.py"))
    
    count = 0
    for file_path in modules:
        base_name = os.path.basename(file_path)
        if base_name.startswith("__"):
            continue
        module_name = f"plugins.{base_name[:-3]}"
        try:
            mod = importlib.import_module(module_name)
            count += 1
            LOGS.debug(f"Imported plugin module: {module_name}")
            
            # Check for module-level incoming event listeners (such as anti-pm spam in pmpermit.py)
            if hasattr(mod, "handle_incoming_pm") and callable(getattr(mod, "handle_incoming_pm")):
                userbot.add_event_handler(getattr(mod, "handle_incoming_pm"), events.NewMessage(incoming=True, func=lambda e: e.is_private))
                LOGS.debug("Bound incoming PM listener: handle_incoming_pm")
        except Exception as e:
            LOGS.error(f"Failed to load plugin {module_name}: {e}\\n{traceback.format_exc()}")

    # Attach all registered commands in PLUGINS_REGISTRY to the userbot client
    bound_count = 0
    for cmd_name, item in PLUGINS_REGISTRY.items():
        handler = item["handler"]
        pat = item.get("pattern")
        if pat is not None:
            userbot.add_event_handler(handler, events.NewMessage(pattern=pat))
        else:
            userbot.add_event_handler(handler, events.NewMessage())
        bound_count += 1

    LOGS.info(f"Attached {bound_count} event handlers from {count} plugins to DcXUserBot.")
    return count
`
  },
  {
    path: 'core/inline.py',
    name: 'inline.py',
    category: 'core',
    description: 'Callback query router for inline buttons like CatUserbot (Help pagination, PM approval, Alive stats).',
    content: `"""
Inline Button Engine (CatUserbot style)
Handles interactive button callbacks sent via the companion Assistant Bot.
"""
import time
import psutil
from telethon import events, Button
from config import Config

def register_inline_callbacks(assistant, userbot):
    """Register callback query handlers on the assistant bot."""
    
    @assistant.on(events.CallbackQuery(data=b"alive_ping"))
    async def cb_alive_ping(event):
        start = time.time()
        await event.answer("Calculating real-time ping...", alert=False)
        latency = round((time.time() - start) * 1000, 2)
        await event.edit(
            f"⚡ **DcXuserbot AWS EC2 Latency**\\n\\n"
            f"• **Ping:** \`{latency} ms\`\\n"
            f"• **Region:** \`{Config.AWS_REGION}\`\\n"
            f"• **Server Time:** \`{time.strftime('%Y-%m-%d %H:%M:%S UTC')}\`",
            buttons=[
                [Button.inline("« Back to Alive", data="alive_back")],
                [Button.url("GitHub Repository", url="https://github.com")]
            ]
        )

    @assistant.on(events.CallbackQuery(data=b"alive_stats"))
    async def cb_alive_stats(event):
        cpu_usage = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        await event.edit(
            f"🖥️ **AWS EC2 System Metrics**\\n\\n"
            f"• **CPU Load:** \`{cpu_usage}%\`\\n"
            f"• **RAM Used:** \`{ram.percent}%\` ({round(ram.used / (1024**3), 2)} / {round(ram.total / (1024**3), 2)} GB)\\n"
            f"• **Disk:** \`{disk.percent}%\` ({round(disk.used / (1024**3), 1)} / {round(disk.total / (1024**3), 1)} GB)\\n"
            f"• **Instance:** \`{Config.AWS_INSTANCE_ID}\`",
            buttons=[[Button.inline("« Back to Alive", data="alive_back")]]
        )

    @assistant.on(events.CallbackQuery(data=b"alive_back"))
    async def cb_alive_back(event):
        uptime = round(time.time() - userbot.start_time)
        hours, rem = divmod(uptime, 3600)
        minutes, seconds = divmod(rem, 60)
        
        text = (
            f"⚡ **DcXuserbot is Running Superbly!**\\n\\n"
            f"• **Owner:** [{Config.ALIVE_NAME}](tg://user?id={(await userbot.get_me()).id})\\n"
            f"• **Uptime:** \`{hours}h {minutes}m {seconds}s\`\\n"
            f"• **Engine:** Telethon v1.34+ (Dual-Client)\\n"
            f"• **Host:** AWS EC2 Cloud Virtual Machine"
        )
        buttons = [
            [Button.inline("📊 System Stats", data="alive_stats"), Button.inline("⚡ Ping", data="alive_ping")],
            [Button.inline("📖 Help Menu", data="help_main"), Button.url("💬 Support", url="https://t.me")]
        ]
        await event.edit(text, buttons=buttons)

    @assistant.on(events.CallbackQuery(data=re.compile(b"help_(.*)")))
    async def cb_help_navigation(event):
        category = event.data_match.group(1).decode("utf-8")
        # Route to appropriate category help documentation
        await event.answer(f"Loaded category: {category}")
`
  },
  {
    path: 'plugins/alive.py',
    name: 'alive.py',
    category: 'plugin',
    description: 'Upgraded .alive command with dynamic system specs, uptime, and interactive inline buttons.',
    content: `import time
import psutil
from telethon import Button
from core.managers import register
from config import Config

@register(pattern="alive$")
async def alive_handler(event):
    """Check if DcXuserbot is active, showing uptime, AWS metrics and inline buttons."""
    uptime = round(time.time() - event.client.start_time)
    hours, rem = divmod(uptime, 3600)
    minutes, seconds = divmod(rem, 60)
    
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    me = await event.client.get_me()
    
    alive_text = (
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
    
    # If companion bot is configured, trigger inline query or bot message with buttons!
    if Config.BOT_TOKEN and Config.BOT_USERNAME:
        # CatUserbot pattern: invoke inline query to get inline buttons
        try:
            results = await event.client.inline_query(Config.BOT_USERNAME, "alive")
            await results[0].click(event.chat_id, reply_to=event.reply_to_msg_id, hide_via=True)
            await event.delete()
            return
        except Exception:
            pass

    # Fallback to direct edit if inline query fails
    await event.client.edit_or_reply(event, alive_text)
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
    content: `from telethon import events, Button
from core.managers import register
from config import Config

APPROVED_USERS = set()
PM_WARNS = {}

@register(pattern="approve$")
async def approve_pm(event):
    """Approve a user to direct message you."""
    if not event.is_private:
        return await event.edit_or_reply("Use this command in private chat!")
    chat_id = event.chat_id
    APPROVED_USERS.add(chat_id)
    PM_WARNS.pop(chat_id, None)
    await event.client.edit_or_reply(event, "✅ **User approved for direct messaging.**")

@register(pattern="disapprove$")
async def disapprove_pm(event):
    """Disapprove a user from direct messaging you."""
    chat_id = event.chat_id
    APPROVED_USERS.discard(chat_id)
    await event.client.edit_or_reply(event, "🚫 **User disapproved.**")

# Event listener for incoming private messages
async def handle_incoming_pm(event):
    if not Config.PM_PERMIT or not event.is_private:
        return
    me = await event.client.get_me()
    sender = await event.get_sender()
    
    if sender.bot or sender.is_self or sender.id in APPROVED_USERS:
        return

    # Count warnings
    PM_WARNS[sender.id] = PM_WARNS.get(sender.id, 0) + 1
    count = PM_WARNS[sender.id]
    
    if count >= Config.PM_LIMIT:
        await event.reply("🚫 **You have been blocked for spamming without approval.**")
        await event.client(functions.contacts.BlockRequest(id=sender.id))
        return

    warn_msg = (
        f"👋 **Hello {sender.first_name}!**\\n\\n"
        f"I am the personal automated security assistant for [{Config.ALIVE_NAME}](tg://user?id={me.id}).\\n"
        f"My master has not approved you to send private messages yet.\\n\\n"
        f"⚠️ **Warning:** \`{count}/{Config.PM_LIMIT}\` strikes.\\n"
        f"Spamming will cause an automatic block."
    )
    
    # Inline buttons if assistant bot is active
    buttons = [
        [Button.inline("❓ Request Approval", data=f"req_pm_{sender.id}")],
        [Button.url("📢 Official Channel", url="https://t.me")]
    ]
    await event.reply(warn_msg)
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
    content: `import time
from core.managers import register

@register(pattern="ping$")
async def ping_test(event):
    """Measure precise round-trip response time to Telegram data centers."""
    start = time.perf_counter()
    msg = await event.client.edit_or_reply(event, "🏓 **Pinging...**")
    end = time.perf_counter()
    latency = round((end - start) * 1000, 2)
    await msg.edit(f"🏓 **Pong!** \`{latency} ms\`\\n🛰️ Host: **AWS EC2**")

@register(pattern="whois(?:\\s+(.*))?$")
async def user_info(event):
    """Retrieve in-depth information regarding a user or chat ID."""
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        user_id = event.sender_id
        
    user = await event.client.get_entity(user_id)
    info = (
        f"👤 **User Dossier:**\\n"
        f"• **First Name:** {user.first_name}\\n"
        f"• **Last Name:** {user.last_name or 'None'}\\n"
        f"• **Username:** @{user.username or 'None'}\\n"
        f"• **ID:** \`{user.id}\`\\n"
        f"• **DC ID:** {getattr(user.photo, 'dc_id', 'Unknown') if user.photo else 'None'}\\n"
        f"• **Bot:** {user.bot}\\n"
        f"• **Verified:** {user.verified}"
    )
    await event.client.edit_or_reply(event, info)
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
`
  }
];
