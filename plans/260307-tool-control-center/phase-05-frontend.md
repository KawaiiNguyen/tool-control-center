# Phase 05: Frontend UI

## Objective
React SPA với dashboard, tool management, proxy panel, log viewer, settings.

## Tasks

### 5.1 Layout & Navigation
```
┌──────────────────────────────────────────────────────┐
│  Tool Control Center              [Status] [Logout]  │
├────────┬─────────────────────────────────────────────│
│        │                                             │
│  📊    │   Main Content Area                         │
│  Dash  │                                             │
│        │                                             │
│  🌐    │                                             │
│  Proxy │                                             │
│        │                                             │
│  📋    │                                             │
│  Logs  │                                             │
│        │                                             │
│  ⚙️    │                                             │
│  Sett  │                                             │
│        │                                             │
└────────┴─────────────────────────────────────────────┘
```

- Sidebar: icon-based navigation (Dashboard, Proxy, Logs, Settings)
- Header: app name, running count badge, logout button
- Responsive: sidebar collapses on mobile

### 5.2 Login Page
- Simple password input
- JWT stored in localStorage
- Auto-redirect to dashboard

### 5.3 Dashboard Page (main view)
**Stats bar:**
```
[Total: 72] [Running: 65 🟢] [Stopped: 4 ⬜] [Error: 3 🔴]
```

**Tool Grid:**
- Card per tool showing: name, status dot, uptime, type badge (PY/JS)
- Actions: Start/Stop/Restart buttons
- Quick filter: All / Running / Stopped / Error
- Search by tool name
- Batch actions: Start All, Stop All, Restart All, Restart Errors

**Tool Card design:**
```
┌─────────────────────────┐
│ 🟢 Pharos-Automation-Bot│
│ Python │ 12h 34m uptime │
│                         │
│ [Stop] [Restart] [Logs] │
└─────────────────────────┘
```

### 5.4 Proxy Page
- Current proxy list (scrollable)
- Proxy count + last updated time
- Buttons: [Fetch New Proxies] [Apply to All Tools] [Fetch & Apply & Restart]
- Status: "Applied to 68/72 tools"
- Loading states for each action

### 5.5 Log Viewer Page
- Dropdown: select tool
- Live log stream (auto-scroll, monospace font, dark theme)
- Pause/Resume button
- Clear button
- Max 500 lines displayed (ring buffer)
- Color coding: errors in red, warnings in yellow

### 5.6 Settings Page
- Tools directory path
- Auto-restart toggle + max retries
- Telegram: bot token, chat id, test button
- Webshare API key
- Scan interval
- Change password

### 5.7 Hooks & State
- `useAuth()` — login, logout, token management
- `useTools()` — fetch tools, actions (start/stop/restart)
- `useSocket()` — Socket.IO connection, subscribe to events
- `useProxy()` — proxy actions
- API client with JWT interceptor

## Definition of Done
- [ ] Login page works with JWT auth
- [ ] Dashboard shows all tools with correct status
- [ ] Start/Stop/Restart works from UI
- [ ] Batch actions (Start All, Stop All) work
- [ ] Search and filter tools work
- [ ] Proxy page can fetch and apply proxies
- [ ] Log viewer shows live logs for selected tool
- [ ] Settings page saves all configurations
- [ ] Responsive layout (works on mobile browser)
- [ ] Loading and error states handled
