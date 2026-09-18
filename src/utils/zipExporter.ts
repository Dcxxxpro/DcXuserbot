import JSZip from 'jszip';
import { UserbotFile, UserbotConfig } from '../types';

export async function exportUserbotZip(files: UserbotFile[], customConfig?: UserbotConfig): Promise<void> {
  const zip = new JSZip();

  // Create folder structure inside zip
  const root = zip.folder('DcXuserbot') || zip;

  for (const file of files) {
    let content = file.content;

    // If custom config is provided and this is sample_config.env or config.py, inject user's values
    if (file.path === 'sample_config.env' && customConfig) {
      content = `# ==========================================================
# DcXuserbot - Custom Configured for AWS EC2 Deployment
# ==========================================================

API_ID=${customConfig.apiId || '1234567'}
API_HASH=${customConfig.apiHash || 'abcdef0123456789abcdef0123456789'}
STRING_SESSION=${customConfig.stringSession || '1BVtsO...YourTelethonStringSessionHere...'}
BOT_TOKEN=${customConfig.botToken || '7123456789:AAH...YourBotFatherTokenHere...'}
BOT_USERNAME=${customConfig.botUsername || 'DcXAssistantBot'}
COMMAND_HAND_LER=${customConfig.commandHandler || '.'}
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=${customConfig.sudoUsers || ''}
ALIVE_NAME=${customConfig.aliveName || 'DcX Commander'}
ALIVE_MEDIA=https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200
GEMINI_API_KEY=${customConfig.geminiApiKey || ''}
GROQ_API_KEY=
PM_PERMIT=True
PM_LIMIT=4
AWS_REGION=${customConfig.awsRegion || 'us-east-1'}
AWS_INSTANCE_ID=i-ec2-dcxuserbot
`;
    }

    root.file(file.path, content);
  }

  // Also include a pre-filled .env if custom configuration was set
  if (customConfig && customConfig.apiId) {
    const envContent = `API_ID=${customConfig.apiId}
API_HASH=${customConfig.apiHash}
STRING_SESSION=${customConfig.stringSession}
BOT_TOKEN=${customConfig.botToken}
BOT_USERNAME=${customConfig.botUsername}
COMMAND_HAND_LER=${customConfig.commandHandler || '.'}
SUDO_COMMAND_HAND_LER=!
SUDO_USERS=${customConfig.sudoUsers}
ALIVE_NAME=${customConfig.aliveName || 'DcX Commander'}
GEMINI_API_KEY=${customConfig.geminiApiKey}
PM_PERMIT=True
PM_LIMIT=4
AWS_REGION=${customConfig.awsRegion || 'us-east-1'}
AWS_INSTANCE_ID=i-ec2-dcxuserbot
`;
    root.file('.env', envContent);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'DcXuserbot-Telegram-AWS-Ready.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
