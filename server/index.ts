import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { processManager } from './services/process-manager.js';
import authRoutes from './routes/auth.js';
import toolsRoutes from './routes/tools.js';
import proxyRoutes from './routes/proxy.js';
import settingsRoutes from './routes/settings.js';
import { initAutoHealer } from './services/auto-healer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.isProduction ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({
  origin: config.isProduction ? false : 'http://localhost:5173',
}));
app.use(express.json());

// Serve frontend in production
if (config.isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
}

// Health check
app.get('/api/health', (_req, res) => {
  const tools = processManager.getTools();
  const running = tools.filter(t => t.status === 'running').length;
  const errors = tools.filter(t => t.status === 'error').length;
  res.json({ status: 'ok', timestamp: Date.now(), tools: { total: tools.length, running, errors } });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/settings', settingsRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe:log', (toolId: string) => {
    socket.join(`log:${toolId}`);
    // Send buffered logs
    const buffer = processManager.getLogBuffer(toolId);
    socket.emit('tool:log:history', { toolId, lines: buffer });
  });

  socket.on('unsubscribe:log', (toolId: string) => {
    socket.leave(`log:${toolId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Forward process manager events to Socket.IO
processManager.on('tool:status', (tool) => {
  io.emit('tool:status', { toolId: tool.id, status: tool.status, pid: tool.pid, crashCount: tool.crashCount, lastError: tool.lastError });
});

processManager.on('tool:log', ({ toolId, line }: { toolId: string; line: string }) => {
  io.to(`log:${toolId}`).emit('tool:log', { toolId, line });
});

// Heartbeat: broadcast all tool statuses every 5s
setInterval(() => {
  const tools = processManager.getTools();
  io.emit('tools:heartbeat', tools.map(t => ({
    id: t.id, status: t.status, pid: t.pid,
    uptime: t.startedAt ? Date.now() - t.startedAt : undefined,
    crashCount: t.crashCount, lastError: t.lastError,
  })));
}, 5000);

// Serve frontend for all non-API routes in production
if (config.isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Graceful shutdown
async function shutdown() {
  console.log('Received shutdown signal...');
  await processManager.shutdown();
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Initialize and start
async function start() {
  await processManager.init();
  await initAutoHealer();
  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.isProduction ? 'production' : 'development'}`);
    console.log(`Tools directory: ${config.toolsDir}`);
    console.log(`Tools detected: ${processManager.getTools().length}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, io, httpServer };
