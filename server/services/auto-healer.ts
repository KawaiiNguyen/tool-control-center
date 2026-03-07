import type { Tool } from '../types/index.js';
import { processManager } from './process-manager.js';
import { fetchProxiesFromWebshare, applyProxiesToTools } from './proxy-manager.js';
import { alertToolCrashed, alertToolRecovered, alertToolMaxRetries, alertAutoHeal } from './telegram.js';
import { getSettings } from './data-store.js';

const PROXY_ERROR_KEYWORDS = [
  'proxy', 'proxyconnect', 'proxy_error',
  'connection refused', 'connect etimedout', 'etimedout',
  'econnrefused', 'econnreset',
  '407', '403 forbidden',
  'socket hang up', 'tunnel',
];

function isProxyError(logs: string[]): boolean {
  const recentLogs = logs.slice(-50).join('\n').toLowerCase();
  return PROXY_ERROR_KEYWORDS.some(kw => recentLogs.includes(kw));
}

export async function initAutoHealer(): Promise<void> {
  const settings = await getSettings();

  processManager.on('tool:crashed', async (tool: Tool) => {
    if (!settings.telegramEnabled) return;
    await alertToolCrashed(tool, tool.crashCount, tool.config.maxRetries);
  });

  processManager.on('tool:restarted', async (tool: Tool) => {
    if (!settings.telegramEnabled) return;
    const downtime = tool.startedAt ? Date.now() - tool.startedAt : 0;
    await alertToolRecovered(tool, downtime);
  });

  processManager.on('tool:max-retries', async (tool: Tool) => {
    if (!settings.telegramEnabled) return;
    await alertToolMaxRetries(tool);

    // Auto-heal: check if it's a proxy error
    const logs = processManager.getLogBuffer(tool.id);
    if (isProxyError(logs)) {
      try {
        await alertAutoHeal(tool, 'Fetching fresh proxies...');

        const proxies = await fetchProxiesFromWebshare();
        const tools = processManager.getTools();
        await applyProxiesToTools(proxies, [tool]);

        // Reset crash count and restart
        await alertAutoHeal(tool, `Applied ${proxies.length} proxies, restarting...`);
        await processManager.startTool(tool.id);
      } catch (err) {
        console.error(`Auto-heal failed for ${tool.id}:`, err);
        await alertAutoHeal(tool, 'Auto-heal failed. Manual intervention required.');
      }
    }
  });
}
