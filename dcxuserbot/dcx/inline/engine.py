"""InlineQuery dispatcher + CallbackQuery router for the assistant bot.

Type ``@YourAssistant ping`` (or any registered command) in **any chat** and
the userbot answers through inline mode. Only the owner and sudo users get
functional results — everyone else sees a locked brand card.
"""

from __future__ import annotations

import difflib
import logging
import re
import time
import traceback
from dataclasses import dataclass

from telethon import Button, events

from dcx import DCX_VERSION
from dcx.config import Config
from dcx.core import registry
from dcx.inline import menus, results
from dcx.utils.format import truncate, uptime_since

LOGS = logging.getLogger("DcX.inline")


@dataclass
class InlineContext:
    """Everything an inline command handler needs."""
    event: object
    builder: object
    args: str
    userbot: object
    assistant: object


async def alive_text(userbot) -> str:
    me = userbot.me
    cpu = "—"
    ram = "—"
    try:
        import psutil

        cpu = f"{psutil.cpu_percent()}%"
        ram = f"{psutil.virtual_memory().percent}%"
    except Exception:
        pass
    return (
        "[​](" + Config.ALIVE_MEDIA + ")" if Config.ALIVE_MEDIA else ""
    ) + (
        "⚡ **DcXuserbot is alive & savage**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👑 **Owner:** [{Config.ALIVE_NAME}](tg://user?id={getattr(me, 'id', 0)})\n"
        f"🛰️ **DcX:** `{DCX_VERSION}` • **Prefix:** `{Config.CMD_PREFIX}`\n"
        f"⏳ **Uptime:** `{uptime_since(userbot.dcx_start_time)}`\n"
        f"⚙️ **CPU / RAM:** `{cpu}` / `{ram}`\n"
        f"🧩 **Commands:** `{len(registry.COMMANDS)}` chat • `{len(registry.INLINE)}` inline\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "✨ *Type `@"
        + (Config.BOT_USERNAME or "assistant")
        + " <command>` anywhere to control me inline.*"
    )


def alive_buttons() -> list:
    return [
        [Button.inline("📊 Stats", data=b"dcx|stats"),
         Button.inline("🏓 Ping", data=b"dcx|ping")],
        [Button.inline("📖 Command Codex", data=b"dcx|h|main"),
         Button.url("⭐ Source", "https://github.com/Dcxxxpro/DcXuserbot")],
    ]


async def default_results(ctx: InlineContext) -> list:
    """What you see when you type just ``@bot `` with no command."""
    builder = ctx.builder
    lat = await _server_latency(ctx.userbot)
    items = [
        await results.banner_article(
            builder, title="⚡ DcXuserbot — Alive",
            description="Status card with buttons",
            text=await alive_text(ctx.userbot),
            buttons=alive_buttons(),
            id=results.result_id("alive"),
        ),
        await results.banner_article(
            builder, title=f"🏓 Ping — {lat} ms",
            description="Round-trip latency right now",
            text=(f"🏓 **Pong!** `{lat} ms`\n"
                  f"🕒 `{time.strftime('%H:%M:%S UTC', time.gmtime())}`\n"
                  f"⏳ Uptime `{uptime_since(ctx.userbot.dcx_start_time)}`"),
            buttons=[[Button.inline("🔄 Re-ping", data=b"dcx|ping")]],
            id=results.result_id("ping"),
        ),
        await results.banner_article(
            builder, title="📖 Open Command Codex",
            description="Interactive help for every module",
            text=(menus.help_main()[0]),
            buttons=menus.help_main()[1],
            id=results.result_id("help"),
        ),
    ]
    for name in ("speedtest", "sysinfo", "meme", "joke", "weather"):
        entry = registry.INLINE.get(name)
        if entry:
            items.append(await results.article(
                builder,
                title=f"{'📷 ' if entry.photo else '⌨️ '}Run {name}",
                description=entry.desc,
                text=(f"⌨️ **Inline command:** `{name}`\n\n{entry.desc}\n\n"
                      f"Usage: `{entry.usage}`"),
                id=results.result_id("hint", name),
            ))
    return items


async def _server_latency(userbot) -> float:
    start = time.perf_counter()
    try:
        await userbot.get_me()
    except Exception:
        pass
    return round((time.perf_counter() - start) * 1000, 2)


async def dispatch_inline(ctx: InlineContext) -> list:
    """Route ``@bot <command> <args>`` to the matching handler."""
    entry = registry.INLINE.get(ctx.args.split()[0].lower()) if ctx.args else None
    name, _, arg_line = ctx.args.partition(" ")
    entry = registry.INLINE.get(name.lower()) if name else None
    if entry:
        child = InlineContext(ctx.event, ctx.builder, arg_line.strip(),
                              ctx.userbot, ctx.assistant)
        payload = await entry.func(child)
        return payload if isinstance(payload, list) else [payload]

    # Unknown inline text → offer chat-command usage hints + fuzzy matches
    builder = ctx.builder
    found = registry.COMMANDS.get(name.lower())
    hints = []
    if found:
        hints.append(await results.article(
            builder, title=f"🧾 .{found.name} (chat command)",
            description=found.desc,
            text=(f"🧾 **Usage:** `{found.usage}`\n{found.desc}\n\n"
                  f"_Runs in chat — sudo allowed: {'yes' if found.sudo else 'no'}._"),
            id=results.result_id("usage", found.name),
        ))
    else:
        candidates = list(dict.fromkeys(list(registry.COMMANDS) + list(registry.INLINE)))
        for guess in difflib.get_close_matches(name.lower(), candidates, n=4, cutoff=0.45):
            source = registry.INLINE.get(guess) or registry.COMMANDS.get(guess)
            if source:
                hints.append(await results.article(
                    builder, title=f"❓ Did you mean: {guess}",
                    description=source.desc,
                    text=(f"❓ **Did you mean**\n`{source.usage}`\n\n{source.desc}"),
                    id=results.result_id("guess", guess),
                ))
    if not hints:
        text, buttons = menus.help_main()
        hints.append(await results.banner_article(
            builder, title="📖 DcXuserbot Codex",
            description=f"No inline command '{name}'. Browse everything here.",
            text=text, buttons=buttons, id=results.result_id("fallback-help"),
        ))
    return hints


