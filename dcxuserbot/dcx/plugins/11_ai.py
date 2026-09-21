"""AI module — Groq & Gemini via plain REST (no SDK bloat)."""

from __future__ import annotations

from dcx.config import Config
from dcx.core.helpers import replied_text
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import results
from dcx.utils.format import truncate
from dcx.utils.http import post_json

_CATEGORY = "AI"

_PERSONA = (
    "You are DcX, a sharp, witty assistant living inside a Telegram userbot. "
    "Answer concisely (≤2200 chars), markdown-friendly, helpful and direct."
)


async def _groq(prompt: str) -> str:
    headers = {"Authorization": f"Bearer {Config.GROQ_API_KEY}"}
    data = await post_json(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            "model": Config.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": _PERSONA},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1600,
        },
        headers=headers, timeout=60,
    )
    return data["choices"][0]["message"]["content"].strip()


async def _gemini(prompt: str) -> str:
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{Config.GEMINI_MODEL}:generateContent?key={Config.GEMINI_API_KEY}")
    data = await post_json(
        url,
        {"contents": [{"parts": [{"text": _PERSONA + "\n\nUser: " + prompt}]}]},
        timeout=60,
    )
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


async def _ai_answer(prompt: str, engine: str = "auto") -> str:
    """engine: auto | groq | gemini"""
    failures: list[str] = []
    order = ["groq", "gemini"] if engine == "auto" else [engine]
    for name in order:
        key = Config.GROQ_API_KEY if name == "groq" else Config.GEMINI_API_KEY
        if not key:
            failures.append(f"{name}: no API key configured")
            continue
        try:
            answer = await (_groq(prompt) if name == "groq" else _gemini(prompt))
            return answer
        except Exception as exc:
            failures.append(f"{name}: {truncate(str(exc), 120)}")
    raise RuntimeError("; ".join(failures) or "no AI engine configured")


def _missing_key_text() -> str:
    return (
        "🧠 **No AI keys configured.**\n"
        "Set `GROQ_API_KEY` (console.groq.com) or `GEMINI_API_KEY` "
        "(aistudio.google.com) in your environment."
    )


@dcx_cmd("ai", category=_CATEGORY, desc="Ask the AI anything (auto engine).",
         usage=".ai <question>", aliases=("ask",))
async def ai_cmd(event, args):
    prompt = await replied_text(event, args)
    if not prompt:
        await event.client.edit_or_reply(event, "🧠 Usage: `.ai <question>`")
        return
    if not (Config.GROQ_API_KEY or Config.GEMINI_API_KEY):
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    status = await event.client.edit_or_reply(event, "🧠 Thinking…")
    try:
        answer = await _ai_answer(prompt)
        engine = "Groq" if Config.GROQ_API_KEY else "Gemini"
        await status.edit(
            f"🧠 **DcX AI** ({engine})\n{truncate(answer, 3800)}", parse_mode="md")
    except Exception as exc:
        await status.edit(f"🧠 AI failed: `{truncate(str(exc), 250)}`", parse_mode="md")


@dcx_cmd("gemini", category=_CATEGORY, desc="Ask Google Gemini specifically.",
         usage=".gemini <question>")
async def gemini_cmd(event, args):
    prompt = await replied_text(event, args)
    if not Config.GEMINI_API_KEY:
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    status = await event.client.edit_or_reply(event, "♊ Gemini thinking…")
    try:
        answer = await _ai_answer(prompt, engine="gemini")
        await status.edit(f"♊ **Gemini**\n{truncate(answer, 3800)}", parse_mode="md")
    except Exception as exc:
        await status.edit(f"♊ Failed: `{truncate(str(exc), 250)}`", parse_mode="md")


@dcx_cmd("groq", category=_CATEGORY, desc="Ask Groq (Llama) specifically.",
         usage=".groq <question>")
async def groq_cmd(event, args):
    prompt = await replied_text(event, args)
    if not Config.GROQ_API_KEY:
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    status = await event.client.edit_or_reply(event, "⚡ Groq thinking…")
    try:
        answer = await _ai_answer(prompt, engine="groq")
        await status.edit(f"⚡ **Groq** ({Config.GROQ_MODEL})\n{truncate(answer, 3800)}",
                          parse_mode="md")
    except Exception as exc:
        await status.edit(f"⚡ Failed: `{truncate(str(exc), 250)}`", parse_mode="md")


