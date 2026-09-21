"""Admin module — group moderation toolkit."""

from __future__ import annotations

import asyncio

from telethon.tl.functions.channels import EditAdminRequest, EditBannedRequest
from telethon.tl.types import ChatAdminRights, ChatBannedRights

from dcx.core.helpers import display_name, get_reply, get_target_user
from dcx.core.registry import dcx_cmd

_CATEGORY = "Admin"

_MUTE_ALL = ChatBannedRights(
    until_date=None, send_messages=True, send_media=True, send_stickers=True,
    send_gifs=True, send_games=True, send_inline=True, send_polls=True,
)
_NO_RIGHTS = ChatBannedRights(until_date=None)  # lift everything
_BAN_VIEW = ChatBannedRights(until_date=None, view_messages=True)


async def _target_or_error(event, args):
    entity, rest = await get_target_user(event, args)
    if entity is None:
        await event.client.edit_or_reply(
            event, "❌ Reply to a user or pass an id/@username.")
        return None, rest
    return entity, rest


@dcx_cmd("ban", category=_CATEGORY, desc="Ban a user from this chat.",
         usage=".ban <reply/id/@user>")
async def ban_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    await event.client(EditBannedRequest(event.chat_id, entity, _BAN_VIEW))
    await event.client.edit_or_reply(
        event, f"🔨 **Banned** [{display_name(entity)}](tg://user?id={entity.id}) "
        f"(`{entity.id}`)")


@dcx_cmd("unban", category=_CATEGORY, desc="Lift a ban in this chat.",
         usage=".unban <reply/id/@user>")
async def unban_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    await event.client(EditBannedRequest(event.chat_id, entity, _NO_RIGHTS))
    await event.client.edit_or_reply(
        event, f"🕊️ **Unbanned** [{display_name(entity)}](tg://user?id={entity.id})")


@dcx_cmd("kick", category=_CATEGORY, desc="Kick a user (they can rejoin).",
         usage=".kick <reply/id/@user>")
async def kick_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    await event.client(EditBannedRequest(event.chat_id, entity, _BAN_VIEW))
    await asyncio.sleep(1)
    await event.client(EditBannedRequest(event.chat_id, entity, _NO_RIGHTS))
    await event.client.edit_or_reply(
        event, f"👢 **Kicked** [{display_name(entity)}](tg://user?id={entity.id})")


@dcx_cmd("mute", category=_CATEGORY, desc="Mute a user in this chat.",
         usage=".mute <reply/id/@user>")
async def mute_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    await event.client(EditBannedRequest(event.chat_id, entity, _MUTE_ALL))
    await event.client.edit_or_reply(
        event, f"🔇 **Muted** [{display_name(entity)}](tg://user?id={entity.id})")


@dcx_cmd("unmute", category=_CATEGORY, desc="Restore a muted user.",
         usage=".unmute <reply/id/@user>")
async def unmute_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    await event.client(EditBannedRequest(event.chat_id, entity, _NO_RIGHTS))
    await event.client.edit_or_reply(
        event, f"🔊 **Unmuted** [{display_name(entity)}](tg://user?id={entity.id})")


@dcx_cmd("promote", category=_CATEGORY,
         desc="Promote a user to admin. Add `full` for add-admins rights.",
         usage=".promote <reply/id/@user> [full] [title…]")
async def promote_cmd(event, args):
    entity, rest = await _target_or_error(event, args)
    if not entity:
        return
    full = "full" in rest.lower().split()
    title = " ".join(w for w in rest.split() if w.lower() != "full")[:16] or "Admin"
    rights = ChatAdminRights(
        change_info=True, post_messages=False, edit_messages=False,
        delete_messages=True, ban_users=True, invite_users=True,
        pin_messages=True, add_admins=full, anonymous=False,
    )
    await event.client(EditAdminRequest(event.chat_id, entity, rights, title))
    await event.client.edit_or_reply(
        event, f"⭐ **Promoted** [{display_name(entity)}](tg://user?id={entity.id}) "
        f"to **{title}**{' (full rights)' if full else ''}")


@dcx_cmd("demote", category=_CATEGORY, desc="Revoke admin rights.",
         usage=".demote <reply/id/@user>")
