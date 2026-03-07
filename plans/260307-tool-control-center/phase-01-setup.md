# Phase 01: Project Setup

## Objective
Khởi tạo monorepo với backend (Express + TypeScript) và frontend (React + Vite), cấu hình build & dev scripts.

## Tasks

### 1.1 Init project root
- `package.json` root với workspaces
- `tsconfig.json` base config
- `.env.example` với tất cả required env vars
- `.gitignore`

### 1.2 Setup Backend
- `server/package.json` với dependencies: express, socket.io, jsonwebtoken, bcrypt, axios, cors, dotenv
- `server/tsconfig.json` (target ES2022, module NodeNext)
- `server/index.ts` — Express + Socket.IO server entry point
- `server/config.ts` — Load env vars với validation

### 1.3 Setup Frontend
- `npx create-vite client --template react-ts`
- Install: tailwindcss, socket.io-client, axios
- Setup shadcn/ui
- `client/vite.config.ts` — proxy API requests to backend

### 1.4 Dev Scripts
- Root `package.json`: `dev` (concurrent backend + frontend), `build`, `start`
- Backend: `dev` (tsx watch), `build` (tsc), `start` (node)
- Frontend: `dev` (vite), `build` (vite build)

## Environment Variables (.env)
```
# Server
PORT=3001
JWT_SECRET=your-secret-here
ADMIN_PASSWORD=your-password-here

# Tools
TOOLS_DIR=/path/to/tool-auto

# Webshare
WEBSHARE_API_KEY=your-webshare-key

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Definition of Done
- [ ] `npm run dev` starts both backend (port 3001) and frontend (port 5173)
- [ ] Backend responds to `GET /api/health` with `{ status: "ok" }`
- [ ] Frontend loads with Tailwind CSS working
- [ ] Frontend can proxy API requests to backend
- [ ] TypeScript compiles without errors
- [ ] `.env.example` documents all required variables
