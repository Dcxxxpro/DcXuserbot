import time
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
