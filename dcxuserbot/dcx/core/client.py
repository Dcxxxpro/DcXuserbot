"""Telegram clients: the userbot itself plus its BotFather assistant.

The assistant powers inline mode, rich buttons and PM-permit keyboards.
It is completely optional — without ``BOT_TOKEN`` the bot still runs every
chat command perfectly.
"""

from __future__ import annotations

import logging
import os
import time

from telethon import TelegramClient
from telethon.sessions import StringSession

from dcx import DCX_VERSION
from dcx.config import Config

LOGS = logging.getLogger("DcX.client")


class DcXClient(TelegramClient):
    """The account you control (outgoing commands + sudo commands)."""

    def __init__(self) -> None:
        super().__init__(
            StringSession(Config.STRING_SESSION),
            api_id=Config.API_ID,
            api_hash=Config.API_HASH,
            device_model="DcXuserbot",
            system_version=f"DcX OS {DCX_VERSION}",
            app_version=DCX_VERSION,
        )
        self.me = None
        self.dcx_start_time = time.time()
        self.assistant: AssistantBot | None = None

    async def edit_or_reply(self, event, text: str, **kwargs):
        """Edit our own command message; reply when a sudo user triggered it."""
        kwargs.setdefault("parse_mode", "md")
        if event.out:
            return await event.edit(text, **kwargs)
        return await event.reply(text, **kwargs)


class AssistantBot(TelegramClient):
    """The BotFather bot used for inline queries and rich buttons."""

    def __init__(self) -> None:
        os.makedirs(Config.DATA_DIR, exist_ok=True)
        super().__init__(
            os.path.join(Config.DATA_DIR, "dcx_assistant"),
            api_id=Config.API_ID,
            api_hash=Config.API_HASH,
        )
        self.me = None

    async def begin(self) -> "AssistantBot":
        await self.start(bot_token=Config.BOT_TOKEN)
        self.me = await self.get_me()
        return self


async def build_clients() -> tuple[DcXClient, AssistantBot | None]:
    """Start the userbot and (if configured) the assistant bot."""
    userbot = DcXClient()
    await userbot.start()
    userbot.me = await userbot.get_me()
    LOGS.info("Userbot online as @%s (%s)", userbot.me.username, userbot.me.id)

    assistant: AssistantBot | None = None
    if Config.BOT_TOKEN:
        try:
            assistant = await AssistantBot().begin()
            userbot.assistant = assistant
            if not Config.BOT_USERNAME:
                Config.BOT_USERNAME = assistant.me.username or ""
            LOGS.info("Assistant bot online as @%s", assistant.me.username)
        except Exception as exc:
            LOGS.warning("Assistant failed to start (%s) — inline mode disabled.", exc)
            assistant = None
    else:
        LOGS.warning("BOT_TOKEN not set — inline mode & buttons disabled.")
    return userbot, assistant
