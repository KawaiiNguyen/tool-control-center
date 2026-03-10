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

async function detectEntryFromScripts(toolPath: string): Promise<{ type: 'python' | 'node'; entry: string } | null> {
  try {
    const files = await fs.readdir(toolPath);
    const scripts = files.filter(f => f.endsWith('.bat') || f.endsWith('.sh') || f.endsWith('.cmd'));
    for (const script of scripts) {
      const content = await fs.readFile(path.join(toolPath, script), 'utf-8');
      // Check for python command
      const pyMatch = content.match(/python[3]?\s+([^\s&|]+\.py)/i);
      if (pyMatch) {
         return { type: 'python', entry: pyMatch[1] };
      }
      // Check for node command
      const nodeMatch = content.match(/node\s+([^\s&|]+\.js)/i);
      if (nodeMatch) {
         return { type: 'node', entry: nodeMatch[1] };
      }
    }
  } catch {}
  return null;
}

async function detectTool(baseToolPath: string, folderName: string): Promise<Tool | null> {
  let type: 'python' | 'node' | null = null;
  let entryFile = '';

  let toolPath = baseToolPath;
  try {
    const files = await fs.readdir(baseToolPath);
    const hasRootIndicator = files.some(f => ['package.json', 'requirements.txt', 'bot.py', 'index.js', 'main.py', 'main.js'].includes(f.toLowerCase()));
    
    // Dive one level deep if no obvious indicators
    if (!hasRootIndicator) {
       const entries = await fs.readdir(baseToolPath, { withFileTypes: true });
       const subDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
       const sameNameDir = subDirs.find(d => d.name.toLowerCase() === folderName.toLowerCase() || ['src', 'bot', 'app', 'build', 'dist'].includes(d.name.toLowerCase()));
       if (sameNameDir) {
           toolPath = path.join(baseToolPath, sameNameDir.name);
       } else if (subDirs.length === 1) {
           toolPath = path.join(baseToolPath, subDirs[0].name);
       }
    }
  } catch {}

  // Check package.json first (Node.js)
  const pkgPath = path.join(toolPath, 'package.json');
  if (await fileExists(pkgPath)) {
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
      type = 'node';
      entryFile = pkg.main || '';
      if (!entryFile && pkg.scripts && pkg.scripts.start) {
        const startMatch = pkg.scripts.start.match(/node\s+([^\s&|]+)/i);
        if (startMatch) entryFile = startMatch[1];
      }
    } catch {}
  }

  // Check requirements.txt (Python)
  if (!type && await fileExists(path.join(toolPath, 'requirements.txt'))) {
    type = 'python';
  }

  // Detect entry file by priority
  if (!entryFile) {
    const entries = (type === 'node') ? NODE_ENTRIES : (type === 'python' ? PYTHON_ENTRIES : [...NODE_ENTRIES, ...PYTHON_ENTRIES]);
    for (const entry of entries) {
      if (await fileExists(path.join(toolPath, entry))) {
        entryFile = entry;
        if (!type) {
            type = entry.endsWith('.js') ? 'node' : 'python';
        }
        break;
      }
    }
  }

  // Fallback: parse .bat/.sh files
  if (!entryFile) {
    const scriptResult = await detectEntryFromScripts(toolPath);
    if (scriptResult) {
      type = scriptResult.type;
      entryFile = scriptResult.entry;
    }
  }

  // Last resort: find any .py or .js file
  if (!entryFile) {
    try {
      const files = await fs.readdir(toolPath);
      const jsFile = files.find(f => f.endsWith('.js') && !f.startsWith('.'));
      const pyFile = files.find(f => f.endsWith('.py') && !f.startsWith('setup') && !f.startsWith('__'));
      
      // Node priority if .js found (since it was missing before)
      if (jsFile) { type = 'node'; entryFile = jsFile; }
      else if (pyFile) { type = 'python'; entryFile = pyFile; }
    } catch {}
  }

  // If still no entry file is found, DO NOT drop the tool. We want it listed.
  // The user can configure it later or see that it crashes. Default to python bot.py.
  if (!type) type = 'python';
  if (!entryFile) entryFile = 'bot.py';

  const hasProxyFile = await fileExists(path.join(toolPath, 'proxy.txt'));
  const hasProxiesFile = await fileExists(path.join(toolPath, 'proxies.txt'));
  const hasAccountsTxt = await fileExists(path.join(toolPath, 'accounts.txt'));
  const hasAccountsJson = await fileExists(path.join(toolPath, 'accounts.json'));

  // Tìm TẤT CẢ proxy files (root + data/ subfolder)
  const proxyPaths: string[] = [];
  const proxyNames = ['proxy.txt', 'proxies.txt'];
  const searchDirs = [toolPath, path.join(toolPath, 'data')];
  for (const dir of searchDirs) {
    for (const name of proxyNames) {
      const fullPath = path.join(dir, name);
      if (await fileExists(fullPath)) {
        proxyPaths.push(fullPath);
      }
    }
  }

  const toolConfig: ToolConfig = {
    autoRestart: true,
    maxRetries: 3,
    hasProxyFile: hasProxyFile || proxyPaths.length > 0,
    hasProxiesFile: hasProxiesFile || proxyPaths.length > 0,
    hasAccountsFile: hasAccountsTxt || hasAccountsJson,
    entryFile,
    proxyPaths,
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
    // Create dir if not exists
    await fs.mkdir(toolsDir, { recursive: true });
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
