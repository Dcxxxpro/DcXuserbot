import JSZip from 'jszip';
import { UserbotFile, UserbotConfig } from '../types';

export async function exportUserbotZip(files: UserbotFile[], customConfig?: UserbotConfig): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('dcxuserbot') || zip;

  for (const file of files) {
    root.file(file.path, file.content);
  }

  // Pre-filled .env when the wizard collected credentials
  if (customConfig && customConfig.apiId) {
    const envContent = `# DcXuserbot v5 — pre-configured environment
API_ID=${customConfig.apiId}
API_HASH=${customConfig.apiHash}
STRING_SESSION=${customConfig.stringSession}
BOT_TOKEN=${customConfig.botToken}
BOT_USERNAME=${customConfig.botUsername || 'DcXAssistantBot'}
COMMAND_HAND_LER=${customConfig.commandHandler || '.'}
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=${customConfig.sudoUsers}
ALIVE_NAME=${customConfig.aliveName || 'DcX Master'}
GROQ_API_KEY=${customConfig.groqApiKey}
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=${customConfig.geminiApiKey}
GEMINI_MODEL=gemini-2.0-flash
PM_PERMIT=true
PM_LIMIT=4
LOG_LEVEL=INFO
`;
    root.file('.env', envContent);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'DcXuserbot-v5.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
