# Plan: Tool Control Center

Created: 2026-03-07 | Version: 1.0 | Status: Planning

## PRD Summary

### What
Web-based control center chạy trên VPS Linux để giám sát, quản lý và auto-heal 70+ automation tool (airdrop/testnet bot) từ xa qua browser.

### User Stories

| As a... | I want to... | So that... | Priority |
|---------|-------------|------------|----------|
| Owner | Xem trạng thái tất cả tool trên 1 dashboard | Biết ngay tool nào đang chạy, tool nào lỗi | P0 |
| Owner | Start/Stop/Restart tool từ browser | Không cần SSH vào VPS | P0 |
| Owner | 1-click update proxy cho tất cả tool | Không phải sửa 70+ file thủ công | P0 |
| Owner | Xem live log của từng tool | Debug khi có lỗi | P0 |
| Owner | Nhận Telegram alert khi tool crash | Biết ngay dù không mở browser | P0 |
| Owner | Tool tự restart khi crash | Giảm downtime | P0 |
| Owner | Thêm tool mới chỉ cần copy folder | Không cần config gì thêm | P1 |
| Owner | Auto-heal khi proxy die | Tool tự recovery không cần can thiệp | P1 |

### Constraints
- Single user (không cần multi-tenant)
- VPS Linux environment
- Tool existing structure không thay đổi (chỉ đọc/ghi proxy.txt, proxies.txt)
- Webshare API rate limit: 60 req/min cho proxy endpoints

### Out of Scope
- Modify tool source code
- Multi-VPS management
- Payment/billing
- Tool marketplace

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 20+ (TypeScript) |
| Backend Framework | Express.js |
| Realtime | Socket.IO |
| Frontend | React 18 + Vite |
| UI Library | Tailwind CSS + shadcn/ui |
| Process Mgmt | Node.js child_process (spawn) |
| Auth | bcrypt + JWT |
| Alert | Telegram Bot API |
| Proxy API | Webshare.io REST API |
| Deploy | PM2 + Nginx |
| Data Storage | JSON files (no database needed) |

## API Contracts

### Auth
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| `/api/auth/login` | POST | `{ password }` | `{ token }` | No |

### Tools
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| `/api/tools` | GET | - | `Tool[]` | JWT |
| `/api/tools/:id/start` | POST | - | `{ status }` | JWT |
| `/api/tools/:id/stop` | POST | - | `{ status }` | JWT |
| `/api/tools/:id/restart` | POST | - | `{ status }` | JWT |
| `/api/tools/start-all` | POST | - | `{ results }` | JWT |
| `/api/tools/stop-all` | POST | - | `{ results }` | JWT |
| `/api/tools/:id/config` | GET | - | `{ proxy, accounts }` | JWT |
| `/api/tools/:id/config` | PUT | `{ autoRestart, maxRetries }` | `{ config }` | JWT |

### Proxy
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| `/api/proxy/list` | GET | - | `Proxy[]` | JWT |
| `/api/proxy/fetch` | POST | - | `{ proxies, count }` | JWT |
| `/api/proxy/apply-all` | POST | - | `{ updated, failed }` | JWT |

### Logs (WebSocket)
| Event | Direction | Payload |
|-------|-----------|---------|
| `tool:log` | Server → Client | `{ toolId, line, timestamp }` |
| `tool:status` | Server → Client | `{ toolId, status, uptime }` |
| `subscribe:log` | Client → Server | `{ toolId }` |
| `unsubscribe:log` | Client → Server | `{ toolId }` |

### Settings
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| `/api/settings` | GET | - | `Settings` | JWT |
| `/api/settings` | PUT | `Settings` | `Settings` | JWT |
| `/api/settings/telegram/test` | POST | - | `{ success }` | JWT |

## File Structure

```
airdrop/
├── package.json
├── tsconfig.json
├── .env                        # API keys, secrets
├── .env.example
├── docs/
│   ├── BRIEF.md
│   └── specs/
├── plans/
├── server/                     # Backend
│   ├── index.ts                # Entry point
│   ├── config.ts               # Environment config
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── tools.ts
│   │   ├── proxy.ts
│   │   └── settings.ts
│   ├── services/
│   │   ├── process-manager.ts  # Spawn/kill processes
│   │   ├── tool-scanner.ts     # Auto-detect tools
│   │   ├── proxy-manager.ts    # Webshare API + file write
│   │   ├── log-manager.ts      # Log buffering + rotation
│   │   ├── telegram.ts         # Alert service
│   │   └── auto-healer.ts      # Crash detect + recovery
│   ├── middleware/
│   │   └── auth.ts             # JWT verify
│   ├── types/
│   │   └── index.ts
│   └── data/
│       ├── settings.json       # Persisted settings
│       └── tool-configs.json   # Per-tool config overrides
├── client/                     # Frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── ToolGrid.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── ProxyPanel.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useTools.ts
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── api.ts          # HTTP client
│   │   │   └── socket.ts       # Socket.IO client
│   │   └── types/
│   │       └── index.ts
│   └── public/
└── ecosystem.config.js         # PM2 config
```

## Phases

| Phase | Name | Status | Files | Progress |
|-------|------|--------|-------|----------|
| 01 | Project Setup | Pending | 6 | 0% |
| 02 | Backend Core | Pending | 8 | 0% |
| 03 | Process Manager | Pending | 4 | 0% |
| 04 | Proxy Manager | Pending | 3 | 0% |
| 05 | Frontend UI | Pending | 12 | 0% |
| 06 | Realtime + Logs | Pending | 4 | 0% |
| 07 | Telegram + Auto-restart | Pending | 3 | 0% |
| 08 | Integration + Deploy | Pending | 4 | 0% |
