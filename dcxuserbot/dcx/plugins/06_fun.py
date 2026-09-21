"""Fun module — memes, jokes, quotes, pets, dice and text games."""

from __future__ import annotations

import asyncio
import random

from telethon.tl.types import InputMediaDice

from dcx.core.helpers import display_name, get_reply, replied_text
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import results
from dcx.utils.format import truncate
from dcx.utils.http import get_json

_CATEGORY = "Fun"

_FALLBACK_QUOTES = [
    ("Talk is cheap. Show me the code.", "Linus Torvalds"),
    ("Programs must be written for people to read.", "Harold Abelson"),
    ("Simplicity is the soul of efficiency.", "Austin Freeman"),
    ("First, solve the problem. Then, write the code.", "John Johnson"),
]


async def _meme(sub: str | None = None) -> dict:
    url = "https://meme-api.com/gimme" + (f"/{sub}" if sub else "")
    data = await get_json(url, timeout=8)
    if data.get("nsfw"):
        data = await get_json("https://meme-api.com/gimme", timeout=8)
    return data


async def _joke() -> tuple[str, str]:
    data = await get_json("https://official-joke-api.appspot.com/random_joke", timeout=8)
    return data.get("setup", "…"), data.get("punchline", "…")


async def _quote() -> tuple[str, str]:
    try:
        data = await get_json("https://zenquotes.io/api/random", timeout=6)
        if isinstance(data, list) and data:
            return data[0].get("q", ""), data[0].get("a", "")
    except Exception:
        pass
    return random.choice(_FALLBACK_QUOTES)


async def _cat() -> str:
    data = await get_json("https://api.thecatapi.com/v1/images/search", timeout=8)
    return data[0]["url"]


async def _dog() -> str:
    data = await get_json("https://dog.ceo/api/breeds/image/random", timeout=8)
    return data["message"]


# ── chat commands ────────────────────────────────────────────────────────
@dcx_cmd("meme", category=_CATEGORY, desc="Fresh meme (optionally `.meme <subreddit>`).",
         usage=".meme [subreddit]")
async def meme_cmd(event, args):
    try:
        data = await _meme(args.strip() or None)
        await event.client.send_file(
            event.chat_id, data["url"],
            caption=(f"😂 **{truncate(data.get('title', 'meme'), 140)}**\n"
                     f"r/{data.get('subreddit', 'memes')} • 👍 {data.get('ups', 0)}"),
            reply_to=event.reply_to_msg_id)
        await event.delete()
    except Exception as exc:
        await event.client.edit_or_reply(event, f"😵 Meme failed: `{truncate(str(exc), 120)}`")


@dcx_cmd("joke", category=_CATEGORY, desc="Random programming-ish joke.")
async def joke_cmd(event, args):
    try:
        setup, punchline = await _joke()
        await event.client.edit_or_reply(event, f"😹 **{setup}**\n\n||{punchline}||")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"😵 `{truncate(str(exc), 120)}`")


@dcx_cmd("quote", category=_CATEGORY, desc="Inspirational quote drop.")
async def quote_cmd(event, args):
    text, author = await _quote()
    await event.client.edit_or_reply(event, f"💭 _{text}_\n— **{author}**")


@dcx_cmd("cat", category=_CATEGORY, desc="Random cat picture.")
async def cat_cmd(event, args):
    try:
        await event.client.send_file(event.chat_id, await _cat(), caption="🐱 Meow!",
                                     reply_to=event.reply_to_msg_id)
        await event.delete()
    except Exception as exc:
        await event.client.edit_or_reply(event, f"😿 `{truncate(str(exc), 120)}`")


@dcx_cmd("dog", category=_CATEGORY, desc="Random dog picture.")
async def dog_cmd(event, args):
    try:
        await event.client.send_file(event.chat_id, await _dog(), caption="🐶 Woof!",
                                     reply_to=event.reply_to_msg_id)
        await event.delete()
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🐕 `{truncate(str(exc), 120)}`")


@dcx_cmd("dice", category=_CATEGORY,
         desc="Roll an animated dice: 🎲 🎯 🏀 ⚽ 🎰 🎳", usage=".dice [emoji]")
async def dice_cmd(event, args):
    choice = args.strip() if args.strip() in {"🎲", "🎯", "🏀", "⚽", "🎰", "🎳"} else "🎲"
    await event.client.send_file(
        event.chat_id, InputMediaDice(choice), reply_to=event.reply_to_msg_id)
    await event.delete()


@dcx_cmd("flip", category=_CATEGORY, desc="Coin flip.")
async def flip_cmd(event, args):
    await event.client.edit_or_reply(
        event, f"🪙 **{random.choice(['Heads', 'Tails'])}!**")


@dcx_cmd("choose", category=_CATEGORY,
         desc="Pick between options split by `,` `|` or spaces.", usage=".choose tea, coffee")
async def choose_cmd(event, args):
    for sep in (",", "|"):
        args = args.replace(sep, " ")
    options = [token for token in args.split() if token]
    if len(options) < 2:
        await event.client.edit_or_reply(event, "🤔 Give me at least two options.")
        return
    await event.client.edit_or_reply(
        event, f"🎯 I choose: **{random.choice(options)}**")


