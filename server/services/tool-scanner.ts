import fs from 'fs/promises';
import path from 'path';
import type { Tool, ToolConfig } from '../types/index.js';
import { getToolConfigs } from './data-store.js';

const PYTHON_ENTRIES = ['bot.py', 'main.py', 'app.py'];
const NODE_ENTRIES = ['index.js', 'main.js', 'app.js'];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function detectEntryFromBat(toolPath: string): Promise<{ type: 'python' | 'node'; entry: string } | null> {
  try {
    const files = await fs.readdir(toolPath);
    const batFiles = files.filter(f => f.endsWith('.bat'));
    for (const bat of batFiles) {
      const content = await fs.readFile(path.join(toolPath, bat), 'utf-8');
      // Check for python command
      const pyMatch = content.match(/python[3]?\s+(\S+\.py)/i);
      if (pyMatch) {
        const entry = pyMatch[1];
        if (await fileExists(path.join(toolPath, entry))) {
          return { type: 'python', entry };
        }
      }
      // Check for node command
      const nodeMatch = content.match(/node\s+(\S+\.js)/i);
      if (nodeMatch) {
        const entry = nodeMatch[1];
        if (await fileExists(path.join(toolPath, entry))) {
          return { type: 'node', entry };
        }
      }
    }
  } catch {}
  return null;
}

async function detectTool(toolPath: string, folderName: string): Promise<Tool | null> {
  let type: 'python' | 'node' = 'python';
  let entryFile = '';

  // Check package.json first (Node.js)
  const pkgPath = path.join(toolPath, 'package.json');
  if (await fileExists(pkgPath)) {
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
      type = 'node';
      entryFile = pkg.main || '';
    } catch {}
  }

  // Check requirements.txt (Python)
  if (!entryFile && await fileExists(path.join(toolPath, 'requirements.txt'))) {
    type = 'python';
  }

  // Detect entry file by priority
  if (!entryFile) {
    const entries = type === 'python' ? PYTHON_ENTRIES : NODE_ENTRIES;
    for (const entry of entries) {
      if (await fileExists(path.join(toolPath, entry))) {
        entryFile = entry;
        break;
      }
    }
  }

  // Fallback: parse .bat files
  if (!entryFile) {
    const batResult = await detectEntryFromBat(toolPath);
    if (batResult) {
      type = batResult.type;
      entryFile = batResult.entry;
    }
  }

  // Last resort: find any .py or .js file
  if (!entryFile) {
    try {
      const files = await fs.readdir(toolPath);
      const pyFile = files.find(f => f.endsWith('.py') && !f.startsWith('setup') && !f.startsWith('__'));
      const jsFile = files.find(f => f.endsWith('.js') && !f.startsWith('.'));
      if (pyFile) { type = 'python'; entryFile = pyFile; }
      else if (jsFile) { type = 'node'; entryFile = jsFile; }
    } catch {}
  }

  if (!entryFile) return null;

  const hasProxyFile = await fileExists(path.join(toolPath, 'proxy.txt'));
  const hasProxiesFile = await fileExists(path.join(toolPath, 'proxies.txt'));
  const hasAccountsTxt = await fileExists(path.join(toolPath, 'accounts.txt'));
  const hasAccountsJson = await fileExists(path.join(toolPath, 'accounts.json'));

  const toolConfig: ToolConfig = {
    autoRestart: true,
    maxRetries: 3,
    hasProxyFile,
    hasProxiesFile,
    hasAccountsFile: hasAccountsTxt || hasAccountsJson,
    entryFile,
  };

  return {
    id: folderName,
    name: folderName,
    path: toolPath,
    type,
    entryFile,
    status: 'stopped',
    crashCount: 0,
    config: toolConfig,
  };
}

export async function scanTools(toolsDir: string): Promise<Tool[]> {
  const tools: Tool[] = [];
  const savedConfigs = await getToolConfigs();

  try {
    const entries = await fs.readdir(toolsDir, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory());

    const results = await Promise.all(
      folders.map(async (folder) => {
        const toolPath = path.join(toolsDir, folder.name);
        const tool = await detectTool(toolPath, folder.name);
        if (tool && savedConfigs[tool.id]) {
          // Apply saved config overrides
          Object.assign(tool.config, savedConfigs[tool.id]);
          if (savedConfigs[tool.id].entryFile) {
            tool.entryFile = savedConfigs[tool.id].entryFile!;
          }
        }
        return tool;
      })
    );

    for (const tool of results) {
      if (tool) tools.push(tool);
    }
  } catch (err) {
    console.error(`Failed to scan tools directory: ${toolsDir}`, err);
  }

  return tools.sort((a, b) => a.name.localeCompare(b.name));
}
