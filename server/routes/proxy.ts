import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { processManager } from '../services/process-manager.js';
import { fetchProxiesFromWebshare, applyProxiesToTools, readCurrentProxies } from '../services/proxy-manager.js';

const router = Router();
router.use(authMiddleware);

router.get('/current', async (_req: AuthRequest, res: Response) => {
  try {
    const tools = processManager.getTools();
    const proxies = await readCurrentProxies(tools);
    res.json({ count: proxies.length, proxies });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to read proxies', details: message });
  }
});

router.post('/fetch', async (_req: AuthRequest, res: Response) => {
  try {
    const proxies = await fetchProxiesFromWebshare();
    res.json({ count: proxies.length, proxies: proxies.map(p => p.formatted) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch proxies', details: message });
  }
});

router.post('/apply-all', async (req: AuthRequest, res: Response) => {
  try {
    const { proxies: proxyLines } = req.body;
    if (!proxyLines || !Array.isArray(proxyLines)) {
      res.status(400).json({ error: 'proxies array required' });
      return;
    }
    // Parse formatted proxies back to Proxy objects (we just need formatted string)
    const proxies = proxyLines.map((line: string) => {
      const match = line.match(/^http:\/\/(.+):(.+)@(.+):(\d+)$/);
      if (!match) return null;
      return {
        username: match[1], password: match[2],
        host: match[3], port: parseInt(match[4]),
        formatted: line,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    const tools = processManager.getTools();
    const result = await applyProxiesToTools(proxies, tools);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to apply proxies', details: message });
  }
});

router.post('/fetch-and-apply', async (req: AuthRequest, res: Response) => {
  try {
    const { restart = false } = req.body;
    const proxies = await fetchProxiesFromWebshare();
    const tools = processManager.getTools();
    const result = await applyProxiesToTools(proxies, tools);

    let restartResult = null;
    if (restart) {
      // Restart tools that had errors
      const errorTools = tools.filter(t => t.status === 'error');
      const restarted: string[] = [];
      const restartFailed: Array<{ id: string; error: string }> = [];
      for (const tool of errorTools) {
        try {
          await processManager.restartTool(tool.id);
          restarted.push(tool.id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          restartFailed.push({ id: tool.id, error: message });
        }
      }
      restartResult = { restarted, failed: restartFailed };
    }

    res.json({
      proxies: { count: proxies.length },
      applied: result,
      restarted: restartResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch and apply proxies', details: message });
  }
});

export default router;
