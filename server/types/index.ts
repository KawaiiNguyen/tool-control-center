export interface Tool {
  id: string;
  name: string;
  path: string;
  type: 'python' | 'node';
  entryFile: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid?: number;
  startedAt?: number;
  uptime?: number;
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

export interface WebshareProxy {
  proxy_address: string;
  port: number;
  username: string;
  password: string;
  valid: boolean;
  country_code: string;
}

export interface Proxy {
  host: string;
  port: number;
  username: string;
  password: string;
  formatted: string;
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

export interface ToolRunState {
  runningToolIds: string[];
  savedAt: number;
}
