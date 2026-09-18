import React, { useState } from 'react';
import { Server, Copy, Check, ShieldCheck, Terminal, ExternalLink, Cpu, HardDrive } from 'lucide-react';
import { UserbotConfig } from '../types';

interface DeployWizardProps {
  config: UserbotConfig;
  setConfig: React.Dispatch<React.SetStateAction<UserbotConfig>>;
}

export const DeployWizard: React.FC<DeployWizardProps> = ({ config, setConfig }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedUserData, setCopiedUserData] = useState(false);
  const [copiedSshCmd, setCopiedSshCmd] = useState(false);

  const handleChange = (field: keyof UserbotConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const generatedEnv = `# ==========================================================
# DcXuserbot - AWS EC2 Environment Configuration
# ==========================================================
API_ID=${config.apiId || '1234567'}
API_HASH=${config.apiHash || 'abcdef0123456789abcdef0123456789'}
STRING_SESSION=${config.stringSession || '1BVtsO...YourTelethonStringSessionHere...'}
BOT_TOKEN=${config.botToken || '7123456789:AAH...YourBotFatherTokenHere...'}
BOT_USERNAME=${config.botUsername || 'DcXAssistantBot'}
COMMAND_HAND_LER=${config.commandHandler || '.'}
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=${config.sudoUsers || ''}
ALIVE_NAME=${config.aliveName || 'DcX Commander'}
ALIVE_MEDIA=https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200
GEMINI_API_KEY=${config.geminiApiKey || ''}
PM_PERMIT=True
PM_LIMIT=4
AWS_REGION=${config.awsRegion || 'us-east-1'}
AWS_INSTANCE_ID=i-ec2-dcxuserbot
`;

  const userDataScript = `#!/bin/bash
# AWS EC2 User Data (Cloud-Init) Bootstrap
# Automatically runs on first boot of Ubuntu 22.04/24.04
set -e

apt-get update -y
apt-get install -y git curl python3 python3-pip python3-venv ffmpeg

# 2GB Swap setup for t2.micro stability
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Clone repository
cd /home/ubuntu
git clone https://github.com/DcXuserbot/Userbot.git dcxuserbot || true
cd dcxuserbot

# Write configured .env
cat << 'EOF' > .env
${generatedEnv}
EOF

chmod +x setup_ec2.sh
./setup_ec2.sh
systemctl start dcxuserbot
`;

  const sshQuickCommands = `# 1. Connect to your AWS EC2 instance
ssh -i "your-key.pem" ubuntu@your-instance-ip

# 2. Clone & Enter Directory
git clone https://github.com/DcXuserbot/Userbot.git
cd Userbot

# 3. Save your credentials into .env
nano .env

# 4. Run automated provisioning (allocates 2GB swap, installs ffmpeg & systemd)
chmod +x setup_ec2.sh
./setup_ec2.sh

# 5. Start and watch 24/7 background logs
sudo systemctl start dcxuserbot
sudo journalctl -u dcxuserbot -f
`;

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div id="deploy-wizard-container" className="max-w-6xl mx-auto space-y-8">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Server className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-slate-100">
                AWS EC2 Production Deployment Wizard
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Configure your credentials once. This wizard generates your live production{' '}
              <code className="text-sky-400 font-mono">.env</code>, AWS EC2 Cloud-Init launch script,
              and step-by-step verified terminal instructions.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <Cpu className="w-4 h-4 text-sky-400" />
            <div className="text-[11px] font-mono text-slate-300">
              Target: <span className="text-emerald-400 font-bold">t2.micro / t3.micro</span> (Free Tier)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                1. Telegram Core Credentials
              </h3>
              <a
                href="https://my.telegram.org"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
              >
                my.telegram.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  API_ID (Telegram App ID)
                </label>
                <input
                  id="input-api-id"
                  type="text"
                  placeholder="e.g. 24891234"
                  value={config.apiId}
                  onChange={(e) => handleChange('apiId', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  API_HASH (Telegram App Secret)
                </label>
                <input
                  id="input-api-hash"
                  type="text"
                  placeholder="e.g. 7f8a3c89b9e23..."
                  value={config.apiHash}
                  onChange={(e) => handleChange('apiHash', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                STRING_SESSION (Telethon Userbot Session)
              </label>
              <input
                id="input-string-session"
                type="password"
                placeholder="1BVtsO..."
                value={config.stringSession}
                onChange={(e) => handleChange('stringSession', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Generated via Telethon StringSession. Kept strictly local inside your .env on AWS EC2.
              </p>
            </div>
          </div>

          {/* CatUserbot Dual-Client: Assistant Bot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="text-amber-400">🤖</span>
                2. Companion Bot for Inline Buttons (CatUserbot Model)
              </h3>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
              >
                @BotFather <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  BOT_TOKEN (From @BotFather)
                </label>
                <input
                  id="input-bot-token"
                  type="password"
                  placeholder="7123456789:AAH..."
                  value={config.botToken}
                  onChange={(e) => handleChange('botToken', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  BOT_USERNAME
                </label>
                <input
                  id="input-bot-username"
                  type="text"
                  placeholder="DcXAssistantBot"
                  value={config.botUsername}
                  onChange={(e) => handleChange('botUsername', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
              💡 <strong>Why is this required?</strong> Telegram User accounts cannot natively attach inline keyboard buttons to messages. By pairing a lightweight companion bot token, your userbot seamlessly routes inline queries to display clickable buttons (just like CatUserbot).
            </p>
          </div>

          {/* Preferences & Cloud Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-3">
              3. Personalization & AWS Region
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Command Prefix
                </label>
                <input
                  id="input-command-handler"
                  type="text"
                  value={config.commandHandler}
                  onChange={(e) => handleChange('commandHandler', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Alive Master Name
                </label>
                <input
                  id="input-alive-name"
                  type="text"
                  value={config.aliveName}
                  onChange={(e) => handleChange('aliveName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  AWS Region
                </label>
                <select
                  value={config.awsRegion}
                  onChange={(e) => handleChange('awsRegion', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia - Lowest Ping)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland - Close to Telegram DC4)</option>
                  <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                  <option value="ap-south-1">ap-south-1 (Mumbai - Close to Telegram DC5)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Gemini API Key (Optional AI)
                </label>
                <input
                  id="input-gemini-key"
                  type="password"
                  placeholder="AIzaSy..."
                  value={config.geminiApiKey}
                  onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated .env & Launch Scripts */}
        <div className="lg:col-span-6 space-y-5">
          {/* Live .env preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Live Generated .env
              </span>
              <button
                id="copy-generated-env-btn"
                onClick={() => copyToClipboard(generatedEnv, setCopiedEnv)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">Copy .env</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 max-h-56 overflow-y-auto font-mono text-[11px] text-sky-300/90 leading-relaxed whitespace-pre">
              {generatedEnv}
            </div>
          </div>

          {/* SSH Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                AWS EC2 SSH Terminal Commands
              </span>
              <button
                id="copy-ssh-cmd-btn"
                onClick={() => copyToClipboard(sshQuickCommands, setCopiedSshCmd)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                {copiedSshCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 max-h-56 overflow-y-auto font-mono text-[11px] text-emerald-300/90 leading-relaxed whitespace-pre">
              {sshQuickCommands}
            </div>
          </div>

          {/* Cloud-Init User Data script */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                AWS EC2 Launch Wizard "User Data" Script
              </span>
              <button
                id="copy-user-data-btn"
                onClick={() => copyToClipboard(userDataScript, setCopiedUserData)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                {copiedUserData ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">Copy User Data</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 max-h-52 overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre">
              {userDataScript}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
