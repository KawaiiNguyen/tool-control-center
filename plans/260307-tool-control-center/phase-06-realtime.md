# Phase 06: Realtime + Log Streaming

## Objective
WebSocket integration cho live status updates và log streaming.

## Tasks

### 6.1 Socket.IO Server Setup (`server/index.ts`)
- Attach Socket.IO to Express server
- JWT auth cho WebSocket connection (middleware)
- Namespaces: default `/` for all events

### 6.2 Log Manager (`server/services/log-manager.ts`)
- Buffer last 500 lines per tool (ring buffer)
- On new stdout/stderr line → emit `tool:log` event
- On client subscribe → send buffered lines first, then stream
- Memory management: cap total buffer size

### 6.3 Status Broadcasting
- On tool status change → emit `tool:status` to all clients
- Periodic heartbeat (every 5s): emit all tool statuses
- Include: toolId, status, uptime, pid, crashCount

### 6.4 Client Socket Integration
- Connect with JWT token
- Subscribe/unsubscribe to tool logs
- Update tool status in React state on `tool:status` event
- Auto-reconnect on disconnect

## Events

| Event | Direction | When |
|-------|-----------|------|
| `tool:status` | Server → All | Tool status changes |
| `tool:log` | Server → Subscribers | New log line |
| `tools:heartbeat` | Server → All | Every 5s, all statuses |
| `subscribe:log` | Client → Server | User opens log viewer |
| `unsubscribe:log` | Client → Server | User closes log viewer |
| `proxy:updated` | Server → All | Proxy apply completed |

## Definition of Done
- [ ] WebSocket connects with JWT authentication
- [ ] Tool status updates appear in dashboard without refresh
- [ ] Log viewer shows live streaming logs
- [ ] Subscribe/unsubscribe to tool logs works
- [ ] Auto-reconnect on connection loss
- [ ] Memory stays stable with 70+ tools logging
