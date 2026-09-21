"""Entrypoint: ``python -m dcx`` boots the whole bot."""

from __future__ import annotations

import asyncio
import logging
import sys

from dcx import DCX_NAME, DCX_VERSION
from dcx.config import Config


def _setup_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
        format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    for noisy in ("telethon.network.mtprotosender", "telethon.client.updates"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


async def _start() -> None:
    from dcx.core.client import build_clients
    from dcx.core.loader import load_plugins
    from dcx.core import registry
    from dcx.utils.http import close_http

    logs = logging.getLogger("DcX.boot")
    logs.info("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    logs.info("  %s v%s — booting…", DCX_NAME, DCX_VERSION)
    logs.info("■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■")

    problems = Config.validate()
    if problems:
        for problem in problems:
            logs.error("Config: %s", problem)
        logs.error("Fix your environment (see sample_config.env) and restart.")
        sys.exit(2)

    userbot, assistant = await build_clients()
    registry.set_owner(userbot.me.id)

    stats = await load_plugins(userbot)

    if assistant:
        from dcx.inline import engine

        engine.register(assistant, userbot)

    try:
        name = userbot.me.first_name or Config.ALIVE_NAME
        await userbot.send_message(
            "me",
            "⚡ **DcXuserbot is online**\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• **Owner:** [{name}](tg://user?id={userbot.me.id})\n"
            f"• **Version:** `{DCX_VERSION}`\n"
            f"• **Prefix:** `{Config.CMD_PREFIX}` (sudo `{Config.SUDO_PREFIX}`)\n"
            f"• **Plugins:** `{stats['plugins']}`\n"
            f"• **Commands:** `{stats['commands']}` chat • `{stats['inline']}` inline\n"
            f"• **Assistant:** {'@' + Config.BOT_USERNAME if assistant else 'disabled'}\n\n"
            f"_Type_ `{Config.CMD_PREFIX}help` _or use inline mode:_ "
            f"`@{Config.BOT_USERNAME or 'assistant'} alive`",
        )
    except Exception as exc:
        logs.warning("Could not announce startup in Saved Messages: %s", exc)

    logs.info("DcXuserbot fully operational — listening for commands…")
    try:
        if assistant:
            await asyncio.gather(
                userbot.run_until_disconnected(),
                assistant.run_until_disconnected(),
            )
        else:
            await userbot.run_until_disconnected()
    finally:
        await close_http()


def main() -> None:
    _setup_logging()
    try:
        asyncio.run(_start())
    except (KeyboardInterrupt, SystemExit):
        print("\nDcXuserbot stopped.")


if __name__ == "__main__":
    main()
