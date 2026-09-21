"""Dependency-free, host-agnostic network speed benchmark.

Uses Cloudflare's public speed endpoints over HTTPS — no CLI tools, no
extra packages, works identically on any VPS/cloud/container. All probes
are time-boxed so results always land inside Telegram's inline-query
deadline when the ``quick`` profile is used.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field

import aiohttp

from dcx.utils.http import http_session

_CF = "https://speed.cloudflare.com"
_FALLBACK_DOWN = "https://proof.ovh.net/files/10Mb.dat"


@dataclass
class SpeedResult:
    download_mbps: float | None = None
    upload_mbps: float | None = None
    ping_ms: float | None = None
    jitter_ms: float | None = None
    download_bytes: int = 0
    upload_bytes: int = 0
    server: str = "Cloudflare Edge (anycast)"
    isp: str = "N/A"
    ip: str = "N/A"
    location: str = "N/A"
    quick: bool = False
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.download_mbps is not None or self.upload_mbps is not None


async def _latency(session: aiohttp.ClientSession, tries: int = 4,
                   timeout: float = 2.5) -> tuple[list[float], float]:
    rtts: list[float] = []

    async def probe() -> None:
        start = time.perf_counter()
        try:
            async with session.get(
                f"{_CF}/__down", params={"bytes": "1"},
                timeout=aiohttp.ClientTimeout(total=timeout),
            ) as resp:
                await resp.read()
            rtts.append((time.perf_counter() - start) * 1000)
        except Exception:
            pass

    await asyncio.gather(*[probe() for _ in range(max(1, tries))])
    if not rtts:
        return [], 0.0
    best = min(rtts)
    jitter = (max(rtts) - min(rtts)) if len(rtts) > 1 else 0.0
    return sorted(rtts), round(jitter, 1) if len(rtts) > 1 else 0.0


async def _download(session: aiohttp.ClientSession, budget: float,
                    size: int) -> tuple[int, float, str | None]:
    for url in (f"{_CF}/__down?bytes={size}", _FALLBACK_DOWN):
        start = time.perf_counter()
        got = 0
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=budget + 3)) as resp:
                resp.raise_for_status()
                async for chunk in resp.content.iter_chunked(64 * 1024):
                    got += len(chunk)
                    if time.perf_counter() - start >= budget:
                        break
            elapsed = max(time.perf_counter() - start, 1e-4)
            return got, elapsed, None
        except Exception as exc:
            err = f"{type(exc).__name__}"
            continue
    return 0, 0.0, err if "err" in dir() else "unreachable"


async def _upload(session: aiohttp.ClientSession, budget: float,
                  size: int) -> tuple[int, float, str | None]:
    payload = b"0" * size
    start = time.perf_counter()
    try:
        async with session.post(
            f"{_CF}/__up", data=payload,
            timeout=aiohttp.ClientTimeout(total=budget + 3),
            headers={"Content-Type": "application/octet-stream"},
        ) as resp:
            await resp.read()
        elapsed = max(time.perf_counter() - start, 1e-4)
        return size, elapsed, None
    except Exception as exc:
        return 0, 0.0, type(exc).__name__


async def _net_identity() -> tuple[str, str, str]:
    from dcx.utils.http import get_json

    for url, build in (
        ("http://ip-api.com/json/?fields=status,query,isp,city,countryCode",
         lambda d: (d.get("query", "N/A"), f"{d.get('city', '?')}, {d.get('countryCode', '?')}",
                    d.get("isp", "N/A"))),
        ("https://ipinfo.io/json",
         lambda d: (d.get("ip", "N/A"), f"{d.get('city', '?')}, {d.get('country', '?')}",
                    d.get("org", "N/A"))),
    ):
        try:
            data = await get_json(url, timeout=4)
            return build(data)
        except Exception:
            continue
    return "N/A", "N/A", "N/A"


async def run_speedtest(quick: bool = False,
                        on_stage=None) -> SpeedResult:
    """Run the benchmark.

    ``quick=True`` uses tighter budgets (~6 s) designed for inline queries;
    the full profile (~15 s) is for chat commands. ``on_stage`` is an
    optional async callback receiving stage labels for progress edits.
    """
    result = SpeedResult(quick=quick)
    session = http_session()

    async def stage(name: str) -> None:
        if on_stage:
            try:
                await on_stage(name)
            except Exception:
                pass

    if quick:
        dl_budget, dl_size = 3.2, 15 * 1024 * 1024
        ul_budget, ul_size = 2.6, 4 * 1024 * 1024
        tries = 3
    else:
        dl_budget, dl_size = 8.0, 40 * 1024 * 1024
        ul_budget, ul_size = 7.0, 12 * 1024 * 1024
        tries = 5

    await stage("📡 Measuring latency & jitter…")
    rtts, jitter = await _latency(session, tries=tries)
    if rtts:
        result.ping_ms = round(sum(rtts) / len(rtts), 1)
        result.jitter_ms = jitter

    await stage("⬇️ Testing download throughput…")
    dl_bytes, dl_secs, dl_err = await _download(session, dl_budget, dl_size)
    if dl_bytes and dl_secs:
        result.download_bytes = dl_bytes
        result.download_mbps = round(dl_bytes * 8 / dl_secs / 1e6, 2)
    elif dl_err:
        result.errors.append(f"download: {dl_err}")

    await stage("⬆️ Testing upload throughput…")
    ul_bytes, ul_secs, ul_err = await _upload(session, ul_budget, ul_size)
    if ul_bytes and ul_secs:
        result.upload_bytes = ul_bytes
        result.upload_mbps = round(ul_bytes * 8 / ul_secs / 1e6, 2)
    elif ul_err:
        result.errors.append(f"upload: {ul_err}")

    await stage("🌍 Resolving network identity…")
    result.ip, result.location, result.isp = await _net_identity()
    return result
