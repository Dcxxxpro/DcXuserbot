"""
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
            f"⚡ **DcXuserbot AWS EC2 Latency**\n\n"
            f"• **Ping:** `{latency} ms`\n"
            f"• **Region:** `{Config.AWS_REGION}`\n"
            f"• **Server Time:** `{time.strftime('%Y-%m-%d %H:%M:%S UTC')}`",
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
            f"🖥️ **AWS EC2 System Metrics**\n\n"
            f"• **CPU Load:** `{cpu_usage}%`\n"
            f"• **RAM Used:** `{ram.percent}%` ({round(ram.used / (1024**3), 2)} / {round(ram.total / (1024**3), 2)} GB)\n"
            f"• **Disk:** `{disk.percent}%` ({round(disk.used / (1024**3), 1)} / {round(disk.total / (1024**3), 1)} GB)\n"
            f"• **Instance:** `{Config.AWS_INSTANCE_ID}`",
            buttons=[[Button.inline("« Back to Alive", data="alive_back")]]
        )

    @assistant.on(events.CallbackQuery(data=b"alive_back"))
    async def cb_alive_back(event):
        uptime = round(time.time() - userbot.start_time)
        hours, rem = divmod(uptime, 3600)
        minutes, seconds = divmod(rem, 60)
        
        text = (
            f"⚡ **DcXuserbot is Running Superbly!**\n\n"
            f"• **Owner:** [{Config.ALIVE_NAME}](tg://user?id={(await userbot.get_me()).id})\n"
            f"• **Uptime:** `{hours}h {minutes}m {seconds}s`\n"
            f"• **Engine:** Telethon v1.34+ (Dual-Client)\n"
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
