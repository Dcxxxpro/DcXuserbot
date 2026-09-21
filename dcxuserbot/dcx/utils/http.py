"""One shared, lazily-created aiohttp session for the whole bot.

A fresh session is created per event loop and recreated automatically if a
plugin somehow closes it. Keep timeouts explicit at call sites.
"""

from __future__ import annotations

import asyncio
from typing import Any

import aiohttp

_session: aiohttp.ClientSession | None = None

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) DcXuserbot/5.0 "
        "(+https://github.com/Dcxxxpro/DcXuserbot)"
    )
}


def http_session() -> aiohttp.ClientSession:
    global _session
    if _session is not None and _session.closed:
        _session = None
    if _session is None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:  # pragma: no cover - safety net
            loop = asyncio.get_event_loop()
        timeout = aiohttp.ClientTimeout(total=30, connect=8, sock_read=20)
        _session = aiohttp.ClientSession(
            headers=_DEFAULT_HEADERS, timeout=timeout, loop=loop
        )
    return _session


async def get_json(url: str, *, params: dict | None = None,
                   headers: dict | None = None, timeout: float = 15) -> Any:
    async with http_session().get(
        url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)
    ) as resp:
        resp.raise_for_status()
        return await resp.json(content_type=None)


async def get_text(url: str, *, params: dict | None = None,
                   timeout: float = 15) -> str:
    async with http_session().get(
        url, params=params, timeout=aiohttp.ClientTimeout(total=timeout)
    ) as resp:
        resp.raise_for_status()
        return await resp.text()


async def get_bytes(url: str, *, timeout: float = 30, max_size: int = 25 * 1024 * 1024) -> bytes:
    async with http_session().get(
        url, timeout=aiohttp.ClientTimeout(total=timeout)
    ) as resp:
        resp.raise_for_status()
        buf = bytearray()
        async for chunk in resp.content.iter_chunked(64 * 1024):
            buf.extend(chunk)
            if len(buf) > max_size:
                raise ValueError(f"Remote file larger than {max_size} bytes")
        return bytes(buf)


async def post_json(url: str, payload: dict, *, headers: dict | None = None,
                    timeout: float = 60) -> Any:
    async with http_session().post(
        url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=timeout)
    ) as resp:
        text = await resp.text()
        resp.raise_for_status()
        return __import__("json").loads(text)


async def close_http() -> None:
    global _session
    if _session is not None and not _session.closed:
        await _session.close()
    _session = None
