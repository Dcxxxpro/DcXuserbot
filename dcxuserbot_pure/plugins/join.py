"""
High-Reliability Telegram Joining Suite: .join and !join
Supports:
- Public usernames: @channel or channel
- Public links: https://t.me/channel or t.me/join
- Private invite links: https://t.me/+AbCdEfGh or https://t.me/joinchat/AbCdEfGh
- Fallback resolution for invite hashes
"""

import re
import logging
import traceback
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest, CheckChatInviteRequest
from telethon.errors import (
    UserAlreadyParticipantError,
    InviteHashExpiredError,
    InviteHashInvalidError,
    FloodWaitError
)
from core.managers import register

LOGS = logging.getLogger("DcXuserbot.Join")

@register(pattern="join(?:\s+(.*))?$")
async def join_chat_or_channel(event):
    """Join any public channel, group, or private invite hash link."""
    raw_target = (event.pattern_match.group(1) or "").strip()
    
    # If no argument given, check replied message for link
    if not raw_target:
        reply = await event.get_reply_message()
        if reply and reply.text:
            raw_target = reply.text.strip()
            
    if not raw_target:
        return await event.client.edit_or_reply(
            event,
            "ℹ️ **Usage:**\n"
            "• `!join @channel` or `!join channelname`\n"
            "• `!join https://t.me/channelname`\n"
            "• `!join https://t.me/+AbCdEf12345` (Private invite)\n"
            "• `!join https://t.me/joinchat/AbCdEf12345`"
        )

    msg = await event.client.edit_or_reply(event, f"🔄 **Attempting to join:** `{raw_target}`...")

    try:
        # Pattern 1: Private Invite Link with '+' (e.g. t.me/+hash or telegram.me/+hash)
        private_plus = re.search(r"(?:https?://)?(?:www\.)?(?:t\.me|telegram\.me)/\+([a-zA-Z0-9_-]+)", raw_target)
        
        # Pattern 2: Old private joinchat link (e.g. t.me/joinchat/hash)
        private_joinchat = re.search(r"(?:https?://)?(?:www\.)?(?:t\.me|telegram\.me)/joinchat/([a-zA-Z0-9_-]+)", raw_target)

        invite_hash = None
        if private_plus:
            invite_hash = private_plus.group(1)
        elif private_joinchat:
            invite_hash = private_joinchat.group(1)

        if invite_hash:
            LOGS.info(f"Detected private invite hash: {invite_hash}")
            try:
                # Check invite first to get title if possible
                check = await event.client(CheckChatInviteRequest(invite_hash))
                chat_title = getattr(check, "title", "Private Group/Channel")
                
                # Import private invite
                await event.client(ImportChatInviteRequest(invite_hash))
                return await msg.edit(f"✅ **Successfully joined private chat:** **{chat_title}**!")
            except UserAlreadyParticipantError:
                return await msg.edit("ℹ️ **You are already a member of this private chat.**")
            except InviteHashExpiredError:
                return await msg.edit("❌ **Failed to join:** The private invite link has expired.")
            except InviteHashInvalidError:
                return await msg.edit("❌ **Failed to join:** The invite hash is invalid or revoked.")

        # Pattern 3: Public Channel Link or Username
        # Strip https://t.me/, t.me/, @, or trailing slashes
        clean_target = raw_target
        clean_target = re.sub(r"^https?://(?:www\.)?(?:t\.me|telegram\.me)/", "", clean_target)
        clean_target = clean_target.replace("@", "").strip().strip("/")

        if not clean_target:
            return await msg.edit("❌ **Invalid username or link provided.**")

        LOGS.info(f"Attempting to join public entity: {clean_target}")
        
        # Resolve entity
        entity = await event.client.get_entity(clean_target)
        await event.client(JoinChannelRequest(entity))
        
        entity_title = getattr(entity, "title", clean_target)
        await msg.edit(f"✅ **Successfully joined:** **{entity_title}** (`@{getattr(entity, 'username', clean_target)}`)")

    except UserAlreadyParticipantError:
        await msg.edit(f"ℹ️ **You are already a participant in** `{raw_target}`.")
    except FloodWaitError as fw:
        await msg.edit(f"⏳ **Telegram FloodWait:** Please wait `{fw.seconds}s` before joining more channels.")
    except Exception as exc:
        LOGS.error(f"Join error: {exc}\n{traceback.format_exc()}")
        await msg.edit(f"❌ **Failed to join chat:** `{type(exc).__name__}: {str(exc)}`")
