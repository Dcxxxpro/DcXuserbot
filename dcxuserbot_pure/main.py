#!/usr/bin/env python3
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
        f"• **Owner Prefix:** `{Config.COMMAND_HAND_LER}`\n"
        f"• **Sudo Prefix:** `{Config.SUDO_COMMAND_HAND_LER}`\n"
        f"• **Sudo Users:** `{len(Config.SUDO_USERS)}` authorized\n"
        f"• **Groq AI:** `{'Enabled (openai/gpt-oss-120b)' if Config.GROQ_API_KEY else 'Disabled'}`\n"
        f"• **Plugins:** `{loaded_count}` active\n"
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
