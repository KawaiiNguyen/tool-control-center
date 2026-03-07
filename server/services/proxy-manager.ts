import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import type { Proxy, WebshareProxy, Tool } from '../types/index.js';
import { config } from '../config.js';

const WEBSHARE_BASE = 'https://proxy.webshare.io/api/v2';

export async function fetchProxiesFromWebshare(apiKey?: string): Promise<Proxy[]> {
  const key = apiKey || config.webshareApiKey;
  if (!key) throw new Error('Webshare API key not configured');

  const allProxies: Proxy[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${WEBSHARE_BASE}/proxy/list/`, {
      params: { mode: 'direct', page_size: 100, page },
      headers: { Authorization: `Token ${key}` },
      timeout: 15000,
    });

    const data = response.data;
    const results: WebshareProxy[] = data.results || [];

    for (const p of results) {
      if (p.valid !== false) {
        allProxies.push({
          host: p.proxy_address,
          port: p.port,
          username: p.username,
          password: p.password,
          formatted: `http://${p.username}:${p.password}@${p.proxy_address}:${p.port}`,
        });
      }
    }

    hasMore = !!data.next;
    page++;
  }

  return allProxies;
}

export function formatProxies(proxies: Proxy[]): string {
  return proxies.map(p => p.formatted).join('\n');
}

async function writeProxyFile(filePath: string, content: string): Promise<void> {
  // Backup old file
  try {
    await fs.access(filePath);
    await fs.copyFile(filePath, filePath + '.bak');
  } catch {}
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function applyProxiesToTools(
  proxies: Proxy[],
  tools: Tool[]
): Promise<{ updated: string[]; failed: Array<{ id: string; error: string }> }> {
  const content = formatProxies(proxies);
  const updated: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const tool of tools) {
    try {
      let wrote = false;
      if (tool.config.hasProxyFile) {
        await writeProxyFile(path.join(tool.path, 'proxy.txt'), content);
        wrote = true;
      }
      if (tool.config.hasProxiesFile) {
        await writeProxyFile(path.join(tool.path, 'proxies.txt'), content);
        wrote = true;
      }
      if (wrote) updated.push(tool.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ id: tool.id, error: message });
    }
  }

  return { updated, failed };
}

export async function readCurrentProxies(tools: Tool[]): Promise<string[]> {
  // Read from first tool that has a proxy file
  for (const tool of tools) {
    const file = tool.config.hasProxyFile
      ? path.join(tool.path, 'proxy.txt')
      : tool.config.hasProxiesFile
        ? path.join(tool.path, 'proxies.txt')
        : null;
    if (file) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        return content.split('\n').filter(l => l.trim());
      } catch {}
    }
  }
  return [];
}
