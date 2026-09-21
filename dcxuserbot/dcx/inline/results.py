"""Helpers that build inline-query results consistently.

Telethon's ``InlineBuilder`` methods are coroutines, so everything here is
awaitable as well.
"""

from __future__ import annotations

import hashlib

from dcx.config import Config
from dcx.utils.telegraph import upload_file


def result_id(*parts: object) -> str:
    raw = "|".join(str(p) for p in parts)
    return hashlib.sha1(raw.encode()).hexdigest()[:24]


async def article(builder, *, title: str, text: str, description: str = "",
                  buttons=None, thumb: str | None = None, id: str | None = None):
    """A rich text card (optionally with inline buttons)."""
    kwargs = {"title": title, "description": description or title, "text": text,
              "buttons": buttons, "link_preview": True}
    if thumb:
        kwargs["thumb"] = thumb
    if id:
        kwargs["id"] = id
    return await builder.article(**kwargs)


async def banner_article(builder, *, title: str, text: str, description: str = "",
                         buttons=None, banner: str | None = None, id: str | None = None):
    """Article that embeds a photo banner via Telegram link preview."""
    image = banner or Config.ALIVE_MEDIA
    if image:
        text = f"[​]({image})" + text  # zero-width embeds the picture
    return await article(builder, title=title, text=text,
                         description=description, buttons=buttons, id=id)


async def photo_from_url(builder, *, url: str, caption: str = "",
                         buttons=None, id: str | None = None):
    """Inline photo result straight from a public URL."""
    kwargs = {"file": url, "text": caption or None, "buttons": buttons}
    if id:
        kwargs["id"] = id
    try:
        return await builder.photo(**kwargs)
    except TypeError:  # very old Telethon without `buttons` on photos
        kwargs.pop("buttons", None)
        return await builder.photo(**kwargs)


async def photo_from_file(builder, *, path: str, caption: str = "",
                          buttons=None, id: str | None = None):
    """Upload a local PNG to Telegraph, then return a photo result.

    Falls back to a text article with the caption if the CDN is unreachable.
    """
    url = await upload_file(path)
    if url:
        return await photo_from_url(builder, url=url, caption=caption,
                                    buttons=buttons, id=id)
    return await article(
        builder,
        title="📊 Result",
        text=caption or "Generated successfully (image CDN unavailable).",
        description="Image CDN unavailable — showing text instead.",
        buttons=buttons,
        id=id,
    )
