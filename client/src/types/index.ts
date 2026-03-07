export interface Tool {
  id: string;
  name: string;
  path: string;
  type: 'python' | 'node';
  entryFile: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid?: number;
  uptime?: number;
  startedAt?: number;
  lastError?: string;
  crashCount: number;
  config: ToolConfig;
}

export interface ToolConfig {
  autoRestart: boolean;
  maxRetries: number;
  hasProxyFile: boolean;
  hasProxiesFile: boolean;
  hasAccountsFile: boolean;
  entryFile: string;
}

export interface ToolHeartbeat {
  id: string;
  status: string;
  pid?: number;
  uptime?: number;
  crashCount: number;
  lastError?: string;
}

export interface Settings {
  toolsDir: string;
  autoRestart: boolean;
  maxRetries: number;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  webshareApiKey: string;
  scanIntervalMs: number;
}