@dcx_cmd("mock", category=_CATEGORY, desc="sPoNgEbOb mock the replied/typed text.")
async def mock_cmd(event, args):
    text = await replied_text(event, args)
    if not text:
        await event.client.edit_or_reply(event, "🐔 Reply to text or type after `.mock`.")
        return
    mocked = "".join(ch.upper() if random.random() > 0.5 else ch.lower() for ch in text)
    await event.client.edit_or_reply(event, f"🐔 {truncate(mocked, 2000)}")


_SLAPS = ["slapped", "smacked", "whacked", "bonked", "obliterated"]


@dcx_cmd("slap", category=_CATEGORY, desc="Slap the replied user with a random object.")
async def slap_cmd(event, args):
    reply = await get_reply(event)
    target = "them"
    if reply is not None:
        sender = await reply.get_sender()
        if sender is not None:
            target = f"[{display_name(sender)}](tg://user?id={sender.id})"
    item = random.choice(["a keyboard", "a wet fish", "a debugger",
                          "an exception trace", "a rubber duck"])
    await event.client.edit_or_reply(
        event, f"🖐 {random.choice(_SLAPS)} {target} with {item}!")


@dcx_cmd("type", category=_CATEGORY, desc="Typewriter effect on your text.",
         owner_only=True, usage=".type <text>")
async def type_cmd(event, args):
    text = await replied_text(event, args)
    if not text:
        await event.edit("⌨️ Usage: `.type hello world`", parse_mode="md")
        return
    text = text[:140]
    buffer = "⌨ "
    for char in text:
        buffer = buffer[:-1] + char + " "
        try:
            await event.edit(buffer)
        except Exception:
            return
        await asyncio.sleep(0.12)
    await event.edit(buffer)


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("meme", category=_CATEGORY, desc="Fresh meme image", photo=True)
async def meme_inline(ctx):
    try:
        data = await _meme(ctx.args.strip() or None)
        return [await results.photo_from_url(
            ctx.builder, url=data["url"],
            caption=(f"😂 **{truncate(data.get('title', 'meme'), 140)}**\n"
                     f"r/{data.get('subreddit', 'memes')} • 👍 {data.get('ups', 0)}"),
            id=results.result_id("meme", data.get("url", ctx.args)))]
    except Exception as exc:
        return [await results.article(ctx.builder, title="😵 meme failed",
                                description=truncate(str(exc), 80),
                                text=f"😵 Meme API error: `{truncate(str(exc), 150)}`",
                                id=results.result_id("meme-err"))]


@inline_cmd("joke", category=_CATEGORY, desc="Random joke")
async def joke_inline(ctx):
    try:
        setup, punchline = await _joke()
        body = f"😹 **{setup}**\n\n||{punchline}||"
    except Exception:
        body = "😵 Joke service is sleepy. Try again."
    return [await results.article(ctx.builder, title="😹 Random joke",
                            description="Tap to share", text=body,
                            id=results.result_id("joke", random.random()))]


@inline_cmd("quote", category=_CATEGORY, desc="Inspirational quote")
async def quote_inline(ctx):
    text, author = await _quote()
    return [await results.article(ctx.builder, title=f"💭 {author}",
                            description=truncate(text, 60),
                            text=f"💭 _{text}_\n— **{author}**",
                            id=results.result_id("quote", random.random()))]


@inline_cmd("cat", category=_CATEGORY, desc="Random cat", photo=True)
async def cat_inline(ctx):
    try:
        url = await _cat()
        return [await results.photo_from_url(
            ctx.builder, url=url, caption="🐱 Meow! — via DcXuserbot",
            id=results.result_id("cat", url))]
    except Exception as exc:
        return [await results.article(ctx.builder, title="😿 cat failed",
                                description=truncate(str(exc), 80),
                                text=f"😿 `{truncate(str(exc), 150)}`",
                                id=results.result_id("cat-err"))]


@inline_cmd("dog", category=_CATEGORY, desc="Random dog", photo=True)
async def dog_inline(ctx):
    try:
        url = await _dog()
        return [await results.photo_from_url(
            ctx.builder, url=url, caption="🐶 Woof! — via DcXuserbot",
            id=results.result_id("dog", url))]
    except Exception as exc:
        return [await results.article(ctx.builder, title="🐕 dog failed",
                                description=truncate(str(exc), 80),
                                text=f"🐕 `{truncate(str(exc), 150)}`",
                                id=results.result_id("dog-err"))]


@inline_cmd("flip", category=_CATEGORY, desc="Coin flip")
async def flip_inline(ctx):
    side = random.choice(["Heads", "Tails"])
    return [await results.article(ctx.builder, title=f"🪙 {side}!",
                            description="Coin flip", text=f"🪙 **{side}!**",
                            id=results.result_id("flip", random.random()))]


@inline_cmd("choose", category=_CATEGORY, desc="Let DcX pick an option")
async def choose_inline(ctx):
    args = ctx.args
    for sep in (",", "|"):
        args = args.replace(sep, " ")
    options = [token for token in args.split() if token]
    if len(options) < 2:
        body = "🎯 Usage: `choose tea, coffee, juice`"
    else:
        body = f"🎯 Out of **{len(options)}** options I choose: **{random.choice(options)}**"
    return [await results.article(ctx.builder, title="🎯 Chooser",
                            description=truncate(ctx.args, 40), text=body,
                            id=results.result_id("choose", ctx.args, random.random()))]
