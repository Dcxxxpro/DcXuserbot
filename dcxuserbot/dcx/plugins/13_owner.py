"""Owner-only power tools — eval, shell execution and registry listing.

These commands execute arbitrary code as the hosting user. They are locked
to the owner (never sudo) and should stay that way.
"""

from __future__ import annotations

import asyncio
import io
import traceback

from dcx.core import registry
from dcx.core.registry import dcx_cmd
from dcx.utils.format import truncate

_CATEGORY = "Owner"


@dcx_cmd("eval", category=_CATEGORY, owner_only=True,
         desc="Execute Python (async available).", usage=".eval <code>")
async def eval_cmd(event, args):
    if not args:
        await event.edit("🐍 Usage: `.eval <python code>`", parse_mode="md")
        return
    status = await event.edit("🐍 Evaluating…", parse_mode="md")
    stdout = io.StringIO()

    async def _runner():
        env = {
            "client": event.client, "event": event, "asyncio": asyncio,
            "registry": registry, "args": args,
        }
        code = args
        if "\n" not in code and not code.lstrip().startswith(("print", "return", "await")):
            code = f"return ({code})"
        wrapped = "async def __dcx_eval():\n" + "\n".join(
            "    " + line for line in code.splitlines())
        exec(compile(wrapped, "<dcx-eval>", "exec"), env)  # noqa: S102 - owner tool
        return await env["__dcx_eval"]()

    try:
        import contextlib

        with contextlib.redirect_stdout(stdout):
            result = await asyncio.wait_for(_runner(), timeout=25)
        out = stdout.getvalue().strip()
        body = ""
        if out:
            body += f"**stdout:**\n```\n{truncate(out, 1500)}```\n"
        if result is not None:
            body += f"**result:** `{truncate(repr(result), 1500)}`"
        await status.edit(body or "🐍 Executed (no output).", parse_mode="md")
    except Exception:
        await status.edit(
            f"🐍 **Traceback:**\n```\n{truncate(traceback.format_exc(), 3000)}```",
            parse_mode="md")


@dcx_cmd("exec", category=_CATEGORY, owner_only=True,
         desc="Run a shell command (60s cap).", usage=".exec <shell>")
async def exec_cmd(event, args):
    if not args:
        await event.edit("💻 Usage: `.exec uname -a`", parse_mode="md")
        return
    status = await event.edit("💻 Running…", parse_mode="md")
    proc = await asyncio.create_subprocess_shell(
        args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=60)
        text = out.decode(errors="ignore").strip() or "(no output)"
    except asyncio.TimeoutError:
        proc.kill()
        text = "(killed after 60s)"
    await status.edit(
        f"💻 `$ {truncate(args, 60)}`\n**rc={proc.returncode}**\n"
        f"```\n{truncate(text, 3300)}```",
        parse_mode="md")


@dcx_cmd("plugins", category=_CATEGORY, owner_only=True,
         desc="Show the loaded command registry.")
async def plugins_cmd(event, args):
    grouped = registry.categories()
    lines = [f"🧩 **{len(registry.COMMANDS)} commands in {len(grouped)} modules:**"]
    for category, commands in grouped.items():
        names = " ".join(f"`{c.name}`" for c in commands)
        lines.append(f"\n**{category}** ({len(commands)})\n{names}")
    await event.edit(truncate("\n".join(lines), 3900), parse_mode="md")
