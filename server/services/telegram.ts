import axios from 'axios';
import { config } from '../config.js';
import type { Tool } from '../types/index.js';

const RATE_LIMIT_MS = 60000;
const lastSentMap = new Map<string, number>();

function shouldSend(toolId: string): boolean {
  const last = lastSentMap.get(toolId) || 0;
  if (Date.now() - last < RATE_LIMIT_MS) return false;
  lastSentMap.set(toolId, Date.now());
  return true;
}

async function sendMessage(text: string, botToken?: string, chatId?: string): Promise<boolean> {
  const token = botToken || config.telegramBotToken;
  const chat = chatId || config.telegramChatId;
  if (!token || !chat) return false;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chat,
      text,
      parse_mode: 'HTML',
    }, { timeout: 10000 });
    return true;
  } catch (err) {
    console.error('Telegram send failed:', err);
    return false;
  }
}

export async function alertToolCrashed(tool: Tool, attempt: number, maxRetries: number): Promise<void> {
  if (!shouldSend(tool.id)) return;
  const text = [
    `🔴 <b>Tool Crashed</b>`,
    `Tool: <code>${tool.name}</code>`,
    `Error: ${tool.lastError || 'Unknown'}`,
    `Time: ${new Date().toLocaleString()}`,
    `Action: Auto-restarting (attempt ${attempt}/${maxRetries})`,
  ].join('\n');
  await sendMessage(text);
}

export async function alertToolRecovered(tool: Tool, downtime: number): Promise<void> {
  const text = [
    `🟢 <b>Tool Recovered</b>`,
    `Tool: <code>${tool.name}</code>`,
    `Downtime: ${Math.round(downtime / 1000)}s`,
    `Action: Auto-restart successful`,
  ].join('\n');
  await sendMessage(text);
}

export async function alertToolMaxRetries(tool: Tool): Promise<void> {
  if (!shouldSend(`${tool.id}-max`)) return;
  const text = [
    `⚠️ <b>Tool Failed</b>`,
    `Tool: <code>${tool.name}</code>`,
    `Error: Max retries exceeded`,
    `Last error: ${tool.lastError || 'Unknown'}`,
    `Action: Manual intervention required`,
  ].join('\n');
  await sendMessage(text);
}

export async function alertProxyUpdated(count: number, applied: number, total: number, restarted: number): Promise<void> {
  const text = [
    `🌐 <b>Proxy Updated</b>`,
    `Fetched: ${count} proxies from Webshare`,
    `Applied to: ${applied}/${total} tools`,
    restarted > 0 ? `Restarted: ${restarted} error tools` : '',
  ].filter(Boolean).join('\n');
  await sendMessage(text);
}

export async function alertAutoHeal(tool: Tool, action: string): Promise<void> {
  if (!shouldSend(`${tool.id}-heal`)) return;
  const text = [
    `🔧 <b>Auto-Heal</b>`,
    `Tool: <code>${tool.name}</code>`,
    `Detected: Proxy error in logs`,
    `Action: ${action}`,
  ].join('\n');
  await sendMessage(text);
}

export async function sendTestMessage(botToken: string, chatId: string): Promise<boolean> {
  const text = `✅ <b>Test Message</b>\nTool Control Center is connected!\nTime: ${new Date().toLocaleString()}`;
  return sendMessage(text, botToken, chatId);
}
