from core.managers import register
from config import Config

@register(pattern="ai(?:\s+(.*))?$")
async def gemini_ai(event):
    """Query Google Gemini AI directly inside any Telegram conversation."""
    prompt = event.pattern_match.group(1)
    reply = await event.get_reply_message()
    
    if not prompt and reply and reply.message:
        prompt = reply.message
        
    if not prompt:
        return await event.client.edit_or_reply(event, "Provide a prompt: `.ai Explain quantum computing in 2 sentences`")
        
    if not Config.GEMINI_API_KEY:
        return await event.client.edit_or_reply(event, "⚠️ `GEMINI_API_KEY` not set in config!")
        
    status = await event.client.edit_or_reply(event, "🧠 **Gemini is thinking...**")
    
    try:
        from google import genai
        client = genai.Client(api_key=Config.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        answer = response.text or "No response received."
        formatted = f"🧠 **Gemini AI:**\n━━━━━━━━━━━━━━━━━━━━━━\n{answer}"
        await status.edit(formatted)
    except Exception as e:
        await status.edit(f"Gemini AI error: `{e}`")