@dcx_cmd("code", category=_CATEGORY, desc="Generate code with AI.",
         usage=".code <what to build>")
async def code_cmd(event, args):
    if not (Config.GROQ_API_KEY or Config.GEMINI_API_KEY):
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    prompt = await replied_text(event, args)
    if not prompt:
        await event.client.edit_or_reply(event, "👨‍💻 Usage: `.code python fibonacci memoized`")
        return
    status = await event.client.edit_or_reply(event, "👨‍💻 Writing code…")
    try:
        answer = await _ai_answer(
            f"Write code for this request. Give runnable code in one block plus a "
            f"one-line explanation. Request: {prompt}")
        await status.edit(f"👨‍💻 **DcX Coder**\n{truncate(answer, 3800)}", parse_mode="md")
    except Exception as exc:
        await status.edit(f"👨‍💻 Failed: `{truncate(str(exc), 250)}`", parse_mode="md")


@dcx_cmd("explain", category=_CATEGORY, desc="Explain the replied text/code with AI.")
async def explain_cmd(event, args):
    if not (Config.GROQ_API_KEY or Config.GEMINI_API_KEY):
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    text = await replied_text(event, args)
    if not text:
        await event.client.edit_or_reply(event, "📖 Reply to some text/code first.")
        return
    status = await event.client.edit_or_reply(event, "📖 Explaining…")
    try:
        answer = await _ai_answer(
            "Explain clearly and briefly (bullet points welcome):\n\n" + text[:3000])
        await status.edit(f"📖 **Explainer**\n{truncate(answer, 3800)}", parse_mode="md")
    except Exception as exc:
        await status.edit(f"📖 Failed: `{truncate(str(exc), 250)}`", parse_mode="md")


@dcx_cmd("summarize", category=_CATEGORY,
         desc="Summarize the last N messages (default 25, max 150) with AI.",
         usage=".summarize [n]")
async def summarize_cmd(event, args):
    if not (Config.GROQ_API_KEY or Config.GEMINI_API_KEY):
        await event.client.edit_or_reply(event, _missing_key_text())
        return
    count = int(args) if args.strip().isdigit() else 25
    count = max(5, min(count, 150))
    status = await event.client.edit_or_reply(
        event, f"📝 Reading the last {count} messages…")
    lines: list[str] = []
    async for message in event.client.iter_messages(event.chat_id, limit=count):
        if not (message.raw_text or "").strip():
            continue
        sender = await message.get_sender()
        name = getattr(sender, "first_name", None) or "user"
        lines.append(f"{name}: {message.raw_text.strip()[:200]}")
    if len(lines) < 3:
        await status.edit("📝 Not enough text to summarize.", parse_mode="md")
        return
    transcript = "\n".join(reversed(lines))[:6000]
    try:
        answer = await _ai_answer(
            "Summarize this Telegram chat in 4-8 punchy bullet points:\n\n" + transcript)
        await status.edit(
            f"📝 **Chat summary** ({len(lines)} msgs)\n{truncate(answer, 3800)}",
            parse_mode="md")
    except Exception as exc:
        await status.edit(f"📝 Failed: `{truncate(str(exc), 250)}`", parse_mode="md")


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("ai", category=_CATEGORY, desc="Ask the AI inline: ai <question>")
async def ai_inline(ctx):
    if not ctx.args.strip():
        return [await results.article(ctx.builder, title="🧠 ai",
                                description="Usage: ai <question>",
                                text="🧠 Usage: `ai <question>`",
                                id=results.result_id("ai-zero"))]
    if not (Config.GROQ_API_KEY or Config.GEMINI_API_KEY):
        return [await results.article(ctx.builder, title="🧠 No AI keys",
                                description="Configure GROQ_API_KEY or GEMINI_API_KEY",
                                text=_missing_key_text(), id=results.result_id("ai-nokey"))]
    try:
        answer = await _ai_answer(ctx.args.strip())
        engine = "Groq" if Config.GROQ_API_KEY else "Gemini"
        body = f"🧠 **DcX AI** ({engine})\n{truncate(answer, 3500)}"
    except Exception as exc:
        body = f"🧠 AI failed: `{truncate(str(exc), 200)}`"
    return [await results.article(ctx.builder, title=f"🧠 AI: {truncate(ctx.args, 30)}",
                            description="Tap to send the AI answer",
                            text=body, id=results.result_id("ai", ctx.args))]
