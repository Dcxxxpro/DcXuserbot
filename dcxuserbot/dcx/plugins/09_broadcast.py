"""Broadcast module — mass mentions and group casting."""

from __future__ import annotations

import asyncio

from dcx.core.helpers import display_name, replied_text
from dcx.core.registry import dcx_cmd

_CATEGORY = "Broadcast"

_RUNNING: dict[str, bool] = {}  # task flags keyed per chat


@dcx_cmd("tagall", category=_CATEGORY,
         desc="Mention everyone. `.tagall <text>` or reply. Use `.cancel` to stop.",
         usage=".tagall [text]")
async def tagall_cmd(event, args):
    if not event.is_group:
        await event.client.edit_or_reply(event, "📢 Works in groups only.")
        return
    if _RUNNING.get(str(event.chat_id)):
        await event.client.edit_or_reply(
            event, "📢 A tagall is already running here — `.cancel` first.")
        return
    text = await replied_text(event, args)
    status = await event.client.edit_or_reply(event, "📢 Gathering members…")
    _RUNNING[str(event.chat_id)] = True
    sent = 0
    try:
        chunk: list[str] = []
        async for member in event.client.iter_participants(event.chat_id):
            if getattr(member, "bot", False) or getattr(member, "deleted", False):
                continue
            chunk.append(f"[{display_name(member)}](tg://user?id={member.id})")
            if len(chunk) >= 8:
                if not _RUNNING.get(str(event.chat_id)):
                    await status.edit("📢 Tagall cancelled.", parse_mode="md")
                    return
                body = ((text + "\n\n") if text else "") + " ".join(chunk)
                await event.client.send_message(event.chat_id, body)
                sent += len(chunk)
                chunk = []
                await asyncio.sleep(2.2)
        if chunk:
            body = ((text + "\n\n") if text else "") + " ".join(chunk)
            await event.client.send_message(event.chat_id, body)
            sent += len(chunk)
        await status.edit(f"📢 **Tagall complete — {sent} members mentioned.**",
                          parse_mode="md")
    finally:
        _RUNNING.pop(str(event.chat_id), None)


@dcx_cmd("gcast", category=_CATEGORY, owner_only=True,
         desc="Broadcast a message to every group you joined.",
         usage=".gcast <text> (or reply)")
async def gcast_cmd(event, args):
    text = await replied_text(event, args)
    if not text:
        await event.client.edit_or_reply(event, "📣 Usage: `.gcast <text>` or reply.")
        return
    status = await event.client.edit_or_reply(event, "📣 Broadcasting…")
    sent, failed = 0, 0
    async for dialog in event.client.iter_dialogs():
        if not dialog.is_group:
            continue
        try:
            await event.client.send_message(dialog.id, text)
            sent += 1
        except Exception:
            failed += 1
        await asyncio.sleep(1.1)
    await status.edit(
        f"📣 **Broadcast done.** Sent to `{sent}` groups, failed in `{failed}`.",
        parse_mode="md")


@dcx_cmd("cancel", category=_CATEGORY, desc="Stop a running tagall in this chat.")
async def cancel_cmd(event, args):
    if _RUNNING.pop(str(event.chat_id), None):
        await event.client.edit_or_reply(event, "🛑 Stopping after the current batch…")
    else:
        await event.client.edit_or_reply(event, "🛑 Nothing running here.")
