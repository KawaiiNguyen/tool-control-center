# Phase 03: Process Manager

## Objective
Core engine: scan tools, spawn/kill processes, track status, auto-restart on crash.

## Tasks

### 3.1 Tool Scanner (`server/services/tool-scanner.ts`)

**Auto-detect logic:**
```
For each folder in TOOLS_DIR:
  1. Check package.json → type = 'node', entry = main field || 'index.js'
  2. Check requirements.txt → type = 'python'
  3. Detect entry file:
     - Python: bot.py > main.py > app.py > *.py (first found)
     - Node: index.js > main.js > app.js
  4. Detect config files:
     - proxy.txt exists?
     - proxies.txt exists?
     - accounts.txt / accounts.json exists?
  5. Read .bat files to extract actual entry command (fallback)
```

**Rescan:** periodic (configurable interval) + manual trigger

### 3.2 Process Manager (`server/services/process-manager.ts`)

**Start tool:**
```
Python: spawn('python3', [entryFile], { cwd: toolPath })
Node:   spawn('node', [entryFile], { cwd: toolPath })
```

**Features:**
- Track PID, uptime, status per tool
- Capture stdout/stderr → buffer last 500 lines per tool
- Detect crash (process exit) → emit event
- Auto-restart logic:
  - On crash → wait 5s → restart
  - Track crashCount, if > maxRetries → mark as 'error', stop retrying
  - Reset crashCount after 10 min stable run
- Graceful shutdown: SIGTERM → wait 5s → SIGKILL
- Start All / Stop All / Restart All

**Process cleanup:**
- On server shutdown (SIGINT/SIGTERM): kill all child processes
- Store running tool IDs → restore on server restart

### 3.3 API Routes (`server/routes/tools.ts`)
- GET `/api/tools` — list all tools with status
- POST `/api/tools/:id/start`
- POST `/api/tools/:id/stop`
- POST `/api/tools/:id/restart`
- POST `/api/tools/start-all`
- POST `/api/tools/stop-all`
- POST `/api/tools/restart-all`
- GET `/api/tools/:id/config`
- PUT `/api/tools/:id/config`
- POST `/api/tools/scan` — trigger rescan

## Definition of Done
- [ ] Auto-scan detects all tools in TOOLS_DIR with correct type/entry
- [ ] Start/Stop/Restart works for both Python and Node tools
- [ ] Process crash triggers auto-restart (respects maxRetries)
- [ ] stdout/stderr captured and buffered (last 500 lines)
- [ ] All child processes cleaned up on server shutdown
- [ ] Start All / Stop All works correctly
- [ ] API returns correct tool status in realtime
