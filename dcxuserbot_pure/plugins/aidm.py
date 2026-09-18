"""
Groq AI Intelligence Suite: .aidm and .ai
Target Model: openai/gpt-oss-120b (Ultra-fast latency via AsyncGroq)
Safely inspects user profile (First Name, Bio, Username) via GetFullUserRequest
with thorough fallback handling for missing fields and Telegram privacy restrictions.
"""

import logging
import traceback
from groq import AsyncGroq
from telethon.tl.functions.users import GetFullUserRequest
from core.managers import register
from config import Config

LOGS = logging.getLogger("DcXuserbot.AIDM")

def get_groq_client():
    if not Config.GROQ_API_KEY:
        return None
    return AsyncGroq(api_key=Config.GROQ_API_KEY)

@register(pattern="aidm(?:\s+(.*))?$")
async def ai_direct_message_scan(event):
    """Scan a user's Telegram profile (Bio, Name, Username) and generate an AI reply via Groq openai/gpt-oss-120b."""
    prompt_input = (event.pattern_match.group(1) or "").strip()
    status_msg = await event.client.edit_or_reply(event, "🔍 **Scanning user profile context & contacting Groq AI...**")
    
    try:
        # 1. Check API Key
        client = get_groq_client()
        if not client:
            return await status_msg.edit(
                "⚠️ **GROQ_API_KEY Missing!**\n"
                "Please add `GROQ_API_KEY=gsk_...` to your `.env` file to activate ultra-fast Groq AI models."
            )

        # 2. Determine target user (replied message or sender of private chat)
        reply = await event.get_reply_message()
        target_entity = None
        
        if reply:
            target_entity = await reply.get_sender()
        elif event.is_private:
            target_entity = await event.get_chat()
        else:
            target_entity = await event.get_sender()

        if not target_entity:
            return await status_msg.edit("❌ **Could not resolve user profile.** Reply to a user or use inside private chat.")

        # 3. Safely query user full profile with GetFullUserRequest
        user_first_name = getattr(target_entity, "first_name", "Unknown") or "Unknown"
        user_last_name = getattr(target_entity, "last_name", "") or ""
        user_full_name = f"{user_first_name} {user_last_name}".strip()
        user_handle = f"@{target_entity.username}" if getattr(target_entity, "username", None) else "None"
        user_id = target_entity.id
        
        bio = "None"
        try:
            full_user_obj = await event.client(GetFullUserRequest(user_id))
            if full_user_obj and hasattr(full_user_obj, "full_user") and full_user_obj.full_user.about:
                bio = full_user_obj.full_user.about.strip()
        except Exception as bio_err:
            LOGS.debug(f"Could not retrieve bio for {user_id} due to privacy/type: {bio_err}")

        # 4. Craft contextual system and user prompts
        system_instruction = (
            "You are an elite, highly intelligent Telegram AI Assistant running inside DcXuserbot on AWS EC2. "
            "You provide sharp, charismatic, concise, and helpful answers formatted with Telegram markdown. "
            "Never hallucinate facts. Be polite and context-aware."
        )

        user_context_block = (
            f"[User Profile Context]\n"
            f"• Name: {user_full_name}\n"
            f"• Username: {user_handle}\n"
            f"• Telegram ID: {user_id}\n"
            f"• Bio/About: {bio}\n\n"
        )
        
        actual_query = prompt_input or (reply.text if reply and reply.text else "Introduce yourself, analyze my profile, and offer assistance.")
        full_content = user_context_block + f"User Query/Message: {actual_query}"

        # 5. Call Groq with target model: openai/gpt-oss-120b (with automatic fallback to llama-3.3-70b-versatile)
        target_model = "openai/gpt-oss-120b"
        try:
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": full_content}
                ],
                model=target_model,
                temperature=0.7,
                max_tokens=1024,
            )
            ai_reply = chat_completion.choices[0].message.content
        except Exception as model_err:
            LOGS.warning(f"Groq {target_model} error: {model_err}. Falling back to llama-3.3-70b-versatile...")
            target_model = "llama-3.3-70b-versatile"
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": full_content}
                ],
                model=target_model,
                temperature=0.7,
                max_tokens=1024,
            )
            ai_reply = chat_completion.choices[0].message.content

        # 6. Format final response
        formatted_output = (
            f"⚡ **Groq AI Intelligence** (`{target_model}`)\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"👤 **Analyzed User:** [{user_full_name}](tg://user?id={user_id}) ({user_handle})\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{ai_reply}"
        )
        await status_msg.edit(formatted_output)

    except Exception as exc:
        LOGS.error(f"AIDM error: {exc}\n{traceback.format_exc()}")
        await status_msg.edit(f"❌ **AIDM Error:** `{type(exc).__name__}: {str(exc)}`")
