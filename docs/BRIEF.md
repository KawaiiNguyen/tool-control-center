# Tool Control Center — BRIEF

**Created:** 2026-03-07
**Updated:** 2026-03-07
**Project:** D:\Antigravity\airdrop
**Deploy:** VPS Linux (chạy 24/24)
**Access:** Web browser từ bất kỳ đâu (PC, điện thoại)

---

## 1. Problem

70+ automation tool (airdrop/testnet bot) chạy 24/24 trên VPS Linux. Hiện tại phải SSH vào VPS, navigate từng folder, chạy thủ công. Khi proxy die hoặc tool crash, không biết ngay — phải SSH vào check từng cái. Thay proxy phải sửa file trong 70+ folder.

## 2. Solution

**Web-based Control Center** chạy trên VPS, truy cập qua browser:
- Dashboard giám sát tất cả tool realtime
- Proxy manager tập trung tích hợp Webshare API
- Auto-detect tool crash → auto-heal (refresh proxy + restart)
- Telegram alert khi tool crash (không cần mở web)
- Zero-config khi thêm tool mới
- Không cần SSH vào VPS nữa

## 3. Architecture

```
┌──────────────────┐         ┌─────────────────────────────┐
│  Browser         │         │  VPS Linux                  │
│  (PC/Mobile)     │◄──────►│                             │
│                  │ HTTPS   │  Node.js Backend            │
│  React SPA       │ + WS    │  ├── REST API               │
│  Dashboard UI    │         │  ├── WebSocket (live log)    │
│                  │         │  ├── Process Manager         │
│                  │         │  ├── Proxy Manager           │
│                  │         │  └── Telegram Alert          │
│                  │         │                             │
│                  │         │  70+ tools (python/node)     │
└──────────────────┘         └─────────────────────────────┘
```

## 4. Target Users

- Owner duy nhất (single user)
- Truy cập từ bất kỳ đâu qua browser
- Nhận alert qua Telegram khi có sự cố

## 5. Technical Context

### Tool Structure (hiện tại)
- ~70+ tool, mỗi tool 1 folder
- ~80% Python (entry: `bot.py`, `main.py`, `bot1.py`...)
- ~20% Node.js (entry: `index.js`)
- Config: `proxy.txt` / `proxies.txt`, `accounts.txt` / `accounts.json`
- Dependencies: `requirements.txt` (Python), `package.json` (Node)
- Trên VPS: chạy trực tiếp `python bot.py` hoặc `node index.js` (không cần .bat)

### Proxy Provider
- **Webshare.io** — REST API
- API Key: stored in .env
- Endpoint: `GET https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page_size=100`
- Auth: `Authorization: Token <API_KEY>`
- Response format: JSON → format thành `http://user:pass@ip:port`
- Proxy files: cả `proxy.txt` và `proxies.txt` đều cần update cùng format

### Patterns
- Tool chạy 24/24 (set & forget)
- Chỉ can thiệp khi: proxy die, tool crash, hoặc cần update accounts
- Proxy dùng chung cho tất cả tool
- Accounts đa phần giống nhau giữa các tool

## 6. Features

### MVP (Phase 1)
1. **Dashboard** — Grid hiển thị tất cả tool, trạng thái realtime (Running/Stopped/Error)
2. **Process Manager** — Start/Stop/Restart tool, spawn child process (`python`/`node`)
3. **Proxy Manager** — Tích hợp Webshare API, 1-click update proxy cho tất cả tool (format: `http://user:pass@ip:port`)
4. **Auto-scan** — Detect tool mới khi folder được thêm vào tools directory
5. **Log Viewer** — Xem stdout/stderr realtime qua WebSocket
6. **Auto-restart** — Tự restart tool khi crash (retry limit configurable)
7. **Auth** — Login đơn giản (single user, password + JWT)
8. **Telegram Alert** — Tool crash → gửi message qua Telegram Bot

### Phase 2
9. **Auto-heal** — Detect proxy die → auto fetch fresh proxy từ Webshare → update files → restart tools
10. **Account Manager** — Quản lý accounts.txt/accounts.json tập trung
11. **Tool Grouping** — Nhóm tool theo category, batch control theo nhóm
12. **Uptime Stats** — Thời gian chạy, crash count, last error cho mỗi tool

### Backlog
13. **Schedule** — Hẹn giờ start/stop tool
14. **Proxy Health Check** — Kiểm tra proxy sống/chết trước khi apply
15. **Mobile responsive** — Tối ưu giao diện cho điện thoại

## 7. Tech Stack

- **Backend:** Node.js + Express (TypeScript)
- **Realtime:** Socket.IO (WebSocket) — live log, live status
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Process:** Node.js child_process (spawn python/node)
- **Alert:** Telegram Bot API
- **Auth:** bcrypt + JWT (single user)
- **Deploy:** Docker hoặc PM2 trên VPS Linux
- **Reverse Proxy:** Nginx (HTTPS optional)

### Lý do chọn stack:
- Web app → truy cập từ bất kỳ đâu, không cần cài đặt
- Socket.IO → live log streaming, realtime status update
- Telegram → alert miễn phí, nhận ngay trên điện thoại
- TypeScript → type safety cho cả backend + frontend
- Single codebase Node.js → dễ deploy trên VPS

## 8. Complexity & Risks

| Feature | Complexity | Risk |
|---------|-----------|------|
| Process spawn/monitor | Medium | Process cleanup khi server restart |
| WebSocket log streaming | Medium | Memory nếu log quá lớn (cần rotation) |
| Webshare API integration | Easy | Rate limit (60 req/min) |
| Auto-scan folders | Easy | - |
| Auto-heal | Medium | False positive detection |
| Telegram Alert | Easy | Cần Bot Token + Chat ID |
| Auth/Security | Easy | Phải bảo mật endpoint (chạy trên internet) |

## 9. Next Step

`/awf-plan` — Thiết kế kiến trúc chi tiết, file structure, API design, component breakdown