async def demote_cmd(event, args):
    entity, _ = await _target_or_error(event, args)
    if not entity:
        return
    rights = ChatAdminRights(
        change_info=False, post_messages=False, edit_messages=False,
        delete_messages=False, ban_users=False, invite_users=False,
        pin_messages=False, add_admins=False, anonymous=False,
    )
    await event.client(EditAdminRequest(event.chat_id, entity, rights, ""))
    await event.client.edit_or_reply(
        event, f"📉 **Demoted** [{display_name(entity)}](tg://user?id={entity.id})")


@dcx_cmd("pin", category=_CATEGORY, desc="Pin replied message. Add `loud` to notify.",
         usage=".pin [loud]")
async def pin_cmd(event, args):
    reply = await get_reply(event)
    if not reply:
        await event.client.edit_or_reply(event, "❌ Reply to a message to pin it.")
        return
    loud = "loud" in args.lower()
    await event.client.pin_message(event.chat_id, reply.id, notify=loud)
    await event.client.edit_or_reply(
        event, "📌 **Pinned** (loud)" if loud else "📌 **Pinned** silently",)


@dcx_cmd("unpin", category=_CATEGORY, desc="Unpin replied message (or all with `all`).",
         usage=".unpin [all]")
async def unpin_cmd(event, args):
    if "all" in args.lower().split():
        await event.client.unpin_message(event.chat_id)
        await event.client.edit_or_reply(event, "📍 **Unpinned all messages.**")
        return
    reply = await get_reply(event)
    if not reply:
        await event.client.edit_or_reply(event, "❌ Reply to a pinned message, or use `.unpin all`.")
        return
    await event.client.unpin_message(event.chat_id, reply.id)
    await event.client.edit_or_reply(event, "📍 **Unpinned.**")


@dcx_cmd("purge", category=_CATEGORY,
         desc="Bulk-delete from the replied message. `.purge 20` caps the count.",
         usage=".purge [count]")
async def purge_cmd(event, args):
    reply = await get_reply(event)
    if not reply:
        await event.client.edit_or_reply(event, "❌ Reply to the message where purging starts.")
        return
    limit = int(args) if args.strip().isdigit() else 500
    message_ids: list[int] = [reply.id]
    async for message in event.client.iter_messages(
            event.chat_id, min_id=reply.id, limit=limit):
        message_ids.append(message.id)
    if event.message.id not in message_ids:
        message_ids.append(event.message.id)
    await event.client.delete_messages(event.chat_id, message_ids)
    note = await event.respond(f"🧹 **Purged {len(message_ids)} messages.**")
    await asyncio.sleep(3)
    try:
        await note.delete()
    except Exception:
        pass


@dcx_cmd("del", category=_CATEGORY, desc="Delete the replied message (and your command).",
         aliases=("delete",))
async def del_cmd(event, args):
    reply = await get_reply(event)
    if reply:
        try:
            await reply.delete()
        except Exception:
            pass
    await event.delete()


@dcx_cmd("zombies", category=_CATEGORY,
         desc="Count deleted accounts. Add `clean` to ban them.", usage=".zombies [clean]")
async def zombies_cmd(event, args):
    status = await event.client.edit_or_reply(event, "🧟 Scanning for deleted accounts…")
    removed = 0
    clean = "clean" in args.lower().split()
    async for participant in event.client.iter_participants(event.chat_id):
        if getattr(participant, "deleted", False):
            if clean:
                try:
                    await event.client(EditBannedRequest(event.chat_id, participant, _BAN_VIEW))
                    removed += 1
                except Exception:
                    pass
            else:
                removed += 1
    action = "banned" if clean else "found"
    await status.edit(f"🧟 **{removed} deleted account(s) {action}.**", parse_mode="md")


@dcx_cmd("invite", category=_CATEGORY, desc="Get the chat's invite link.")
async def invite_cmd(event, args):
    try:
        link = await event.client.export_chat_invite(event.chat_id)
        await event.client.edit_or_reply(event, f"🔗 **Invite:** {link}")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"❌ `{type(exc).__name__}` — no rights or not a group/channel.")


@dcx_cmd("kickme", category=_CATEGORY, desc="Leave this chat.")
async def kickme_cmd(event, args):
    await event.edit("👋 Bye.", parse_mode="md")
    try:
        await event.client.kick_participant(event.chat_id, "me")
    except Exception:
        pass
