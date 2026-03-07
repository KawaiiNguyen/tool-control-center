import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Password required' });
      return;
    }

    // Compare with configured password (plain text compare since admin sets it in .env)
    if (password !== config.adminPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign({ userId: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Login failed', details: message });
  }
});

export default router;
