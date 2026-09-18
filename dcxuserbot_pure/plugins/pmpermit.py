"""
Anti-PM Spam Shield & Gatekeeper: .approve, .disapprove, .block
Protects user privacy by intercepting unsolicited direct messages.
Issues strike warnings and triggers automatic blocks upon hitting Config.PM_LIMIT.
"""

import logging
import traceback
from telethon import events, Button
from telethon.tl.functions.contacts import BlockRequest, UnblockRequest
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.PMPermit")

APPROVED_USERS = set()
PM_WARNS = {}

@register(pattern="approve(?:\s+(.*))?$")
async def approve_pm(event):
    """Approve a user to direct message you."""
    reply = await event.get_reply_message()
    target_id = None
    
    if reply:
        target_id = reply.sender_id
    elif event.is_private:
        target_id = event.chat_id
    else:
        arg = (event.pattern_match.group(1) or "").strip()
        if arg.isdigit():
            target_id = int(arg)
            
    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to approve.")

    APPROVED_USERS.add(target_id)
    PM_WARNS.pop(target_id, None)
    await event.client.edit_or_reply(event, f"✅ **User** `{target_id}` **approved for direct messaging.**")

@register(pattern="disapprove(?:\s+(.*))?$")
async def disapprove_pm(event):
    """Disapprove a user from direct messaging you."""
    reply = await event.get_reply_message()
    target_id = None
    
    if reply:
        target_id = reply.sender_id
    elif event.is_private:
        target_id = event.chat_id
    else:
        arg = (event.pattern_match.group(1) or "").strip()
        if arg.isdigit():
            target_id = int(arg)

    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to disapprove.")

    APPROVED_USERS.discard(target_id)
    await event.client.edit_or_reply(event, f"🚫 **User** `{target_id}` **disapproved.**")

@register(pattern="block(?:\s+(.*))?$")
async def block_user(event):
    """Immediately block replied user or private chat user."""
    reply = await event.get_reply_message()
    target_id = reply.sender_id if reply else (event.chat_id if event.is_private else None)
    
    if not target_id:
        return await event.client.edit_or_reply(event, "Reply to a user or use in private chat to block.")

    try:
        await event.client(BlockRequest(id=target_id))
        APPROVED_USERS.discard(target_id)
        await event.client.edit_or_reply(event, f"🛑 **User** `{target_id}` **blocked permanently.**")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"❌ **Failed to block:** `{exc}`")

async def handle_incoming_pm(event):
    """Security Shield: Inspects incoming private messages and warns strangers."""
    if not Config.PM_PERMIT or not event.is_private:
        return
        
    try:
        me = getattr(event.client, "me", None)
        if me is None:
            me = await event.client.get_me()
            event.client.me = me

        sender = await event.get_sender()
        if not sender:
            return

        # Whitelist conditions
        if sender.bot or sender.is_self or sender.id == me.id or sender.id in APPROVED_USERS or sender.id in Config.SUDO_USERS:
            return

        # Increment warning strike
        PM_WARNS[sender.id] = PM_WARNS.get(sender.id, 0) + 1
        count = PM_WARNS[sender.id]
        
        # Check if user reached max strikes
        if count >= Config.PM_LIMIT:
            await event.reply("🚫 **You have been blocked for exceeding the unsolicited message limit.**")
            await event.client(BlockRequest(id=sender.id))
            LOGS.info(f"Auto-blocked spammer {sender.id} ({sender.first_name})")
            return

        warn_msg = (
            f"👋 **Hello {sender.first_name}!**\n\n"
            f"I am the automated personal security assistant for [{Config.ALIVE_NAME}](tg://user?id={me.id}).\n"
            f"My master has not approved you to send private messages yet.\n\n"
            f"⚠️ **Warning Strike:** `{count}/{Config.PM_LIMIT}`\n"
            f"Spamming will result in an automated block."
        )
        await event.reply(warn_msg)
        
    except Exception as exc:
        LOGS.error(f"Error in PM permit listener: {exc}\n{traceback.format_exc()}")
