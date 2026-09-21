"""PM Permit — anti-spam shield for your DMs."""

from __future__ import annotations

from telethon import events
from telethon.tl.functions.contacts import BlockRequest, UnblockRequest

from dcx.core.helpers import display_name, get_target_user
from dcx.core import registry
from dcx.core.registry import dcx_cmd, raw_event
from dcx.utils import data as store
from dcx.utils.format import mention

_CATEGORY = "Security"

_WARN_TEXT = (
    "🛡️ **DcX PM Guard**\n"
    "━━━━━━━━━━━━━━━━━━━━━━\n"
    "I'm {name}'s assistant wall. DMs from strangers are rate-limited.\n"
    "⚠️ Strike **{strikes}/{limit}** — earn approval or stop messaging."
)


def _is_stranger(user) -> bool:
    if user is None:
        return False
    if getattr(user, "bot", False) or getattr(user, "is_self", False):
        return False
    if registry.is_privileged_id(getattr(user, "id", None)):
        return False
    return True


@raw_event(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def pm_guard(event) -> None:
    if not store.pm_enabled():
        return
    sender = await event.get_sender()
    if not _is_stranger(sender):
        return
    user_id = sender.id
    if user_id in store.pm_approved():
        return
    strikes = store.pm_warn(user_id)
    limit = 4
    try:
        from dcx.config import Config

        limit = max(1, Config.PM_LIMIT)
    except Exception:
        pass
    if strikes >= limit:
        try:
            await event.client(BlockRequest(user_id))
        except Exception:
            pass
        store.pm_reset_warnings(user_id)
        store.pm_disapprove(user_id)
        return
    await event.reply(_WARN_TEXT.format(
        name=display_name(event.client.me) if event.client.me else "the owner",
        strikes=strikes, limit=limit))


@dcx_cmd("approve", category=_CATEGORY, desc="Allow a user to DM you.",
         usage=".approve <reply/id/@user>", aliases=("a",))
async def approve_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None and event.is_private:
        entity = await event.get_chat()
    if entity is None:
        await event.client.edit_or_reply(event, "🛡️ Reply to a user or use in their DM.")
        return
    fresh = store.pm_approve(entity.id)
    store.pm_reset_warnings(entity.id)
    await event.client.edit_or_reply(
        event, f"✅ **Approved** {mention(display_name(entity), entity.id)} to DM you."
        if fresh else "✅ Already approved.")


@dcx_cmd("disapprove", category=_CATEGORY, desc="Revoke DM approval.",
         usage=".disapprove <reply/id/@user>", aliases=("da",))
async def disapprove_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None and event.is_private:
        entity = await event.get_chat()
    if entity is None:
        await event.client.edit_or_reply(event, "🛡️ Reply to a user or use in their DM.")
        return
    removed = store.pm_disapprove(entity.id)
    await event.client.edit_or_reply(
        event, f"🚫 **Disapproved** {mention(display_name(entity), entity.id)}."
        if removed else "🚫 They were not approved.")


@dcx_cmd("block", category=_CATEGORY, desc="Block the replied/DM user.")
async def block_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None and event.is_private:
        entity = await event.get_chat()
    if entity is None:
        await event.client.edit_or_reply(event, "⛔ Reply to a user or use in their DM.")
        return
    try:
        await event.client(BlockRequest(entity.id))
    except Exception:
        pass
    await event.client.edit_or_reply(
        event, f"⛔ **Blocked** {mention(display_name(entity), entity.id)}.")


@dcx_cmd("unblock", category=_CATEGORY, desc="Unblock the replied/DM user.")
async def unblock_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None and event.is_private:
        entity = await event.get_chat()
    if entity is None:
        await event.client.edit_or_reply(event, "🔓 Reply to a user or use in their DM.")
        return
    try:
        await event.client(UnblockRequest(entity.id))
    except Exception:
        pass
    await event.client.edit_or_reply(
        event, f"🔓 **Unblocked** {mention(display_name(entity), entity.id)}.")


@dcx_cmd("approved", category=_CATEGORY, desc="List PM-permit approved users.")
async def approved_cmd(event, args):
    ids = sorted(store.pm_approved())
    if not ids:
        await event.client.edit_or_reply(event, "🛡️ Nobody approved yet.")
        return
    lines = [f"🛡️ **Approved ({len(ids)}):**"]
    for user_id in ids[:25]:
        try:
            entity = await event.client.get_entity(user_id)
            lines.append(f"• {mention(display_name(entity), user_id)}")
        except Exception:
            lines.append(f"• `{user_id}`")
    await event.client.edit_or_reply(event, "\n".join(lines))


@dcx_cmd("pmguard", category=_CATEGORY, desc="Toggle PM permit: `.pmguard on|off`",
         usage=".pmguard on|off")
async def pmguard_cmd(event, args):
    choice = args.strip().lower()
    if choice in {"on", "enable", "true", "1"}:
        store.set_pm_enabled(True)
        await event.client.edit_or_reply(event, "🛡️ **PM Guard enabled.**")
    elif choice in {"off", "disable", "false", "0"}:
        store.set_pm_enabled(False)
        await event.client.edit_or_reply(event, "🛡️ **PM Guard disabled.**")
    else:
        await event.client.edit_or_reply(
            event, f"🛡️ PM Guard is **{'ON' if store.pm_enabled() else 'OFF'}** — "
            "use `.pmguard on|off`.")
