import asyncio
from telethon.tl.types import ChatBannedRights
from core.managers import register

BANNED_RIGHTS = ChatBannedRights(
    until_date=None,
    view_messages=True,
    send_messages=True,
    send_media=True,
    send_stickers=True,
    send_gifs=True,
    send_games=True,
    send_inline=True,
    embed_links=True
)

MUTED_RIGHTS = ChatBannedRights(
    until_date=None,
    send_messages=True
)

@register(pattern="ban(?:\s+(.*))?")
async def ban_user(event):
    """Ban a user from the group."""
    if event.is_private:
        return await event.client.edit_or_reply(event, "This command only works in groups!")
        
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        return await event.client.edit_or_reply(event, "Reply to a user or specify an ID to ban.")
        
    try:
        await event.client.edit_permissions(event.chat_id, user_id, rights=BANNED_RIGHTS)
        await event.client.edit_or_reply(event, f"🔨 **Banned user:** `{user_id}`")
    except Exception as e:
        await event.client.edit_or_reply(event, f"Failed to ban: `{e}`")

@register(pattern="mute(?:\s+(.*))?")
async def mute_user(event):
    """Mute a user in the current group."""
    reply = await event.get_reply_message()
    user_id = reply.sender_id if reply else event.pattern_match.group(1)
    
    if not user_id:
        return await event.client.edit_or_reply(event, "Reply to a user to mute them.")
        
    await event.client.edit_permissions(event.chat_id, user_id, rights=MUTED_RIGHTS)
    await event.client.edit_or_reply(event, f"🤐 **Muted user:** `{user_id}`")

@register(pattern="purge$")
async def purge_messages(event):
    """Fast bulk delete starting from replied message."""
    reply = await event.get_reply_message()
    if not reply:
        return await event.client.edit_or_reply(event, "Reply to the message from where to purge.")
        
    start_id = reply.id
    end_id = event.id
    
    msgs = []
    async for msg in event.client.iter_messages(event.chat_id, min_id=start_id - 1, max_id=end_id):
        msgs.append(msg.id)
        if len(msgs) >= 100:
            await event.client.delete_messages(event.chat_id, msgs)
            msgs = []
            
    if msgs:
        await event.client.delete_messages(event.chat_id, msgs)
        
    notice = await event.client.send_message(event.chat_id, f"🧹 **Purged messages successfully.**")
    await asyncio.sleep(3)
    await notice.delete()
