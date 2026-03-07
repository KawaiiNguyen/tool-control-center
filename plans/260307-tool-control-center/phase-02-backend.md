# Phase 02: Backend Core

## Objective
Xây dựng nền tảng backend: auth, routing, middleware, types, data persistence.

## Tasks

### 2.1 Types Definition (`server/types/index.ts`)
```typescript
interface Tool {
  id: string;              // folder name
  name: string;            // display name
  path: string;            // absolute path to folder
  type: 'python' | 'node'; // detected language
  entryFile: string;       // bot.py, index.js, etc.
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid?: number;
  uptime?: number;         // ms since started
  lastError?: string;
  crashCount: number;
  config: ToolConfig;
}

interface ToolConfig {
  autoRestart: boolean;
  maxRetries: number;
  hasProxyFile: boolean;    // has proxy.txt
  hasProxiesFile: boolean;  // has proxies.txt
  hasAccountsFile: boolean;
  entryFile: string;        // override detected entry
}

interface Proxy {
  host: string;
  port: number;
  username: string;
  password: string;
  formatted: string;        // http://user:pass@ip:port
}

interface Settings {
  toolsDir: string;
  autoRestart: boolean;
  maxRetries: number;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  webshareApiKey: string;
  scanIntervalMs: number;
}
```

### 2.2 Auth Middleware (`server/middleware/auth.ts`)
- JWT verify middleware
- Login route: compare password with bcrypt hash
- Generate JWT token (24h expiry)

### 2.3 Route Structure
- `server/routes/auth.ts` — POST /login
- `server/routes/tools.ts` — CRUD + start/stop/restart
- `server/routes/proxy.ts` — fetch/apply proxy
- `server/routes/settings.ts` — get/update settings

### 2.4 Data Persistence
- `server/data/settings.json` — app settings
- `server/data/tool-configs.json` — per-tool overrides
- Simple JSON read/write (no database)

### 2.5 Error Handling
- Global error handler middleware
- Consistent error response format: `{ error: string, details?: any }`

## Definition of Done
- [ ] POST `/api/auth/login` returns JWT token with correct password
- [ ] All routes protected by JWT middleware (except login)
- [ ] GET `/api/settings` returns settings from JSON file
- [ ] PUT `/api/settings` persists to JSON file
- [ ] Error responses follow consistent format
- [ ] TypeScript compiles with strict mode
