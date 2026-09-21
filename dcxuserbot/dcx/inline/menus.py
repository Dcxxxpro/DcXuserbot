"""Interactive help codex rendered through assistant-bot callbacks."""

from __future__ import annotations

from telethon import Button

from dcx.config import Config
from dcx.core import registry


def _cb(*parts: object) -> bytes:
    return ("dcx|" + "|".join(str(p) for p in parts)).encode()[:64]


def _hidden_banner(url: str | None) -> str:
    return f"[​]({url})" if url else ""


def _owner_line() -> str:
    from dcx.core.registry import OWNER_ID

    return f"[{Config.ALIVE_NAME}](tg://user?id={OWNER_ID})" if OWNER_ID else Config.ALIVE_NAME


def help_main() -> tuple[str, list]:
    grouped = registry.categories()
    total = sum(len(v) for v in grouped.values())
    text = (
        _hidden_banner(Config.HELP_MEDIA)
        + "📖 **DcXuserbot Command Codex**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👑 **Owner:** {_owner_line()}\n"
        f"⚡ **Prefixes:** `{Config.CMD_PREFIX}` (owner) • `{Config.SUDO_PREFIX}` (sudo)\n"
        f"🧩 **Modules:** `{len(grouped)}` • **Commands:** `{total}`\n"
        f"⌨️ **Inline:** `@{Config.BOT_USERNAME or 'assistant'} <command>`\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "Pick a module below, or run any command right from inline mode."
    )
    buttons, row = [], []
    cat_icons = {
        "Status": "📡", "Admin": "👮", "Info": "🕵️", "Tools": "🛠️",
        "Fun": "🎉", "Media": "🎬", "System": "🖥️", "Broadcast": "📢",
        "Security": "🛡️", "AI": "🧠", "Sudo": "🔑",
    }
    for category in grouped:
        icon = cat_icons.get(category, "📦")
        row.append(Button.inline(f"{icon} {category} ({len(grouped[category])})",
                                 data=_cb("h", "c", category)))
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([
        Button.inline("🏓 Ping", data=_cb("ping")),
        Button.inline("⚡ Alive", data=_cb("alive")),
        Button.inline("❌ Close", data=_cb("h", "close")),
    ])
    return text, buttons


def help_category(category: str, page: int = 0) -> tuple[str, list]:
    grouped = registry.categories()
    commands = grouped.get(category)
    if not commands:
        return help_main()
    per_page = 8
    pages = max(1, (len(commands) + per_page - 1) // per_page)
    page = max(0, min(page, pages - 1))
    chunk = commands[page * per_page:(page + 1) * per_page]

    text = (
        _hidden_banner(Config.HELP_MEDIA)
        + f"📂 **{category}** — page {page + 1}/{pages}\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        + "\n".join(f"• `{c.usage}` — {c.desc}" for c in chunk)
        + "\n━━━━━━━━━━━━━━━━━━━━━━\n"
        "Tap a command for full details."
    )
    buttons, row = [], []
    for command in chunk:
        row.append(Button.inline(f"▫️ {command.name}", data=_cb("h", "k", command.name)))
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    nav = []
    if page > 0:
        nav.append(Button.inline("⬅ Prev", data=_cb("h", "c", category, page - 1)))
    if page < pages - 1:
        nav.append(Button.inline("Next ➡", data=_cb("h", "c", category, page + 1)))
    if nav:
        buttons.append(nav)
    buttons.append([
        Button.inline("« Codex", data=_cb("h", "main")),
        Button.inline("❌ Close", data=_cb("h", "close")),
    ])
    return text, buttons


def help_command(name: str) -> tuple[str, list]:
    command = registry.COMMANDS.get(name)
    if not command:
        return help_main()
    aliases = f"\n• **Aliases:** `{', '.join(command.aliases)}`" if command.aliases else ""
    access = "👑 Owner only" if command.owner_only else (
        "👑 Owner + 🔑 Sudo" if command.sudo else "👑 Owner only")
    inline_flag = "✅ yes" if name in registry.INLINE else "❌ chat only"
    text = (
        _hidden_banner(Config.HELP_MEDIA)
        + f"🔎 **.{command.name}**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"• **Usage:** `{command.usage}`\n"
        f"• **Category:** `{command.category}`\n"
        f"• **Access:** {access}\n"
        f"• **Inline mode:** {inline_flag}\n"
        f"• **Info:** {command.desc}{aliases}"
    )
    buttons = [[
        Button.inline("« Module", data=_cb("h", "c", command.category)),
        Button.inline("« Codex", data=_cb("h", "main")),
    ]]
    return text, buttons
