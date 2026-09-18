"""
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
        f"⚡ **DcXuserbot Superior Userbot Online!**\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👑 **Owner:** [{Config.ALIVE_NAME}](tg://user?id={me.id})\n"
        f"⏳ **Uptime:** `{hours}h {minutes}m {seconds}s`\n"
        f"⚙️ **CPU / RAM:** `{cpu}% / {ram}%`\n"
        f"🛰️ **Host:** `AWS EC2 ({Config.AWS_REGION})`\n"
        f"🤖 **Assistant:** @{Config.BOT_USERNAME or 'Active'}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✨ *Type* `{Config.COMMAND_HAND_LER}help` *for all commands.*"
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
            fallback_text += f"\n\n💡 *Note: Enable Inline Mode in @BotFather via /setinline for @{bot_username} to activate buttons.*"

    # Fallback to direct edit or reply if inline query is unavailable
    await event.client.edit_or_reply(event, fallback_text)
