"""Info module — whois, ids, chat info, datacenter lookups."""

from __future__ import annotations

from telethon.tl.functions.photos import GetUserPhotosRequest
from telethon.tl.functions.users import GetFullUserRequest

from dcx.core.helpers import display_name, get_reply, get_target_user, inline_via_bot
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import results
from dcx.utils.format import mention, truncate

_CATEGORY = "Info"


async def _whois_lines(user, full=None) -> list[str]:
    lines = [
        "🕵️ **User Intelligence**",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"• **Name:** [{display_name(user)}](tg://user?id={user.id})",
        f"• **ID:** `{user.id}`",
        f"• **Username:** @{user.username or 'N/A'}",
        f"• **Bot:** `{'yes' if getattr(user, 'bot', False) else 'no'}`",
        f"• **Verified / Scam / Fake:** `{'✓' if getattr(user, 'verified', False) else '✗'} / "
        f"{'⚠' if getattr(user, 'scam', False) else '✗'} / {'⚠' if getattr(user, 'fake', False) else '✗'}`",
        f"• **Premium:** `{'yes' if getattr(user, 'premium', False) else 'no'}`",
    ]
    photo_obj = getattr(user, "photo", None)
    dc_id = getattr(photo_obj, "dc_id", None)
    lines.append(f"• **Data Center:** `DC{dc_id}`" if dc_id else "• **Data Center:** `hidden`")
    if full is not None:
        full_user = getattr(full, "full_user", None)
        bio = getattr(full_user, "about", "") or ""
        if bio:
            lines.append(f"• **Bio:** `{truncate(bio, 200)}`")
        common = getattr(full_user, "common_chats_count", 0)
        lines.append(f"• **Common chats:** `{common}`")
    return lines


@dcx_cmd("whois", category=_CATEGORY, desc="Deep user lookup: id, DC, bio, flags.",
         usage=".whois <reply/id/@user>", aliases=("info",))
async def whois_cmd(event, args):
    entity, _ = await get_target_user(event, args)
    if entity is None:
        me = event.client.me
        entity = me
    try:
        full = await event.client(GetFullUserRequest(entity))
    except Exception:
        full = None
    lines = await _whois_lines(entity, full)
    await event.client.edit_or_reply(event, "\n".join(lines))


@dcx_cmd("id", category=_CATEGORY, desc="IDs of chat, you, replied user & message.")
async def id_cmd(event, args):
    reply = await get_reply(event)
    lines = [
        "🆔 **Identifiers**",
        f"• **Chat:** `{event.chat_id}`",
        f"• **You:** `{event.sender_id}`",
    ]
    if reply is not None:
        sender = await reply.get_sender()
        lines.append(f"• **Replied user:** `{getattr(sender, 'id', 'N/A')}`")
        lines.append(f"• **Replied message:** `{reply.id}`")
    lines.append(f"• **This message:** `{event.message.id}`")
    await event.client.edit_or_reply(event, "\n".join(lines))


@dcx_cmd("chatinfo", category=_CATEGORY, desc="Stats of the current chat.")
async def chatinfo_cmd(event, args):
    chat = await event.get_chat()
    lines = [
        "💬 **Chat Intelligence**",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"• **Title:** `{truncate(getattr(chat, 'title', 'Private chat'), 60)}`",
        f"• **ID:** `{event.chat_id}`",
        f"• **Type:** `{type(chat).__name__}`",
    ]
    username = getattr(chat, "username", None)
    if username:
        lines.append(f"• **Username:** @{username}")
    count = None
    try:
        count = await event.client.get_participants(event.chat_id, limit=0)
        lines.append(f"• **Members:** `{len(count)}`")
    except Exception:
        pass
    dc = getattr(getattr(chat, "photo", None), "dc_id", None)
    if dc:
        lines.append(f"• **Data center:** `DC{dc}`")
    await event.client.edit_or_reply(event, "\n".join(lines))


_DCS = {
    1: ("MIA", "Miami, USA"), 2: ("AMS", "Amsterdam, NL"),
    3: ("MBA", "Mumbai, IN"), 4: ("STO", "Stockholm, SE"),
    5: ("SIN", "Singapore, SG"),
}


@dcx_cmd("dc", category=_CATEGORY, desc="Your account's real Telegram datacenter.")
async def dc_cmd(event, args):
    dc_id = getattr(event.client.session, "dc_id", 0)
    code, city = _DCS.get(dc_id, ("?", "unknown"))
    await event.client.edit_or_reply(
        event,
        f"🛰️ **Your session lives on DC{dc_id}** — `{code}` ({city})",
    )


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("whois", category=_CATEGORY, desc="User lookup by id/@username")
async def whois_inline(ctx):
    target = ctx.args.strip()
    if not target:
        return [await results.article(
            ctx.builder, title="🕵️ whois",
            description="Usage: whois <id or @username>",
            text="🕵️ **Usage:** `whois <id or @username>`",
            id=results.result_id("whois-usage"),
        )]
    try:
        user = await ctx.userbot.get_entity(
            int(target) if target.lstrip("-").isdigit() else target)
    except Exception:
        return [await results.article(
            ctx.builder, title=f"🕵️ whois — {target}",
            description="Could not resolve that user",
            text=f"❌ Could not resolve `{truncate(target, 40)}` from here.",
            id=results.result_id("whois-x", target),
        )]
    try:
        full = await ctx.userbot(GetFullUserRequest(user))
    except Exception:
        full = None
    lines = await _whois_lines(user, full)
    return [await results.article(
        ctx.builder, title=f"🕵️ {display_name(user)}",
        description=f"ID {user.id} • @{user.username or 'N/A'}",
        text="\n".join(lines), id=results.result_id("whois", user.id),
    )]


@inline_cmd("id", category=_CATEGORY, desc="Your own account id")
async def id_inline(ctx):
    me = ctx.userbot.me
    return [await results.article(
        ctx.builder, title="🆔 Account",
        description="Owner account identifiers",
        text=(f"🆔 **Owner:** {mention(display_name(me), me.id)}\n"
              f"**Username:** @{me.username or 'N/A'}"),
        id=results.result_id("id"),
    )]


@inline_cmd("dc", category=_CATEGORY, desc="Telegram datacenter of this account")
async def dc_inline(ctx):
    dc_id = getattr(ctx.userbot.session, "dc_id", 0)
    code, city = _DCS.get(dc_id, ("?", "unknown"))
    return [await results.article(
        ctx.builder, title=f"🛰️ DC{dc_id} — {code}",
        description="Datacenter location",
        text=f"🛰️ **DC{dc_id}** — `{code}` ({city})",
        id=results.result_id("dc"),
    )]
