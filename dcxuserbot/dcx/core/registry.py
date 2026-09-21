"""Command registration, authorization and error shielding.

Two registries power the whole bot:

* :data:`COMMANDS` — classic chat commands (``.ping``, ``!ban`` …)
* :data:`INLINE` — inline-mode commands (``@AssistantBot ping`` …)

Both are *capability* based: every handler is wrapped in an auth guard and
a crash shield, so a broken plugin can never take the bot down.
"""

from __future__ import annotations

import functools
import logging
import traceback
from dataclasses import dataclass, field

from dcx.config import Config
from dcx.utils import data as store
from dcx.utils.format import truncate

LOGS = logging.getLogger("DcX.registry")


@dataclass
class Command:
    name: str
    category: str
    desc: str
    usage: str
    func: object
    sudo: bool = True
    owner_only: bool = False
    aliases: tuple[str, ...] = ()


@dataclass
class InlineCommand:
    name: str
    category: str
    desc: str
    usage: str
    func: object
    photo: bool = False  # True if it usually returns an image result


COMMANDS: dict[str, Command] = {}
INLINE: dict[str, InlineCommand] = {}
RAW_HANDLERS: list[tuple[object, object]] = []

OWNER_ID: int = 0  # injected at startup by dcx.__main__


# ── authorization ────────────────────────────────────────────────────────
def set_owner(user_id: int) -> None:
    global OWNER_ID
    OWNER_ID = int(user_id)


def is_owner_id(user_id: int | None) -> bool:
    return bool(user_id) and int(user_id) == OWNER_ID


def is_sudo_id(user_id: int | None) -> bool:
    if not user_id:
        return False
    return int(user_id) in set(Config.SUDO_USERS) | store.sudo_ids()


def is_privileged_id(user_id: int | None) -> bool:
    return is_owner_id(user_id) or is_sudo_id(user_id)


def check_access(event, cmd: Command) -> bool:
    """Owner (outgoing/self) runs everything; sudo respects the flag."""
    sender = event.sender_id
    if event.out or is_owner_id(sender):
        return True
    if not is_sudo_id(sender):
        return False
    return cmd.sudo and not cmd.owner_only


# ── chat command decorator ───────────────────────────────────────────────
def dcx_cmd(name: str, *, category: str = "General", desc: str = "",
            usage: str | None = None, sudo: bool = True,
            owner_only: bool = False, aliases: tuple[str, ...] = ()):
    """Register a chat command handler with auth + crash shield."""

    def decorator(func):
        display_usage = usage or f"{Config.CMD_PREFIX}{name}"

        @functools.wraps(func)
        async def wrapper(event):
            try:
                if not check_access(event, wrapper._dcx_command):
                    return  # silently ignore strangers
                args = ""
                try:
                    args = (event.pattern_match.group(1) or "").strip()
                except (AttributeError, IndexError):
                    args = ""
                await func(event, args)
            except Exception as exc:  # crash shield
                LOGS.error("Command %s failed: %s\n%s", name, exc, traceback.format_exc())
                report = (
                    f"❌ **{name} failed**\n"
                    f"`{type(exc).__name__}: {truncate(str(exc) or 'unknown error', 300)}`"
                )
                try:
                    if event.out:
                        await event.edit(report)
                    else:
                        await event.reply(report)
                except Exception:
                    pass

        wrapper._dcx_command = Command(  # type: ignore[attr-defined]
            name=name, category=category, desc=desc or "No description.",
            usage=display_usage, func=wrapper, sudo=sudo and not owner_only,
            owner_only=owner_only, aliases=aliases,
        )
        COMMANDS[name] = wrapper._dcx_command  # type: ignore[attr-defined]
        return wrapper

    return decorator


# ── inline command decorator ─────────────────────────────────────────────
def inline_cmd(name: str, *, category: str = "General", desc: str = "",
               usage: str | None = None, photo: bool = False):
    """Register an inline-mode command (``@AssistantBot <name> args``)."""

    def decorator(func):
        INLINE[name] = InlineCommand(
            name=name, category=category, desc=desc or "No description.",
            usage=usage or f"@{Config.BOT_USERNAME or 'assistant'} {name}",
            func=func, photo=photo,
        )
        return func

    return decorator


# ── raw event handlers (PM guard, etc.) ─────────────────────────────────
def raw_event(event_builder):
    def decorator(func):
        RAW_HANDLERS.append((func, event_builder))
        return func

    return decorator


# ── discovery helpers ────────────────────────────────────────────────────
def categories() -> dict[str, list[Command]]:
    grouped: dict[str, list[Command]] = {}
    for command in sorted(COMMANDS.values(), key=lambda c: c.name):
        grouped.setdefault(command.category, []).append(command)
    return dict(sorted(grouped.items()))


def inline_categories() -> dict[str, list[InlineCommand]]:
    grouped: dict[str, list[InlineCommand]] = {}
    for command in sorted(INLINE.values(), key=lambda c: c.name):
        grouped.setdefault(command.category, []).append(command)
    return dict(sorted(grouped.items()))
