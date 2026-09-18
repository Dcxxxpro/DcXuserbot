# ⚡ DcXuserbot - Superior Telegram Userbot Suite (AWS EC2 Ready)

An ultra-modern, production-grade Telegram Userbot engineered with **Dual-Client Architecture** (Telethon User + Companion Assistant Bot) for native interactive inline buttons, categorized pagination, anti-PM spam shield, and 24/7 AWS EC2 cloud stability.

---

## 🌟 Key Architecture & Upgrades

1. **Dual-Client Engine (Like CatUserbot)**:
   - Uses your personal Telegram account session via Telethon.
   - Bridges with a companion `@BotFather` assistant bot to deliver **real inline keyboard buttons**, pagination menus, and callback queries directly into chats!

2. **AWS EC2 Native Deployment**:
   - Automated 2GB swap space generator (eliminates memory crashes on `t2.micro` and `t3.micro` Free Tier instances).
   - Preconfigured Systemd service with `Restart=always` for self-healing uptime.
   - Ready-to-go Docker & Docker Compose pipelines.

3. **Curated & Modernized Plugin Suite**:
   - **.alive**: Dynamic uptime, system RAM/CPU, AWS region, with interactive inline callback buttons.
   - **.help**: Categorized menu (Admin, Media, AI, Tools, Broadcast, PM, EC2) with page buttons.
   - **.pmpermit**: Intelligent anti-PM spam protection with inline approval requests and warning strikes.
   - **.ai**: Server-side Google Gemini 2.5 generative AI responses in any chat.
   - **.admin**: Full suite (`.ban`, `.mute`, `.kick`, `.purge`, `.pin`).
   - **.media**: `.quote` Quotly stickers, `.song` mp3 grabber, `.telegraph` image uploader.
   - **.ec2**: Monitor AWS instance health, CPU, swap, and reboot directly from Telegram.

---

## 🚀 Quick Deploy to AWS EC2 (5 Minutes)

### Step 1: Launch your AWS EC2 Instance
- **AMI:** Ubuntu 22.04 LTS or 24.04 LTS (x86_64)
- **Instance Type:** `t2.micro` or `t3.micro` (AWS Free Tier eligible)
- **Security Group:** Inbound SSH (Port 22) from your IP.

### Step 2: Connect & Run 1-Click Installer
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
git clone https://github.com/your-username/DcXuserbot.git
cd DcXuserbot
chmod +x setup_ec2.sh
./setup_ec2.sh
```

### Step 3: Configure Credentials in `.env`
```bash
nano .env
```
Fill in:
- `API_ID` & `API_HASH` (from https://my.telegram.org)
- `STRING_SESSION` (Telethon String Session)
- `BOT_TOKEN` & `BOT_USERNAME` (from @BotFather)

### Step 4: Start Systemd Service
```bash
sudo systemctl start dcxuserbot
sudo journalctl -u dcxuserbot -f
```

---

## 🔄 Automatic GitHub Updates via Telegram Command

Whenever you make changes or push updates to your GitHub repository, you don't even need to SSH into your EC2 instance. Simply send:

- **`.update`** (or **`!update`**): Checks your connected GitHub repository and displays the commit changelog.
- **`.update now`** (or click the inline button):
  1. Executes `git pull --rebase`
  2. Updates and installs any new dependencies from `requirements.txt`
  3. Restarts the `dcxuserbot` systemd daemon automatically.
  4. Returns back online within 5 seconds!
