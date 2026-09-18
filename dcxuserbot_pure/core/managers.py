import os
import re
import sys
import glob
import logging
import importlib
import traceback
from telethon import events
from config import Config

LOGS = logging.getLogger("DcXuserbot.Managers")

CMD_PREFIX = re.escape(Config.COMMAND_HAND_LER)
SUDO_PREFIX = re.escape(Config.SUDO_COMMAND_HAND_LER)

PLUGINS_REGISTRY = {}

def register(pattern=None, sudo=True, **args):
    """
    Decorator to register userbot commands with strict authorization:
    - Bot Owner (and self outgoing events) can execute all commands via COMMAND_HAND_LER or SUDO_COMMAND_HAND_LER.
    - Sudo users whose IDs are in Config.SUDO_USERS can execute commands marked sudo=True via SUDO_COMMAND_HAND_LER or COMMAND_HAND_LER.
    - Non-authorized users are silently ignored (no response, no exceptions, no info leak).
    - Top-level exception safety prevents bot crashes and provides user feedback.
    """
    def decorator(func):
        if pattern:
            # Pattern matching both owner prefix and sudo prefix: e.g. ^[.!](command)(?:\s+(.*))?$
            regex = f"^[{CMD_PREFIX}{SUDO_PREFIX}]{pattern}"
            args["pattern"] = re.compile(regex)

        async def wrapper(event):
            try:
                # 1. Identity & Sudo Authorization Check
                me = getattr(event.client, "me", None)
                if me is None:
                    me = await event.client.get_me()
                    event.client.me = me
                
                sender_id = event.sender_id
                
                # Verify whether the sender is the bot owner or authorized sudo
                is_owner = (sender_id == me.id) or event.out
                is_sudo = (sender_id in Config.SUDO_USERS)
                
                if not (is_owner or is_sudo):
                    # Silently ignore unauthorized attempts
                    return
                
                # Check command level permission: if sudo=False, only owner can run
                if not is_owner and not sudo:
                    LOGS.warning(f"Sudo user {sender_id} attempted owner-only command: {func.__name__}")
                    return

                # 2. Execute Handler with robust safety net
                await func(event)
                
            except events.StopPropagation:
                raise events.StopPropagation
            except Exception as exc:
                err_trace = traceback.format_exc()
                LOGS.error(f"Unhandled exception in command [{func.__name__}]: {exc}\n{err_trace}")
                
                # Format friendly Telegram error without leaving message stuck in 'Processing...'
                friendly_error = (
                    f"❌ **Command Execution Failed:** `{func.__name__}`\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"⚠️ **Reason:** `{type(exc).__name__}: {str(exc) or 'Unknown error'}`\n"
                    f"💡 *Check terminal or systemd journal logs for full traceback.*"
                )
                try:
                    await event.client.edit_or_reply(event, friendly_error)
                except Exception:
                    pass

        # Register metadata for discovery & codex help menu
        doc = func.__doc__ or "No description provided."
        cmd_name = pattern.split()[0].replace("(.*)", "").replace("$", "").replace("(?:", "").strip() if pattern else func.__name__
        PLUGINS_REGISTRY[cmd_name] = {
            "handler": wrapper,
            "doc": doc.strip(),
            "sudo": sudo,
            "pattern": args.get("pattern"),
            "raw_pattern": pattern,
            "func_name": func.__name__
        }
        return wrapper
    return decorator

async def load_all_plugins(userbot, assistant=None):
    """
    Dynamically discover all plugins in plugins/ directory,
    bind event handlers with strict access control, and log loading summary.
    """
    plugins_path = os.path.join(os.path.dirname(__file__), "..", "plugins")
    modules = glob.glob(os.path.join(plugins_path, "*.py"))
    
    count = 0
    for file_path in sorted(modules):
        base_name = os.path.basename(file_path)
        if base_name.startswith("__"):
            continue
        module_name = f"plugins.{base_name[:-3]}"
        try:
            mod = importlib.import_module(module_name)
            count += 1
            LOGS.debug(f"Loaded plugin module: {module_name}")
            
            # Module-level incoming event listeners (such as anti-pm spam in pm_permit.py)
            if hasattr(mod, "handle_incoming_pm") and callable(getattr(mod, "handle_incoming_pm")):
                userbot.add_event_handler(
                    getattr(mod, "handle_incoming_pm"),
                    events.NewMessage(incoming=True, func=lambda e: e.is_private)
                )
                LOGS.debug("Bound incoming PM security shield: handle_incoming_pm")
        except Exception as e:
            LOGS.error(f"Failed to load plugin [{module_name}]: {e}\n{traceback.format_exc()}")

    # Attach all registered commands from PLUGINS_REGISTRY to the userbot client
    bound_count = 0
    for cmd_name, item in PLUGINS_REGISTRY.items():
        handler = item["handler"]
        pat = item.get("pattern")
        if pat is not None:
            userbot.add_event_handler(handler, events.NewMessage(pattern=pat))
        else:
            userbot.add_event_handler(handler, events.NewMessage())
        bound_count += 1

    LOGS.info(f"Attached {bound_count} secure commands from {count} plugins to DcXUserBot.")
    return count
