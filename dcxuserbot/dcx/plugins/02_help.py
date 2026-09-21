"""Help module — the interactive command codex."""

from __future__ import annotations

from dcx.config import Config
from dcx.core import registry
from dcx.core.helpers import inline_via_bot
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import menus, results

_CATEGORY = "Core"


@dcx_cmd("help", category=_CATEGORY, desc="Open the interactive command codex. "
         "`.help <command>` shows one entry.", usage=".help [command]")
async def help_cmd(event, args):
    query = args.strip().lower()
    if query and query in registry.COMMANDS:
        text, _ = menus.help_command(query)
        await event.edit(text, parse_mode="md")
        return
    if await inline_via_bot(event.client, event, "help" + (f" {query}" if query else "")):
        return
    # plain-text fallback (no assistant configured)
    grouped = registry.categories()
    lines = ["📖 **DcXuserbot Command Codex**\n"]
    for category, commands in grouped.items():
        lines.append(f"**{category}:** " + "  ".join(f"`{c.name}`" for c in commands))
    lines.append(f"\n_Use_ `{Config.CMD_PREFIX}help <command>` _for details._")
    await event.edit("\n".join(lines), parse_mode="md")


@inline_cmd("help", category=_CATEGORY, desc="Interactive codex with buttons")
async def help_inline(ctx):
    query = ctx.args.strip().lower()
    if query and query in registry.COMMANDS:
        text, buttons = menus.help_command(query)
        title = f"🔎 .{query}"
    else:
        text, buttons = menus.help_main()
        title = "📖 DcXuserbot Codex"
    return [await results.banner_article(
        ctx.builder, title=title,
        description="Browse every module and command",
        text=text, buttons=buttons, id=results.result_id("help", query or "main"),
    )]
