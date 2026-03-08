import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { processManager } from '../services/process-manager.js';
import { saveToolConfig } from '../services/data-store.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthRequest, res: Response) => {
  res.json(processManager.getTools());
});

router.post('/scan', async (_req: AuthRequest, res: Response) => {
  try {
    const tools = await processManager.scan();
    res.json({ count: tools.length, tools });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Scan failed', details: message });
  }
});

router.post('/start-all', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await processManager.startAll();
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Start all failed', details: message });
  }
});

router.post('/stop-all', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await processManager.stopAll();
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Stop all failed', details: message });
  }
});

router.post('/restart-all', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await processManager.restartAll();
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Restart all failed', details: message });
  }
});

router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const tool = await processManager.startTool(id);
    res.json(tool);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

router.post('/:id/input', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { input } = req.body;
    await processManager.sendInput(id, input || '');
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

router.post('/:id/install', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const tool = await processManager.installTool(id);
    res.json(tool);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

router.post('/:id/stop', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const tool = await processManager.stopTool(id);
    res.json(tool);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

router.post('/:id/restart', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const tool = await processManager.restartTool(id);
    res.json(tool);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

router.get('/:id/config', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const tool = processManager.getTool(id);
  if (!tool) { res.status(404).json({ error: 'Tool not found' }); return; }
  res.json(tool.config);
});

router.put('/:id/config', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const tool = processManager.getTool(id);
    if (!tool) { res.status(404).json({ error: 'Tool not found' }); return; }
    const updates = req.body;
    await saveToolConfig(id, updates);
    Object.assign(tool.config, updates);
    res.json(tool.config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to update config', details: message });
  }
});

router.get('/:id/logs', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const logs = processManager.getLogBuffer(id);
  res.json({ toolId: id, lines: logs });
});

export default router;