# ── registration ─────────────────────────────────────────────────────────
def register(assistant, userbot) -> None:
    """Wire inline + callback routers onto the assistant client."""

    @assistant.on(events.InlineQuery)
    async def _on_inline(event) -> None:
        builder = event.builder
        text = (event.text or "").strip()
        sender = event.sender_id

        if not registry.is_privileged_id(sender):
            locked = await results.banner_article(
                builder,
                title="⚡ DcXuserbot — Private Instance",
                description="This inline bot is locked to its owner.",
                text=(
                    "🔒 **DcXuserbot Private Assistant**\n\n"
                    "This inline interface answers only to its owner and sudo users.\n"
                    "Deploy your own from the source repository!"
                ),
                buttons=[[Button.url("⭐ Get DcXuserbot",
                                     "https://github.com/Dcxxxpro/DcXuserbot")]],
                id=results.result_id("locked"),
            )
            await event.answer([locked], cache_time=300)
            return

        try:
            ctx = InlineContext(event, builder, text, userbot, assistant)
            payload = await (default_results(ctx) if not text else dispatch_inline(ctx))
            photos = any(getattr(item, "photo", None) is not None for item in payload)
            await event.answer(payload, cache_time=0, gallery=photos)
        except Exception as exc:
            LOGS.error("Inline dispatch failed: %s\n%s", exc, traceback.format_exc())
            await event.answer([await results.banner_article(
                builder, title="❌ Inline error",
                description=f"{type(exc).__name__}",
                text=f"❌ **Inline command failed**\n`{truncate(str(exc) or type(exc).__name__, 400)}`",
                id=results.result_id("err", type(exc).__name__),
            )], cache_time=0)

    @assistant.on(events.CallbackQuery(data=re.compile(rb"^dcx\|")))
    async def _on_callback(event) -> None:
        if not registry.is_privileged_id(event.sender_id):
            await event.answer("🔒 DcXuserbot is locked to its owner.", alert=True)
            return
        parts = (event.data or b"").decode(errors="ignore").split("|")[1:]
        route = parts[0] if parts else ""
        try:
            if route == "h":
                sub = parts[1] if len(parts) > 1 else "main"
                if sub == "main":
                    text, buttons = menus.help_main()
                    await event.edit(text, buttons=buttons)
                elif sub == "close":
                    await event.answer("Codex closed.")
                    await event.delete()
                elif sub == "c" and len(parts) > 2:
                    page = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0
                    text, buttons = menus.help_category(parts[2], page)
                    await event.edit(text, buttons=buttons)
                elif sub == "k" and len(parts) > 2:
                    text, buttons = menus.help_command(parts[2])
                    await event.edit(text, buttons=buttons)
                else:
                    await event.answer()
            elif route == "ping":
                lat = await _server_latency(userbot)
                await event.answer(f"🏓 {lat} ms", alert=False)
                text = (
                    ("[​](" + Config.ALIVE_MEDIA + ")") if Config.ALIVE_MEDIA else ""
                ) + (
                    f"🏓 **Pong!** `{lat} ms`\n"
                    f"🕒 `{time.strftime('%H:%M:%S UTC', time.gmtime())}`\n"
                    f"⏳ Uptime `{uptime_since(userbot.dcx_start_time)}`\n"
                    f"🛰️ DcX `{DCX_VERSION}`"
                )
                await event.edit(text, buttons=[[
                    Button.inline("🔄 Re-ping", data=b"dcx|ping"),
                    Button.inline("« Alive", data=b"dcx|alive"),
                ]])
            elif route == "alive":
                await event.answer()
                await event.edit(await alive_text(userbot), buttons=alive_buttons())
            elif route == "stats":
                await event.answer("📊 Refreshing metrics…")
                import psutil

                cpu = psutil.cpu_percent()
                ram = psutil.virtual_memory()
                disk = psutil.disk_usage("/")
                text = (
                    ("[​](" + Config.ALIVE_MEDIA + ")") if Config.ALIVE_MEDIA else ""
                ) + (
                    "📊 **DcX Live Metrics**\n"
                    "━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"• **CPU:** `{cpu}%`\n"
                    f"• **RAM:** `{ram.percent}%`\n"
                    f"• **Disk:** `{disk.percent}%`\n"
                    f"• **Uptime:** `{uptime_since(userbot.dcx_start_time)}`\n"
                    f"• **DcX:** `{DCX_VERSION}`\n"
                    "━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"Run `{Config.CMD_PREFIX}sysinfo` for the full dashboard image."
                )
                await event.edit(text, buttons=[[
                    Button.inline("⚡ Alive", data=b"dcx|alive"),
                    Button.inline("🏓 Ping", data=b"dcx|ping"),
                    Button.inline("📖 Codex", data=b"dcx|h|main"),
                ]])
            else:
                await event.answer("Unknown action.", alert=False)
        except Exception as exc:
            LOGS.error("Callback failed: %s\n%s", exc, traceback.format_exc())
            try:
                await event.answer(f"Error: {truncate(str(exc), 150)}", alert=True)
            except Exception:
                pass

    LOGS.info("Inline engine registered on @%s", getattr(assistant.me, "username", "?"))
