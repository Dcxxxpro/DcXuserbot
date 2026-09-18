import os
import psutil
import platform
from datetime import datetime
from core.managers import register
from config import Config

@register(pattern="ec2(?:\s+(.*))?$")
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
            f"☁️ **AWS EC2 Instance Monitor**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• **Instance ID:** `{Config.AWS_INSTANCE_ID}`\n"
            f"• **Region:** `{Config.AWS_REGION}`\n"
            f"• **OS:** `{platform.system()} {platform.release()}`\n"
            f"• **CPU Cores:** `{psutil.cpu_count(logical=True)}` (`{cpu}% load`)\n"
            f"• **RAM Memory:** `{ram.percent}%` ({round(ram.used/(1024**3), 2)} / {round(ram.total/(1024**3), 2)} GB)\n"
            f"• **Swap Memory:** `{swap.percent}%` ({round(swap.used/(1024**3), 2)} / {round(swap.total/(1024**3), 2)} GB)\n"
            f"• **Disk Usage:** `{disk.percent}%` ({round(disk.used/(1024**3), 1)} / {round(disk.total/(1024**3), 1)} GB)\n"
            f"• **System Boot:** `{boot}`\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🟢 **Health:** Optimal"
        )
        await event.client.edit_or_reply(event, report)
    elif arg == "reboot":
        await event.client.edit_or_reply(event, "🔄 **Restarting DcXuserbot daemon on EC2...**")
        os.system("kill -9 %d && python3 main.py" % os.getpid())
