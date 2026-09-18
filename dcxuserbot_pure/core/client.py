import time
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
