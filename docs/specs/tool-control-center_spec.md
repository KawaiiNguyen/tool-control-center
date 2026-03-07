# Spec: Tool Control Center

## Executive Summary

Web-based control center chạy trên VPS Linux, quản lý 70+ airdrop/testnet automation tool từ xa qua browser. Tích hợp Webshare API cho proxy management, Telegram cho alert, auto-restart + auto-heal khi tool crash hoặc proxy die.

## Architecture

```
Browser (PC/Mobile)
  ↕ HTTPS + WebSocket
VPS Linux
  ├── Node.js Backend (Express + Socket.IO)
  │   ├── Process Manager (spawn python/node per tool)
  │   ├── Proxy Manager (Webshare API integration)
  │   ├── Log Manager (buffer + stream)
  │   ├── Telegram Alert Service
  │   └── Auto-healer (crash detect + proxy refresh)
  ├── React Frontend (served as static files)
  └── 70+ tool folders (unchanged)
```

## User Stories

| Priority | Story |
|----------|-------|
| P0 | Dashboard hiển thị trạng thái tất cả tool realtime |
| P0 | Start/Stop/Restart tool từ browser |
| P0 | 1-click fetch + apply proxy cho tất cả tool |
| P0 | Live log viewer qua WebSocket |
| P0 | Telegram alert khi tool crash |
| P0 | Auto-restart khi tool crash |
| P1 | Auto-heal: detect proxy die → fetch mới → restart |
| P1 | Zero-config thêm tool mới |

## API Contracts

### Auth
- `POST /api/auth/login` → `{ token }`

### Tools
- `GET /api/tools` → `Tool[]`
- `POST /api/tools/:id/start|stop|restart`
- `POST /api/tools/start-all|stop-all|restart-all`
- `GET|PUT /api/tools/:id/config`
- `POST /api/tools/scan`

### Proxy
- `GET /api/proxy/current`
- `POST /api/proxy/fetch`
- `POST /api/proxy/apply-all`
- `POST /api/proxy/fetch-and-apply`

### WebSocket Events
- `tool:status`, `tool:log`, `tools:heartbeat`
- `subscribe:log`, `unsubscribe:log`

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + TypeScript |
| Realtime | Socket.IO |
| Frontend | React + Vite + Tailwind + shadcn/ui |
| Process | child_process (spawn) |
| Alert | Telegram Bot API |
| Proxy | Webshare.io API |
| Deploy | PM2 + Nginx |
| Data | JSON files |

## Build Phases

1. **Setup** — Project scaffolding, dev environment
2. **Backend Core** — Auth, routing, types, data persistence
3. **Process Manager** — Tool scanner, process spawn/kill, auto-restart
4. **Proxy Manager** — Webshare API, format `http://user:pass@ip:port`, apply to all
5. **Frontend UI** — Dashboard, tool cards, proxy panel, log viewer, settings
6. **Realtime** — Socket.IO, live log streaming, status updates
7. **Telegram + Auto-heal** — Alert service, auto-heal flow
8. **Deploy** — Production build, PM2, Nginx, security
