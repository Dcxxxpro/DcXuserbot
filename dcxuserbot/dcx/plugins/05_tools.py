"""Tools module — calc, currency, weather, QR, shorten, translate, pastes."""

from __future__ import annotations

import ast
import json as _json
import math
import operator
import urllib.parse

from dcx.core.helpers import get_reply, replied_text
from dcx.core.registry import dcx_cmd, inline_cmd
from dcx.inline import results
from dcx.utils.format import truncate
from dcx.utils.http import get_bytes, get_json, get_text, http_session

_CATEGORY = "Tools"

# ── safe calculator ─────────────────────────────────────────────────────────
_BIN_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod, ast.Pow: operator.pow,
}
_UNARY_OPS = {ast.UAdd: operator.pos, ast.USub: operator.neg}
_NAMES = {
    name: getattr(math, name)
    for name in ("sqrt", "sin", "cos", "tan", "log", "log10", "log2", "exp",
                 "ceil", "floor", "fabs", "pi", "e", "tau", "inf")
}
_NAMES.update({"abs": abs, "round": round, "min": min, "max": max,
               "pow": pow, "int": int, "float": float})


def safe_calc(expression: str) -> float:
    """Evaluate a maths expression with a whitelist AST — no eval()."""
    if len(expression) > 200:
        raise ValueError("expression too long")

    def _node(node):
        if isinstance(node, ast.Expression):
            return _node(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
            return _BIN_OPS[type(node.op)](_node(node.left), _node(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
            return _UNARY_OPS[type(node.op)](_node(node.operand))
        if isinstance(node, ast.Name) and node.id in _NAMES:
            return _NAMES[node.id]
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) \
                and node.func.id in _NAMES and callable(_NAMES[node.func.id]):
            return _NAMES[node.func.id](*[_node(a) for a in node.args])
        raise ValueError(f"disallowed: {type(node).__name__}")

    return _node(ast.parse(expression, mode="eval"))


@dcx_cmd("calc", category=_CATEGORY, desc="Safe maths evaluator (sqrt, trig, powers…).",
         usage=".calc 2**10 + sqrt(144)")
async def calc_cmd(event, args):
    if not args:
        await event.client.edit_or_reply(event, "🧮 Usage: `.calc 2**10 + sqrt(144)`")
        return
    try:
        value = safe_calc(args)
        pretty = int(value) if isinstance(value, float) and value.is_integer() else round(value, 8)
        await event.client.edit_or_reply(event, f"🧮 `{args}` = **{pretty}**")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🧮 Error: `{truncate(str(exc), 150)}`")


@dcx_cmd("cur", category=_CATEGORY, desc="Currency conversion via Frankfurter.",
         usage=".cur 100 USD INR")
async def cur_cmd(event, args):
    tokens = args.split()
    try:
        amount = float(tokens[0])
        base, quote = tokens[1].upper(), tokens[2].upper()
    except (IndexError, ValueError):
        await event.client.edit_or_reply(event, "💱 Usage: `.cur 100 USD INR`")
        return
    try:
        data = await get_json("https://api.frankfurter.app/latest",
                              params={"from": base, "to": quote, "amount": amount})
        value = data["rates"][quote]
        await event.client.edit_or_reply(
            event, f"💱 **{amount:g} {base} = {value:,.2f} {quote}**\n_{data.get('date', '')}_")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"💱 Failed: `{truncate(str(exc), 150)}`")


_WMO = {
    113: "☀️ Clear", 116: "⛅ Partly cloudy", 119: "☁️ Cloudy", 122: "☁️ Overcast",
    143: "🌫 Mist", 176: "🌦 Light rain", 200: "⛈ Thunder", 227: "🌨 Snow",
    263: "🌦 Drizzle", 296: "🌧 Rain", 302: "🌧 Heavy rain", 308: "🌧 Heavy rain",
    323: "🌨 Light snow", 326: "❄️ Snow", 353: "🌦 Showers", 356: "🌧 Showers",
    389: "⛈ Storm", 395: "❄️ Blizzard",
}


def _weather_text(city: str, data: dict) -> str:
    area = data.get("nearest_area", [{}])[0]
    current = data.get("current_condition", [{}])[0]
    name = area.get("areaName", [{}])[0].get("value", city)
    country = area.get("country", [{}])[0].get("value", "")
    code = int(current.get("weatherCode", 0) or 0)
    emoji = _WMO.get(code, "🌡️")
    desc = current.get("weatherDesc", [{}])[0].get("value", "")
    return (
        f"{emoji} **Weather — {name}, {country}**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"• **Condition:** {desc}\n"
        f"• **Temp:** `{current.get('temp_C', '?')}°C` "
        f"(feels `{current.get('FeelsLikeC', '?')}°C`)\n"
        f"• **Humidity:** `{current.get('humidity', '?')}%`\n"
        f"• **Wind:** `{current.get('windspeedKmph', '?')} km/h`\n"
        f"• **UV:** `{current.get('uvIndex', '?')}`"
    )


@dcx_cmd("weather", category=_CATEGORY, desc="Live weather via wttr.in.",
         usage=".weather <city>")
async def weather_cmd(event, args):
    city = args.strip() or "auto"
    try:
        data = await get_json(f"https://wttr.in/{urllib.parse.quote(city)}",
                              params={"format": "j1"}, timeout=12)
        await event.client.edit_or_reply(event, _weather_text(city, data))
    except Exception as exc:
        await event.client.edit_or_reply(event, f"☁️ Weather failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("qr", category=_CATEGORY, desc="Generate a QR code image.",
         usage=".qr <text>")
async def qr_cmd(event, args):
    text = await replied_text(event, args)
    if not text:
        await event.client.edit_or_reply(event, "🔳 Usage: `.qr <text>` (or reply)")
        return
    url = ("https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data="
           + urllib.parse.quote(text[:800]))
    try:
        payload = await get_bytes(url, timeout=15)
        import io

        await event.client.send_file(
            event.chat_id, io.BytesIO(payload), file_name="dcx_qr.png",
            caption=f"🔳 QR for: `{truncate(text, 80)}`",
            reply_to=event.reply_to_msg_id,
        )
        await event.delete()
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🔳 Failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("qrread", category=_CATEGORY, desc="Decode a QR code from a replied image.")
async def qrread_cmd(event, args):
    reply = await get_reply(event)
    if not reply or not reply.photo:
        await event.client.edit_or_reply(event, "🔍 Reply to a photo containing the QR code.")
        return
    payload = await event.client.download_media(reply, bytes)
    try:
        import aiohttp

        form = aiohttp.FormData()
        form.add_field("file", payload, filename="qr.png", content_type="image/png")
        async with http_session().post(
                "https://api.qrserver.com/v1/read-qr-code/", data=form) as resp:
            data = await resp.json(content_type=None)
        value = data[0]["symbol"][0]["data"]
        if value:
            await event.client.edit_or_reply(event, f"🔍 **QR says:** `{truncate(value, 500)}`")
        else:
            await event.client.edit_or_reply(event, "🔍 No QR data found in that image.")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🔍 Failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("tiny", category=_CATEGORY, desc="Shorten a URL with TinyURL.",
         usage=".tiny <url>")
async def tiny_cmd(event, args):
    url = args.strip()
    if not url:
        await event.client.edit_or_reply(event, "🔗 Usage: `.tiny https://example.com`")
        return
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        short = (await get_text("https://tinyurl.com/api-create.php",
                                params={"url": url})).strip()
        await event.client.edit_or_reply(event, f"🔗 **Shortened:** {short}")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🔗 Failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("gh", category=_CATEGORY, desc="GitHub profile lookup.", usage=".gh <username>")
async def gh_cmd(event, args):
    user = args.strip().lstrip("@")
    if not user:
        await event.client.edit_or_reply(event, "🐙 Usage: `.gh torvalds`")
        return
    try:
        data = await get_json(f"https://api.github.com/users/{urllib.parse.quote(user)}")
        await event.client.edit_or_reply(
            event,
            f"🐙 **[{data.get('name') or data['login']}]({data['html_url']})**\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"• **Bio:** {truncate(str(data.get('bio') or 'N/A'), 120)}\n"
            f"• **Repos:** `{data.get('public_repos')}` • **Gists:** `{data.get('public_gists')}`\n"
            f"• **Followers:** `{data.get('followers')}` • **Following:** `{data.get('following')}`\n"
            f"• **Company:** {data.get('company') or 'N/A'} • **Location:** {data.get('location') or 'N/A'}\n"
            f"• **Joined:** `{str(data.get('created_at', ''))[:10]}`",
        )
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🐙 Failed: `{truncate(str(exc), 150)}`")


def _translate_sync_url(text: str, dest: str) -> str:
    return ("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto"
            f"&tl={dest}&dt=t&q=" + urllib.parse.quote(text))


async def translate_text(text: str, dest: str = "en") -> str:
    data = await get_json(_translate_sync_url(text, dest), timeout=12)
    return "".join(chunk[0] for chunk in data[0] if chunk and chunk[0])


@dcx_cmd("trt", category=_CATEGORY,
         desc="Translate replied/typed text. `.trt hi <text>` for other targets.",
         usage=".trt [lang] <text>")
async def trt_cmd(event, args):
    dest = "en"
    text_arg = args
    tokens = args.split(maxsplit=1)
    if len(tokens) == 2 and tokens[0].isalpha() and 2 <= len(tokens[0]) <= 5:
        dest, text_arg = tokens[0].lower(), tokens[1]
    text = await replied_text(event, text_arg)
    if not text:
        await event.client.edit_or_reply(event, "🌐 Usage: `.trt [lang] <text>` or reply.")
        return
    try:
        translated = await translate_text(text, dest)
        await event.client.edit_or_reply(
            event,
            f"🌐 **Translated → {dest}:**\n`{truncate(translated, 3000)}`\n\n"
            f"_Source:_ `{truncate(text, 300)}`",
        )
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🌐 Failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("paste", category=_CATEGORY, desc="Paste text to paste.rs and get a link.")
async def paste_cmd(event, args):
    text = await replied_text(event, args)
    if not text:
        await event.client.edit_or_reply(event, "📋 Reply to text or type after `.paste`.")
        return
    try:
        async with http_session().post("https://paste.rs", data=text.encode()) as resp:
            link = (await resp.text()).strip()
        await event.client.edit_or_reply(event, f"📋 **Pasted:** {link}")
    except Exception as exc:
        await event.client.edit_or_reply(event, f"📋 Failed: `{truncate(str(exc), 150)}`")


@dcx_cmd("json", category=_CATEGORY, desc="Pretty-print the replied message payload.")
async def json_cmd(event, args):
    reply = await get_reply(event)
    target = reply or event.message
    try:
        payload = _json.loads(str(target))
        pretty = _json.dumps(payload, indent=2, ensure_ascii=False)
    except Exception:
        pretty = str(target)
    await event.client.edit_or_reply(event, f"```json\n{truncate(pretty, 3500)}```")


# ── inline mode ──────────────────────────────────────────────────────────
@inline_cmd("calc", category=_CATEGORY, desc="Calculator: calc 2**10")
async def calc_inline(ctx):
    if not ctx.args:
        return [await results.article(ctx.builder, title="🧮 calc",
                                description="Usage: calc <expression>",
                                text="🧮 Usage: `calc 2**10 + sqrt(144)`",
                                id=results.result_id("calc-zero"))]
    try:
        value = safe_calc(ctx.args)
        pretty = int(value) if isinstance(value, float) and value.is_integer() else round(value, 8)
        body = f"🧮 `{ctx.args}` = **{pretty}**"
        desc_value = str(pretty)
    except Exception as exc:
        body = f"🧮 Error in `{truncate(ctx.args, 60)}`: `{truncate(str(exc), 120)}`"
        desc_value = "error"
    return [await results.article(ctx.builder, title=f"🧮 = {desc_value}",
                            description=truncate(ctx.args, 60), text=body,
                            id=results.result_id("calc", ctx.args))]


@inline_cmd("weather", category=_CATEGORY, desc="Live weather for a city")
async def weather_inline(ctx):
    city = ctx.args.strip() or "auto"
    try:
        data = await get_json(f"https://wttr.in/{urllib.parse.quote(city)}",
                              params={"format": "j1"}, timeout=8)
        body = _weather_text(city, data)
    except Exception as exc:
        body = f"☁️ Weather lookup failed for `{truncate(city, 30)}`: `{type(exc).__name__}`"
    return [await results.article(ctx.builder, title=f"☁️ Weather — {truncate(city, 24)}",
                            description="Current conditions", text=body,
                            id=results.result_id("wx", city))]


@inline_cmd("cur", category=_CATEGORY, desc="Currency conversion")
async def cur_inline(ctx):
    tokens = ctx.args.split()
    body = "💱 Usage: `cur 100 USD INR`"
    if len(tokens) == 3:
        try:
            amount = float(tokens[0])
            data = await get_json("https://api.frankfurter.app/latest",
                                  params={"from": tokens[1].upper(),
                                          "to": tokens[2].upper(), "amount": amount}, timeout=8)
            value = data["rates"][tokens[2].upper()]
            body = (f"💱 **{amount:g} {tokens[1].upper()} = {value:,.2f} {tokens[2].upper()}**\n"
                    f"_{data.get('date', '')}_")
        except Exception as exc:
            body = f"💱 Failed: `{truncate(str(exc), 120)}`"
    return [await results.article(ctx.builder, title="💱 Currency", description="FX conversion",
                            text=body, id=results.result_id("cur", ctx.args))]


@inline_cmd("trt", category=_CATEGORY, desc="Translate text (trt en hello)")
async def trt_inline(ctx):
    dest, text_arg = "en", ctx.args
    tokens = ctx.args.split(maxsplit=1)
    if len(tokens) == 2 and tokens[0].isalpha() and 2 <= len(tokens[0]) <= 5:
        dest, text_arg = tokens[0].lower(), tokens[1]
    if not text_arg.strip():
        body = "🌐 Usage: `trt hi hello world`"
    else:
        try:
            translated = await translate_text(text_arg.strip(), dest)
            body = (f"🌐 **→ {dest}:** `{truncate(translated, 2500)}`\n\n"
                    f"_Source:_ `{truncate(text_arg, 200)}`")
        except Exception as exc:
            body = f"🌐 Failed: `{truncate(str(exc), 120)}`"
    return [await results.article(ctx.builder, title="🌐 Translate",
                            description=truncate(text_arg, 40), text=body,
                            id=results.result_id("trt", ctx.args))]


@inline_cmd("tiny", category=_CATEGORY, desc="Shorten a link")
async def tiny_inline(ctx):
    url = ctx.args.strip()
    if url and not url.startswith(("http://", "https://")):
        url = "https://" + url
    if not url:
        body, title = "🔗 Usage: `tiny https://example.com`", "🔗 TinyURL"
    else:
        try:
            short = (await get_text("https://tinyurl.com/api-create.php",
                                    params={"url": url}, timeout=8)).strip()
            body, title = f"🔗 **{short}**\n_{truncate(url, 80)}_", f"🔗 {short}"
        except Exception as exc:
            body, title = f"🔗 Failed: `{truncate(str(exc), 120)}`", "🔗 Error"
    return [await results.article(ctx.builder, title=title, description="URL shortener",
                            text=body, id=results.result_id("tiny", url))]


@inline_cmd("qr", category=_CATEGORY, desc="QR code image for any text", photo=True)
async def qr_inline(ctx):
    if not ctx.args.strip():
        return [await results.article(ctx.builder, title="🔳 qr",
                                description="Usage: qr <text>",
                                text="🔳 Usage: `qr <text>` — returns a QR image.",
                                id=results.result_id("qr-zero"))]
    url = ("https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data="
           + urllib.parse.quote(ctx.args.strip()[:500]))
    return [await results.photo_from_url(
        ctx.builder, url=url,
        caption=f"🔳 QR for `{truncate(ctx.args.strip(), 120)}` — by DcXuserbot",
        id=results.result_id("qr", ctx.args))]


@inline_cmd("gh", category=_CATEGORY, desc="GitHub profile card")
async def gh_inline(ctx):
    user = ctx.args.strip().lstrip("@")
    if not user:
        body, title = "🐙 Usage: `gh torvalds`", "🐙 GitHub"
    else:
        try:
            data = await get_json(f"https://api.github.com/users/{urllib.parse.quote(user)}",
                                  timeout=8)
            body = (f"🐙 **[{data.get('name') or data['login']}]({data['html_url']})**\n"
                    f"Repos `{data.get('public_repos')}` • Followers `{data.get('followers')}`\n"
                    f"{truncate(str(data.get('bio') or ''), 120)}")
            title = f"🐙 {data['login']}"
        except Exception as exc:
            body, title = f"🐙 Failed: `{truncate(str(exc), 120)}`", "🐙 GitHub error"
    return [await results.article(ctx.builder, title=title, description=truncate(ctx.args, 40),
                            text=body, id=results.result_id("gh", user))]
