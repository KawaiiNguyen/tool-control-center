import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Settings, ToolConfig, ToolRunState } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const DEFAULT_SETTINGS: Settings = {
  toolsDir: '/opt/tool-auto',
  autoRestart: true,
  maxRetries: 3,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  webshareApiKey: '',
  scanIntervalMs: 60000,
};

export async function getSettings(): Promise<Settings> {
  return readJson<Settings>('settings.json', DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJson('settings.json', settings);
}

export async function getToolConfigs(): Promise<Record<string, Partial<ToolConfig>>> {
  return readJson<Record<string, Partial<ToolConfig>>>('tool-configs.json', {});
}

export async function saveToolConfig(toolId: string, config: Partial<ToolConfig>): Promise<void> {
  const configs = await getToolConfigs();
  configs[toolId] = { ...configs[toolId], ...config };
  await writeJson('tool-configs.json', configs);
}

export async function getRunState(): Promise<ToolRunState> {
  return readJson<ToolRunState>('run-state.json', { runningToolIds: [], savedAt: 0 });
}

export async function saveRunState(state: ToolRunState): Promise<void> {
  await writeJson('run-state.json', state);
}
