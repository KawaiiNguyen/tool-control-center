import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { getSettings, saveSettings } from '../services/data-store.js';
import { sendTestMessage } from '../services/telegram.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to load settings', details: message });
  }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const current = await getSettings();
    const updated = { ...current, ...req.body };
    await saveSettings(updated);
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to save settings', details: message });
  }
});

router.post('/telegram/test', async (req: AuthRequest, res: Response) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken || !chatId) {
      res.status(400).json({ error: 'botToken and chatId required' });
      return;
    }
    const success = await sendTestMessage(botToken, chatId);
    res.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Telegram test failed', details: message });
  }
});

export default router;
