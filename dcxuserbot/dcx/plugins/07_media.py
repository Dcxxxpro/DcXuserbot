"""Media module — songs, videos, text-to-speech, Telegraph uploads."""

from __future__ import annotations

import asyncio
import os
import shutil

from dcx.config import Config
from dcx.core.helpers import replied_text
from dcx.core.registry import dcx_cmd
from dcx.utils.format import humanbytes, time_formatter, truncate
from dcx.utils.telegraph import upload_file

_CATEGORY = "Media"


def _ytdlp():
    try:
        import yt_dlp

        return yt_dlp
    except ImportError:
        return None


@dcx_cmd("song", category=_CATEGORY, desc="Grab audio from YouTube by name/URL.",
         usage=".song <name or url>")
async def song_cmd(event, args):
    query = args.strip()
    if not query:
        await event.client.edit_or_reply(event, "🎵 Usage: `.song <name or url>`")
        return
    yt_dlp = _ytdlp()
    if yt_dlp is None:
        await event.client.edit_or_reply(event, "🎵 `yt-dlp` is not installed on this host.")
        return
    status = await event.client.edit_or_reply(event, f"🎵 Searching: **{truncate(query, 60)}**…")

    target = query if query.startswith(("http://", "https://")) else f"ytsearch1:{query}"
    out_dir = Config.downloads_dir()
    options = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": os.path.join(out_dir, "dcx_%(title).60s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "match_filter": yt_dlp.utils.match_filter_func("duration < 900"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }] if shutil.which("ffmpeg") else [],
    }

    def _grab():
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(target, download=True)
            if "entries" in info:
                info = info["entries"][0]
            path = ydl.prepare_filename(info)
            if shutil.which("ffmpeg"):
                path = os.path.splitext(path)[0] + ".mp3"
            return info, path

    try:
        info, path = await asyncio.get_running_loop().run_in_executor(None, _grab)
    except Exception as exc:
        await status.edit(f"🎵 Download failed: `{truncate(str(exc), 200)}`", parse_mode="md")
        return
    if not os.path.exists(path):
        await status.edit("🎵 Conversion failed on this host.", parse_mode="md")
        return
    try:
        await status.edit("🎵 Uploading…", parse_mode="md")
        await event.client.send_file(
            event.chat_id, path,
            caption=(f"🎵 **{truncate(info.get('title', 'track'), 100)}**\n"
                     f"⏱ {time_formatter(info.get('duration', 0))} • "
                     f"{humanbytes(os.path.getsize(path))}"),
            reply_to=event.reply_to_msg_id,
        )
        await status.delete()
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


@dcx_cmd("video", category=_CATEGORY, desc="Grab a video (≤720p) from YouTube/others.",
         usage=".video <name or url>")
async def video_cmd(event, args):
    query = args.strip()
    if not query:
        await event.client.edit_or_reply(event, "🎬 Usage: `.video <name or url>`")
        return
    yt_dlp = _ytdlp()
    if yt_dlp is None:
        await event.client.edit_or_reply(event, "🎬 `yt-dlp` is not installed on this host.")
        return
    status = await event.client.edit_or_reply(event, f"🎬 Searching: **{truncate(query, 60)}**…")

    target = query if query.startswith(("http://", "https://")) else f"ytsearch1:{query}"
    out_dir = Config.downloads_dir()
    options = {
        "format": "best[ext=mp4][height<=720]/best[height<=720]/best",
        "outtmpl": os.path.join(out_dir, "dcx_vid_%(title).60s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "match_filter": yt_dlp.utils.match_filter_func("duration < 1200"),
    }

    def _grab():
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(target, download=True)
            if "entries" in info:
                info = info["entries"][0]
            return info, ydl.prepare_filename(info)

    try:
        info, path = await asyncio.get_running_loop().run_in_executor(None, _grab)
    except Exception as exc:
        await status.edit(f"🎬 Download failed: `{truncate(str(exc), 200)}`", parse_mode="md")
        return
    if not os.path.exists(path):
        await status.edit("🎬 Download failed (no file).", parse_mode="md")
        return
    if os.path.getsize(path) > 500 * 1024 * 1024:
        await status.edit("🎬 File too big (>500MB).", parse_mode="md")
        os.remove(path)
        return
    try:
        await status.edit("🎬 Uploading…", parse_mode="md")
        await event.client.send_file(
            event.chat_id, path,
            caption=(f"🎬 **{truncate(info.get('title', 'video'), 100)}**\n"
                     f"⏱ {time_formatter(info.get('duration', 0))} • "
                     f"{humanbytes(os.path.getsize(path))}"),
            reply_to=event.reply_to_msg_id,
            supports_streaming=True,
        )
        await status.delete()
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


@dcx_cmd("tts", category=_CATEGORY,
         desc="Text to speech. `.tts hi <text>` sets the voice language.",
         usage=".tts [lang] <text>")
async def tts_cmd(event, args):
    lang, text_arg = "en", args
    tokens = args.split(maxsplit=1)
    if len(tokens) == 2 and tokens[0].isalpha() and 2 <= len(tokens[0]) <= 5:
        lang, text_arg = tokens[0].lower(), tokens[1]
    text = await replied_text(event, text_arg)
    if not text:
        await event.client.edit_or_reply(event, "🔊 Usage: `.tts [lang] <text>` or reply.")
        return
    try:
        from gtts import gTTS
    except ImportError:
        await event.client.edit_or_reply(event, "🔊 `gTTS` is not installed on this host.")
        return
    out_path = os.path.join(Config.cache_dir(), f"dcx_tts_{event.id}.mp3")
    try:
        await asyncio.get_running_loop().run_in_executor(
            None, lambda: gTTS(text=text[:500], lang=lang).save(out_path))
        await event.client.send_file(
            event.chat_id, out_path,
            caption=f"🔊 TTS ({lang}): `{truncate(text, 80)}`",
            reply_to=event.reply_to_msg_id,
        )
        await event.delete()
    except Exception as exc:
        await event.client.edit_or_reply(event, f"🔊 Failed: `{truncate(str(exc), 150)}`")
    finally:
        try:
            os.remove(out_path)
        except OSError:
            pass


@dcx_cmd("telegraph", category=_CATEGORY,
         desc="Upload replied media (≤8MB) to Telegraph CDN.", aliases=("tgmedia",))
async def telegraph_cmd(event, args):
    reply = await event.get_reply_message() if event.is_reply else None
    if not reply or not reply.media:
        await event.client.edit_or_reply(event, "🖼 Reply to a photo/video/sticker/document.")
        return
    status = await event.client.edit_or_reply(event, "🖼 Uploading to Telegraph…")
    path = await event.client.download_media(reply, file=Config.cache_dir())
    if not path:
        await status.edit("🖼 Download failed.", parse_mode="md")
        return
    try:
        if os.path.getsize(path) > 8 * 1024 * 1024:
            await status.edit("🖼 Media is larger than Telegraph's 8MB limit.", parse_mode="md")
            return
        url = await upload_file(path, ttl=0)
        if url:
            await status.edit(f"🖼 **Telegraph link:** {url}", parse_mode="md")
        else:
            await status.edit("🖼 Telegraph is unreachable right now.", parse_mode="md")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
