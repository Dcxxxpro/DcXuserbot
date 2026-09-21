"""Generate a Telethon StringSession interactively.

Usage:  ``python -m dcx.session_string``
"""

from __future__ import annotations

import asyncio

from telethon import TelegramClient
from telethon.sessions import StringSession


async def _generate() -> None:
    print("=== DcXuserbot String Session Generator ===")
    api_id = int(input("API_ID: ").strip())
    api_hash = input("API_HASH: ").strip()
    async with TelegramClient(StringSession(), api_id, api_hash) as client:
        session = client.session.save()
        print("\nYour STRING_SESSION (keep it secret):\n")
        print(session)
        try:
            me = await client.get_me()
            await client.send_message(
                "me",
                "⚡ DcXuserbot session generated successfully. "
                "Deploy with this account as the userbot.",
            )
            print(f"\nLogged in as @{me.username or me.id} — copy the string above.")
        except Exception:
            print("\nCopy the string above into STRING_SESSION.")


if __name__ == "__main__":
    asyncio.run(_generate())
