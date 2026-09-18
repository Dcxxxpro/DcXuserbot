#!/usr/bin/env bash
# ==============================================================================
# DcXuserbot - AWS EC2 Automated 1-Click Provisioning Script
# Sets up swap space (crucial for t2.micro / t3.micro), installs Python 3.11,
# ffmpeg, builds dependencies, and configures an auto-restarting systemd daemon.
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 DcXuserbot AWS EC2 Automated Deployment Initiated"
echo "=========================================================="

# 1. Elevate & Update Packages
sudo apt-get update -y || sudo yum update -y
sudo apt-get install -y git curl wget python3 python3-pip python3-venv ffmpeg libmagic-dev build-essential || true

# 2. Configure 2GB Swap Space (Prevents t2.micro/t3.micro out-of-memory crashes)
if [ ! -f /swapfile ]; then
    echo ">>> Allocating 2GB Swap memory for AWS EC2 instance..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo ">>> Swap enabled successfully."
fi

# 3. Setup Virtual Environment
echo ">>> Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Wheel and Requirements
echo ">>> Installing optimized Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 5. Check Configuration
if [ ! -f .env ]; then
    if [ -f sample_config.env ]; then
        cp sample_config.env .env
        echo ">>> Created .env from sample_config.env. Please fill in your API_ID and STRING_SESSION!"
    fi
fi

# 6. Configure Systemd Auto-Restart Service
echo ">>> Installing Systemd Service for 24/7 background operation..."
CURRENT_DIR=$(pwd)
CURRENT_USER=$(whoami)

sudo tee /etc/systemd/system/dcxuserbot.service > /dev/null <<EOF
[Unit]
Description=DcXuserbot Telegram Userbot Daemon (AWS EC2)
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${CURRENT_DIR}
ExecStart=${CURRENT_DIR}/venv/bin/python3 ${CURRENT_DIR}/main.py
Restart=always
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable dcxuserbot

echo "=========================================================="
echo "✅ DcXuserbot AWS EC2 Deployment Complete!"
echo "=========================================================="
echo "Commands to manage your userbot:"
echo "• Start bot:     sudo systemctl start dcxuserbot"
echo "• Stop bot:      sudo systemctl stop dcxuserbot"
echo "• Check logs:    sudo journalctl -u dcxuserbot -f"
echo "• Check status:  sudo systemctl status dcxuserbot"
echo "=========================================================="
