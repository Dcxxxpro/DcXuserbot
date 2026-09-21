"""Sudo module — delegate command access to trusted users (owner only)."""

from __future__ import annotations

from dcx.core.helpers import display_name, get_target_user
from dcx.core.registry import dcx_cmd
from dcx.utils import data as store
from dcx.utils.format import mention

_CATEGORY = "Sudo"


@dcx_cmd("addsudo", category=_CATEGORY, owner_only=True,
         desc="Grant sudo powers to a user.", usage=".addsudo <reply/id/@user>")
async def addsudo_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None:
        await event.client.edit_or_reply(event, "🔑 Reply to a user or pass id/@username.")
        return
    added = store.add_sudo(entity.id)
    await event.client.edit_or_reply(
        event,
        f"🔑 **{mention(display_name(entity), entity.id)} is now sudo.**"
        if added else "🔑 Already sudo.")


@dcx_cmd("remsudo", category=_CATEGORY, owner_only=True,
         desc="Revoke sudo from a user.", aliases=("delsudo",),
         usage=".remsudo <reply/id/@user>")
async def remsudo_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None:
        await event.client.edit_or_reply(event, "🔑 Reply to a user or pass id/@username.")
        return
    removed = store.remove_sudo(entity.id)
    await event.client.edit_or_reply(
        event,
        f"🔑 **{mention(display_name(entity), entity.id)} removed from sudo.**"
        if removed else "🔑 They were not sudo.")


@dcx_cmd("sudolist", category=_CATEGORY, owner_only=True,
         desc="List every sudo user (env + runtime).")
async def sudolist_cmd(event, args):
    from dcx.config import Config

    env_ids = set(Config.SUDO_USERS)
    runtime_ids = store.sudo_ids()
    ids = sorted(env_ids | runtime_ids)
    if not ids:
        await event.client.edit_or_reply(event, "🔑 No sudo users.")
        return
    lines = [f"🔑 **Sudo users ({len(ids)}):**"]
    for user_id in ids:
        origin = []
        if user_id in env_ids:
            origin.append("env")
        if user_id in runtime_ids:
            origin.append("runtime")
        try:
            entity = await event.client.get_entity(user_id)
            lines.append(f"• {mention(display_name(entity), user_id)} _({'+'.join(origin)})_")
        except Exception:
            lines.append(f"• `{user_id}` _({'+'.join(origin)})_")
    await event.client.edit_or_reply(event, "\n".join(lines))
