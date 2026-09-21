import React, { useMemo, useState } from 'react';
import { Copy, Check, KeyRound, Bot, Cpu, Rocket, ChevronRight } from 'lucide-react';
import { UserbotConfig } from '../types';

interface DeployWizardProps {
  config: UserbotConfig;
  setConfig: React.Dispatch<React.SetStateAction<UserbotConfig>>;
}

type Target = 'docker' | 'systemd' | 'manual' | 'termux';

const TARGET_COMMANDS: Record<Target, string> = {
  docker: `git clone https://github.com/Dcxxxpro/DcXuserbot
cd DcXuserbot/dcxuserbot
cp sample_config.env .env   # paste your values into .env
docker compose up -d --build`,
  systemd: `pip install -r requirements.txt
cp sample_config.env .env   # fill values
sudo tee /etc/systemd/system/dcxuserbot.service >/dev/null <<'UNIT'
[Unit]
Description=DcXuserbot
After=network.target

[Service]
WorkingDirectory=$PWD
EnvironmentFile=$PWD/.env
ExecStart=/usr/bin/python3 -m dcx
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now dcxuserbot`,
  manual: `pip install -r requirements.txt
cp sample_config.env .env   # fill values
python -m dcx`,
  termux: `pkg install python ffmpeg libjpeg-turbo git
pip install -r requirements.txt
cp sample_config.env .env   # fill values
python -m dcx`,
};

const Field: React.FC<{
  id: string; label: string; value: string; placeholder?: string;
  secret?: boolean; mono?: boolean;
  onChange: (v: string) => void;
}> = ({ id, label, value, placeholder, secret, mono, onChange }) => (
  <label htmlFor={id} className="block space-y-1">
    <span className="text-[11px] font-medium text-slate-400">{label}</span>
    <input
      id={id}
      type={secret ? 'password' : 'text'}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60 ${mono ? 'font-mono' : ''}`}
    />
  </label>
);

export const DeployWizard: React.FC<DeployWizardProps> = ({ config, setConfig }) => {
  const [target, setTarget] = useState<Target>('docker');
  const [copied, setCopied] = useState<string | null>(null);

  const set = (key: keyof UserbotConfig) => (v: string) =>
    setConfig((prev) => ({ ...prev, [key]: v }));

  const envPreview = useMemo(
    () => `API_ID=${config.apiId || '12345678'}
API_HASH=${config.apiHash || 'your_api_hash'}
STRING_SESSION=${config.stringSession || 'python -m dcx.session_string → paste here'}
BOT_TOKEN=${config.botToken || '123456:ABC-from-botfather'}
BOT_USERNAME=${config.botUsername || 'DcXAssistantBot'}
COMMAND_HAND_LER=${config.commandHandler || '.'}
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=${config.sudoUsers}
ALIVE_NAME=${config.aliveName || 'DcX Master'}
GROQ_API_KEY=${config.groqApiKey}
GEMINI_API_KEY=${config.geminiApiKey}
PM_PERMIT=true
PM_LIMIT=4
LOG_LEVEL=INFO`,
    [config]
  );

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const CopyBtn: React.FC<{ id: string; text: string }> = ({ id, text }) => (
    <button
      onClick={() => copy(id, text)}
      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition"
    >
      {copied === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div id="deploy-wizard" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* LEFT — inputs */}
      <div className="space-y-4">
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-400" /> 1 · Telegram API credentials
          </h3>
          <p className="text-[11px] text-slate-500">
            Grab <code className="text-slate-300">API_ID</code> + <code className="text-slate-300">API_HASH</code> at my.telegram.org → API development tools.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field id="api-id" label="API_ID" value={config.apiId} placeholder="12345678" mono onChange={set('apiId')} />
            <Field id="api-hash" label="API_HASH" value={config.apiHash} placeholder="abcdef0123…" mono secret onChange={set('apiHash')} />
          </div>
          <Field id="session" label="STRING_SESSION (run: python -m dcx.session_string)" value={config.stringSession} placeholder="1BVtsO…" mono secret onChange={set('stringSession')} />
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" /> 2 · BotFather assistant — unlocks full inline mode
          </h3>
          <ol className="text-[11px] text-slate-500 space-y-1 list-decimal list-inside">
            <li>@BotFather → <code className="text-slate-300">/newbot</code></li>
            <li><code className="text-slate-300">/setinline</code> → pick your bot → e.g. <code className="text-slate-300">DcXuserbot inline</code></li>
            <li>Paste token + username here.</li>
          </ol>
          <div className="grid grid-cols-2 gap-3">
            <Field id="bot-token" label="BOT_TOKEN" value={config.botToken} placeholder="123456:ABC…" mono secret onChange={set('botToken')} />
            <Field id="bot-username" label="BOT_USERNAME" value={config.botUsername} placeholder="DcXAssistantBot" mono onChange={set('botUsername')} />
          </div>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" /> 3 · Personalization & AI
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field id="alive-name" label="ALIVE_NAME" value={config.aliveName} onChange={set('aliveName')} />
            <Field id="handler" label="COMMAND_HAND_LER" value={config.commandHandler} placeholder="." onChange={set('commandHandler')} />
            <Field id="sudo" label="SUDO_USERS (comma IDs)" value={config.sudoUsers} placeholder="111,222" mono onChange={set('sudoUsers')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="groq" label="GROQ_API_KEY (optional)" value={config.groqApiKey} mono secret onChange={set('groqApiKey')} />
            <Field id="gemini" label="GEMINI_API_KEY (optional)" value={config.geminiApiKey} mono secret onChange={set('geminiApiKey')} />
          </div>
        </section>
      </div>

      {/* RIGHT — env preview + deploy targets */}
      <div className="space-y-4">
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">.env preview</h3>
          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
{envPreview}
            </pre>
            <CopyBtn id="env" text={envPreview} />
          </div>
          <p className="text-[11px] text-slate-500">
            The exported ZIP already includes this as <code className="text-slate-300">.env</code> when API_ID is filled.
          </p>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-400" /> 4 · Pick your host — identical output everywhere
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['docker', 'systemd', 'manual', 'termux'] as Target[]).map((t) => (
              <button
                key={t}
                id={`target-${t}`}
                onClick={() => setTarget(t)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 ${
                  target === t
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700/70 hover:text-slate-200'
                }`}
              >
                {t === 'docker' && 'Docker'}
                {t === 'systemd' && 'systemd'}
                {t === 'manual' && 'Manual'}
                {t === 'termux' && 'Termux'}
                <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre max-h-80">
{TARGET_COMMANDS[target]}
            </pre>
            <CopyBtn id="cmds" text={TARGET_COMMANDS[target]} />
          </div>
          <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
            <li><b>`.sysinfo`</b> reads the real host: distro, CPU model/cores, RAM, disks, uptime → PNG dashboard.</li>
            <li><b>`.speedtest`</b> uses Cloudflare edge over HTTPS — no extra binaries, works behind any NAT.</li>
            <li>Use <code className="text-slate-300">--restart unless-stopped</code> (Docker) or <code className="text-slate-300">Restart=always</code> (systemd) so <code className="text-slate-300">.restart</code> works.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
