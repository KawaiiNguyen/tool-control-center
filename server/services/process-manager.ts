import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import type { Tool } from '../types/index.js';
import { scanTools } from './tool-scanner.js';
import { saveRunState, getRunState } from './data-store.js';
import { config } from '../config.js';

const LOG_BUFFER_SIZE = 500;
const STABLE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const RESTART_DELAY_MS = 5000;

interface ProcessInfo {
  process: ChildProcess;
  startedAt: number;
  stableTimer?: NodeJS.Timeout;
}

class ProcessManager extends EventEmitter {
  private tools: Map<string, Tool> = new Map();
  private processes: Map<string, ProcessInfo> = new Map();
  private logBuffers: Map<string, string[]> = new Map();
  private restartTimers: Map<string, NodeJS.Timeout> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    await this.scan();
    // Restore previously running tools
    const runState = await getRunState();
    if (runState.runningToolIds.length > 0) {
      console.log(`Restoring ${runState.runningToolIds.length} previously running tools...`);
      for (const toolId of runState.runningToolIds) {
        if (this.tools.has(toolId)) {
          await this.startTool(toolId);
        }
      }
    }
  }

  async scan(): Promise<Tool[]> {
    const scanned = await scanTools(config.toolsDir);
    // Preserve running status for existing tools
    for (const tool of scanned) {
      const existing = this.tools.get(tool.id);
      if (existing && existing.status === 'running') {
        tool.status = existing.status;
        tool.pid = existing.pid;
        tool.startedAt = existing.startedAt;
        tool.crashCount = existing.crashCount;
        tool.lastError = existing.lastError;
      }
      this.tools.set(tool.id, tool);
    }
    // Remove tools that no longer exist on disk
    for (const [id] of this.tools) {
      if (!scanned.find(t => t.id === id)) {
        await this.stopTool(id);
        this.tools.delete(id);
      }
    }
    return this.getTools();
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      ...tool,
      // compute uptime dynamically
      ...(tool.startedAt ? { uptime: Date.now() - tool.startedAt } : {}),
    }));
  }

  getTool(id: string): Tool | undefined {
    const tool = this.tools.get(id);
    if (tool && tool.startedAt) {
      return { ...tool, uptime: Date.now() - tool.startedAt };
    }
    return tool;
  }

  getLogBuffer(toolId: string): string[] {
    return this.logBuffers.get(toolId) || [];
  }

  async startTool(toolId: string): Promise<Tool> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool not found: ${toolId}`);
    if (tool.status === 'running') throw new Error(`Tool already running: ${toolId}`);

    // Clear any pending restart timer
    const timer = this.restartTimers.get(toolId);
    if (timer) { clearTimeout(timer); this.restartTimers.delete(toolId); }

    tool.status = 'starting';
    this.emit('tool:status', tool);

    const cmd = tool.type === 'python' ? 'python3' : 'node';
    const child = spawn(cmd, [tool.entryFile], {
      cwd: tool.path,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    if (!child.pid) {
      tool.status = 'error';
      tool.lastError = 'Failed to start process';
      this.emit('tool:status', tool);
      throw new Error('Failed to start process');
    }

    tool.status = 'running';
    tool.pid = child.pid;
    tool.startedAt = Date.now();
    this.emit('tool:status', tool);

    // Init log buffer
    if (!this.logBuffers.has(toolId)) {
      this.logBuffers.set(toolId, []);
    }

    const addLog = (line: string) => {
      const buffer = this.logBuffers.get(toolId)!;
      const timestamped = `[${new Date().toLocaleTimeString()}] ${line}`;
      buffer.push(timestamped);
      if (buffer.length > LOG_BUFFER_SIZE) buffer.shift();
      this.emit('tool:log', { toolId, line: timestamped });
    };

    child.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(addLog);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => addLog(`[ERR] ${line}`));
    });

    // Stable timer: reset crash count after 10 min of stable running
    const stableTimer = setTimeout(() => {
      const t = this.tools.get(toolId);
      if (t && t.status === 'running') {
        t.crashCount = 0;
      }
    }, STABLE_THRESHOLD_MS);

    this.processes.set(toolId, { process: child, startedAt: Date.now(), stableTimer });

    child.on('exit', (code, signal) => {
      const currentInfo = this.processes.get(toolId);
      if (currentInfo && currentInfo.process !== child) {
        // Ignore old orphaned process exit events
        return;
      }

      if (currentInfo?.stableTimer) clearTimeout(currentInfo.stableTimer);
      if (currentInfo) this.processes.delete(toolId);

      const t = this.tools.get(toolId);
      if (!t) return;

      // If we intentionally stopped it, status is already 'stopped'
      if (t.status === 'stopped') return;

      t.pid = undefined;
      t.startedAt = undefined;
      t.crashCount++;
      t.lastError = `Exited with code ${code}, signal ${signal}`;
      t.status = 'error';

      addLog(`Process exited (code: ${code}, signal: ${signal})`);
      this.emit('tool:status', t);
      this.emit('tool:crashed', t);

      // Auto-restart logic
      if (t.config.autoRestart && t.crashCount <= t.config.maxRetries) {
        addLog(`Auto-restarting in ${RESTART_DELAY_MS / 1000}s (attempt ${t.crashCount}/${t.config.maxRetries})...`);
        const restartTimer = setTimeout(async () => {
          this.restartTimers.delete(toolId);
          try {
            await this.startTool(toolId);
            addLog('Auto-restart successful');
            this.emit('tool:restarted', t);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`Auto-restart failed: ${message}`);
          }
        }, RESTART_DELAY_MS);
        this.restartTimers.set(toolId, restartTimer);
      } else if (t.crashCount > t.config.maxRetries) {
        addLog(`Max retries (${t.config.maxRetries}) exceeded. Manual intervention required.`);
        this.emit('tool:max-retries', t);
      }
    });

    await this.persistRunState();
    return tool;
  }

  async installTool(toolId: string, packages?: string): Promise<Tool> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool not found: ${toolId}`);
    if (tool.status === 'running' || tool.status === 'starting' || tool.status === 'installing') {
      throw new Error(`Tool cannot be installed while ${tool.status}`);
    }

    tool.status = 'installing';
    this.emit('tool:status', tool);

    if (!this.logBuffers.has(toolId)) {
      this.logBuffers.set(toolId, []);
    }

    const addLog = (line: string) => {
      const buffer = this.logBuffers.get(toolId)!;
      const timestamped = `[${new Date().toLocaleTimeString()}] ${line}`;
      buffer.push(timestamped);
      if (buffer.length > LOG_BUFFER_SIZE) buffer.shift();
      this.emit('tool:log', { toolId, line: timestamped });
    };

    addLog('Starting dependency installation...');

    const isWin = process.platform === 'win32';
    let cmd = isWin ? 'npm.cmd' : 'npm';
    let args = ['install'];
    if (packages && packages.trim()) {
      args.push(...packages.trim().split(/\s+/));
    }

    if (tool.type === 'python') {
      // Use python -m pip install -r requirements.txt for better compatibility
      cmd = isWin ? 'python' : 'python3';
      args = ['-m', 'pip', 'install'];
      if (packages && packages.trim()) {
        args.push(...packages.trim().split(/\s+/));
      } else {
        args.push('-r', 'requirements.txt');
      }
      args.push('--break-system-packages', '--ignore-installed');
    }

    const child = spawn(cmd, args, {
      cwd: tool.path,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    child.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(addLog);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => addLog(`[INSTALL] ${line}`));
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        addLog('Installation successful.');
        tool.status = 'stopped';
      } else {
        addLog(`Installation failed (code: ${code}, signal: ${signal})`);
        tool.status = 'error';
        tool.lastError = `Install failed with code ${code}`;
      }
      this.emit('tool:status', tool);
    });

    return tool;
  }

  async stopTool(toolId: string): Promise<Tool> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool not found: ${toolId}`);

    // Clear restart timer
    const timer = this.restartTimers.get(toolId);
    if (timer) { clearTimeout(timer); this.restartTimers.delete(toolId); }

    const info = this.processes.get(toolId);
    if (!info) {
      tool.status = 'stopped';
      tool.pid = undefined;
      tool.startedAt = undefined;
      this.emit('tool:status', tool);
      return tool;
    }

    // Mark as stopped BEFORE killing so exit handler knows
    tool.status = 'stopped';
    tool.pid = undefined;
    tool.startedAt = undefined;
    tool.crashCount = 0;
    this.emit('tool:status', tool);

    if (info.stableTimer) clearTimeout(info.stableTimer);

    // Graceful shutdown: SIGTERM, then SIGKILL after 5s
    info.process.kill('SIGTERM');
    const killTimer = setTimeout(() => {
      try { info.process.kill('SIGKILL'); } catch {}
    }, 5000);

    info.process.on('exit', () => clearTimeout(killTimer));
    this.processes.delete(toolId);

    await this.persistRunState();
    return tool;
  }

  async sendInput(toolId: string, input: string): Promise<void> {
    const info = this.processes.get(toolId);
    if (!info) throw new Error('Tool is not running');
    if (!info.process.stdin) throw new Error('Tool process has no stdin pipe');

    info.process.stdin.write(input + '\n');

    if (this.logBuffers.has(toolId)) {
      const buffer = this.logBuffers.get(toolId)!;
      const timestamped = `[${new Date().toLocaleTimeString()}] > ${input}`;
      buffer.push(timestamped);
      if (buffer.length > LOG_BUFFER_SIZE) buffer.shift();
      this.emit('tool:log', { toolId, line: timestamped });
    }
  }

  async restartTool(toolId: string): Promise<Tool> {
    await this.stopTool(toolId);
    // Small delay to ensure process is fully stopped
    await new Promise(r => setTimeout(r, 1000));
    return this.startTool(toolId);
  }

  async startAll(): Promise<{ started: string[]; failed: Array<{ id: string; error: string }> }> {
    const started: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const [id, tool] of this.tools) {
      if (tool.status !== 'running') {
        try {
          await this.startTool(id);
          started.push(id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ id, error: message });
        }
      }
    }
    return { started, failed };
  }

  async stopAll(): Promise<{ stopped: string[]; failed: Array<{ id: string; error: string }> }> {
    const stopped: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const [id, tool] of this.tools) {
      if (tool.status === 'running' || tool.status === 'starting') {
        try {
          await this.stopTool(id);
          stopped.push(id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ id, error: message });
        }
      }
    }
    return { stopped, failed };
  }

  async restartAll(): Promise<{ restarted: string[]; failed: Array<{ id: string; error: string }> }> {
    const restarted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const [id, tool] of this.tools) {
      if (tool.status === 'running') {
        try {
          await this.restartTool(id);
          restarted.push(id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ id, error: message });
        }
      }
    }
    return { restarted, failed };
  }

  private async persistRunState(): Promise<void> {
    const runningIds = Array.from(this.tools.values())
      .filter(t => t.status === 'running')
      .map(t => t.id);
    await saveRunState({ runningToolIds: runningIds, savedAt: Date.now() });
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down all tool processes...');
    if (this.scanInterval) clearInterval(this.scanInterval);
    for (const [, timer] of this.restartTimers) clearTimeout(timer);
    this.restartTimers.clear();

    await this.persistRunState();

    const promises = Array.from(this.processes.entries()).map(async ([, info]) => {
      if (info.stableTimer) clearTimeout(info.stableTimer);
      info.process.kill('SIGTERM');
      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          try { info.process.kill('SIGKILL'); } catch {}
          resolve();
        }, 5000);
        info.process.on('exit', () => { clearTimeout(timeout); resolve(); });
      });
    });
    await Promise.all(promises);
    this.processes.clear();
    console.log('All processes shut down.');
  }
}

export const processManager = new ProcessManager();
