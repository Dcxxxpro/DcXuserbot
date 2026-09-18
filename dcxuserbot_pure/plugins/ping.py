"""
DcXuserbot Ping Benchmark Plugin
Routes through Companion Assistant Bot via Telegram Inline Queries
to render live interactive buttons (Re-Ping, System Metrics, Back to Alive).
"""

import time
import logging
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.Ping")

@register(pattern="ping$")
async def ping_handler(event):
    """
    Measure round-trip latency to Telegram and AWS EC2.
    Routes through Companion Assistant Bot to render interactive inline buttons.
    """
    start_time = time.perf_counter()
    
    # 1. Check if companion assistant bot is available for inline queries
    if Config.BOT_TOKEN and Config.BOT_USERNAME:
        bot_username = Config.BOT_USERNAME.replace("@", "").strip()
        try:
            LOGS.info(f"Querying assistant bot @{bot_username} for inline ping card...")
            results = await event.client.inline_query(bot_username, "ping")
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
            LOGS.warning(f"Could not render inline ping keyboard via @{bot_username}: {exc}")

    # 2. Direct fallback if assistant bot or inline queries are disabled
    msg = await event.client.edit_or_reply(event, "🏓 **Pinging...**")
    end_time = time.perf_counter()
    latency = round((end_time - start_time) * 1000, 2)
    
    fallback_text = (
        f"🏓 **Pong!** `{latency} ms`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🛰️ **Host:** AWS EC2 Cloud Node ({Config.AWS_REGION})\n"
        f"⏱️ **Server Time:** `{time.strftime('%Y-%m-%d %H:%M:%S UTC')}`"
    )
    if not Config.BOT_TOKEN or not Config.BOT_USERNAME:
        fallback_text += f"\n💡 *Configure BOT_TOKEN and enable /setinline in @BotFather for interactive inline buttons.*"
        
    await msg.edit(fallback_text)
