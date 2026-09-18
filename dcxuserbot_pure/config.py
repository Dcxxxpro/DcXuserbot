import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Telegram API credentials from https://my.telegram.org
    API_ID = int(os.getenv("API_ID", "0"))
    API_HASH = os.getenv("API_HASH", "")
    
    # User String Session (Telethon Session string)
    STRING_SESSION = os.getenv("STRING_SESSION", "")
    
    # Companion Assistant Bot Token (From @BotFather) for Inline Buttons
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")
    BOT_USERNAME = os.getenv("BOT_USERNAME", "").replace("@", "")
    
    # Command Handler Prefix (Default: .)
    COMMAND_HAND_LER = os.getenv("COMMAND_HAND_LER", ".")
    SUDO_COMMAND_HAND_LER = os.getenv("SUDO_COMMAND_HAND_LER", "!")
    
    # Authorized Sudo Users (Comma separated IDs: "1234567,9876543")
    SUDO_USERS = [
        int(x.strip()) 
        for x in os.getenv("SUDO_USERS", "").split(",") 
        if x.strip().isdigit()
    ]
    
    # Custom Alive & Help Media Profile
    ALIVE_NAME = os.getenv("ALIVE_NAME", "DcX Master")
    ALIVE_MEDIA = os.getenv("ALIVE_MEDIA", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200")
    HELP_PIC = os.getenv("HELP_PIC", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200")
    
    # AI Engine API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Anti-PM Spam Configuration
    PM_PERMIT = os.getenv("PM_PERMIT", "True").lower() in ("true", "1", "yes")
    PM_LIMIT = int(os.getenv("PM_LIMIT", "4"))
    
    # AWS EC2 Cloud Settings
    AWS_INSTANCE_ID = os.getenv("AWS_INSTANCE_ID", "i-ec2-dcxuserbot")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
