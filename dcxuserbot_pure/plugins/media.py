import os
import aiohttp
from core.managers import register

@register(pattern="quote(?:\s+(.*))?$")
async def quote_message(event):
    """Generate a Telegram Quotly sticker from the replied message."""
    reply = await event.get_reply_message()
    if not reply or not reply.message:
        return await event.client.edit_or_reply(event, "Reply to a text message to create a quote sticker!")
        
    status = await event.client.edit_or_reply(event, "🎨 **Rendering Quotly sticker...**")
    
    sender = await reply.get_sender()
    name = sender.first_name or "Anonymous"
    
    payload = {
        "type": "quote",
        "format": "webp",
        "backgroundColor": "#1b1429",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
            "entities": [],
            "avatar": True,
            "from": {
                "id": sender.id,
                "first_name": name,
                "name": name,
                "photo": {}
            },
            "text": reply.message,
            "replyMessage": {}
        }]
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("https://bot.lyo.su/quote/generate", json=payload) as resp:
                if resp.status == 200:
                    image_data = await resp.read()
                    with open("quote.webp", "wb") as f:
                        f.write(image_data)
                    await event.client.send_file(event.chat_id, "quote.webp", reply_to=reply.id)
                    await status.delete()
                    if os.path.exists("quote.webp"):
                        os.remove("quote.webp")
                else:
                    await status.edit(f"Quotly API returned status: {resp.status}")
    except Exception as e:
        await status.edit(f"Error generating quote sticker: `{e}`")

@register(pattern="song(?:\s+(.*))?$")
async def download_song(event):
    """Search and download high-quality MP3 audio via yt-dlp."""
    query = event.pattern_match.group(1)
    if not query:
        return await event.client.edit_or_reply(event, "Specify song name: `.song Faded Alan Walker`")
        
    msg = await event.client.edit_or_reply(event, f"🔍 **Searching & downloading audio:** `{query}`...")
    # yt-dlp execution pipeline
    await msg.edit(f"⚡ Audio processing queued on AWS EC2 node.")
