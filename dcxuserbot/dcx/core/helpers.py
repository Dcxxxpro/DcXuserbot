"""Shared helpers for chat-command plugins."""

from __future__ import annotations

import asyncio

from dcx.config import Config


async def inline_via_bot(userbot, event, query: str, *, reply_to: int | None = None) -> bool:
    """Render an inline-mode result into this chat (CatUserbot style).

    Returns True when the inline message was delivered (the original
    command message is then deleted).
    """
    if not userbot.assistant or not Config.BOT_USERNAME:
        return False
    try:
        fetched = await userbot.inline_query(Config.BOT_USERNAME, query)
        if not fetched:
            return False
        await fetched[0].click(
            event.chat_id,
            reply_to=reply_to if reply_to is not None else event.reply_to_msg_id,
        )
        await event.delete()
        return True
    except Exception:
        return False


async def get_reply(event) -> object | None:
    if event.is_reply:
        try:
            return await event.get_reply_message()
        except Exception:
            return None
    return None


async def get_target_user(event, args: str):
    """Resolve a user from a reply, or an id/@username in args.

    Returns ``(entity, rest_of_args)`` or ``(None, args)``.
    """
    reply = await get_reply(event)
    if reply is not None:
        try:
            sender = await reply.get_sender()
        except Exception:
            sender = None
        if sender is not None:
            return sender, args

    tokens = args.split()
    if not tokens:
        return None, args
    candidate = tokens[0]
    if candidate.startswith("@") or candidate.lstrip("-").isdigit():
        try:
            entity = await event.client.get_entity(
                int(candidate) if candidate.lstrip("-").isdigit() else candidate
            )
            return entity, " ".join(tokens[1:])
        except Exception:
            return None, args
    try:  # allow plain usernames too
        entity = await event.client.get_entity(candidate)
        return entity, " ".join(tokens[1:])
    except Exception:
        return None, args


def display_name(user) -> str:
    parts = [getattr(user, "first_name", "") or "", getattr(user, "last_name", "") or ""]
    return " ".join(p for p in parts if p).strip() or getattr(user, "username", "user")


async def replied_text(event, args: str) -> str:
    """Text from args, falling back to the replied message's text."""
    if args:
        return args
    reply = await get_reply(event)
    if reply is not None and getattr(reply, "raw_text", ""):
        return reply.raw_text.strip()
    return ""


async def sleep_edit(event, text: str, delay: float = 0.0) -> None:
    if delay:
        await asyncio.sleep(delay)
    try:
        await event.edit(text, parse_mode="md")
    except Exception:
        pass
