export interface UserbotFile {
  path: string;
  name: string;
  category: 'core' | 'plugin' | 'deploy' | 'config' | 'docs';
  description: string;
  content: string;
}

export interface UserbotConfig {
  apiId: string;
  apiHash: string;
  stringSession: string;
  botToken: string;
  botUsername: string;
  sudoUsers: string;
  commandHandler: string;
  aliveName: string;
  geminiApiKey: string;
  groqApiKey: string;
  awsRegion: string;
  ec2InstanceType: string;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface SimMessage {
  id: string;
  sender: 'user' | 'bot' | 'assistant';
  senderName: string;
  avatarText: string;
  text: string;
  time: string;
  isEdited?: boolean;
  replyMarkup?: InlineButton[][];
}
