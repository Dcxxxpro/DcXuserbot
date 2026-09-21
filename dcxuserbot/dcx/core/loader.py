"""Dynamic plugin discovery and event binding."""

from __future__ import annotations

import importlib
import logging
import pkgutil
import re
import traceback

from telethon import events

from dcx.config import Config
from dcx.core import registry

LOGS = logging.getLogger("DcX.loader")


def _command_pattern(names: list[str]) -> re.Pattern:
    prefixes = re.escape(Config.CMD_PREFIX + Config.SUDO_PREFIX)
    alternatives = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    return re.compile(rf"^[{prefixes}](?:{alternatives})(?:\s+([\s\S]+))?$")


async def load_plugins(userbot) -> dict[str, int]:
    """Import every module under :mod:`dcx.plugins` and bind its handlers."""
    import dcx.plugins as plugins_pkg

    loaded, failed = 0, 0
    for module_info in pkgutil.iter_modules(plugins_pkg.__path__):
        module_name = f"{plugins_pkg.__name__}.{module_info.name}"
        try:
            importlib.import_module(module_name)
            loaded += 1
        except Exception as exc:
            failed += 1
            LOGS.error("Plugin %s failed to import: %s\n%s",
                       module_name, exc, traceback.format_exc())

    bound = 0
    for command in registry.COMMANDS.values():
        names = [command.name, *command.aliases]
        userbot.add_event_handler(
            command.func,
            events.NewMessage(pattern=_command_pattern(names)),
        )
        bound += 1

    for func, builder in registry.RAW_HANDLERS:
        userbot.add_event_handler(func, builder)

    LOGS.info(
        "Plugins: %d loaded (%d failed) • %d commands • %d inline commands • %d raw listeners",
        loaded, failed, bound, len(registry.INLINE), len(registry.RAW_HANDLERS),
    )
    return {
        "plugins": loaded,
        "failed": failed,
        "commands": bound,
        "inline": len(registry.INLINE),
        "raw": len(registry.RAW_HANDLERS),
    }
