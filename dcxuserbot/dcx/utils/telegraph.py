"""Telegraph (telegra.ph) CDN upload — gives any local image a public URL.

Inline-mode photo results need a URL, so generated cards (speedtest,
sysinfo…) are pushed here first. A small in-memory cache keeps us fast.
"""

from __future__ import annotations

import hashlib
import os
import time

import aiohttp

from dcx.utils.http import http_session

_UPLOAD_EP = "https://telegra.ph/upload"
_CACHE: dict[str, tuple[float, str]] = {}


def _key(path: str) -> str:
    stat = os.stat(path)
    raw = f"{path}:{stat.st_size}:{stat.st_mtime}".encode()
    return hashlib.sha1(raw).hexdigest()


async def upload_file(path: str, *, ttl: float = 900) -> str | None:
    """Upload *path* to telegra.ph and return its public URL (or None)."""
    try:
        digest = _key(path)
    except OSError:
        return None

    cached = _CACHE.get(digest)
    if cached and (time.time() - cached[0]) < ttl:
        return cached[1]

    try:
        ext = os.path.splitext(path)[1].lstrip(".") or "png"
        mime = "image/png" if ext == "png" else f"image/{ext}"
        with open(path, "rb") as fh:
            data = fh.read()
        form = aiohttp.FormData()
        form.add_field("file", data, filename=f"dcx.{ext}", content_type=mime)
        async with http_session().post(
            _UPLOAD_EP, data=form, timeout=aiohttp.ClientTimeout(total=20)
        ) as resp:
            payload = await resp.json(content_type=None)
        if isinstance(payload, list) and payload and payload[0].get("src"):
            url = "https://telegra.ph" + payload[0]["src"]
            _CACHE[digest] = (time.time(), url)
            return url
    except Exception:
        return None
    return None
