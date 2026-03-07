# Phase 07: Telegram Alert + Auto-heal

## Objective
Alert qua Telegram khi tool crash, auto-heal khi proxy die.

## Tasks

### 7.1 Telegram Service (`server/services/telegram.ts`)

**Send message:**
```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
{
  chat_id: CHAT_ID,
  text: message,
  parse_mode: "HTML"
}
```

**Alert templates:**
```
🔴 <b>Tool Crashed</b>
Tool: Pharos-Automation-Bot
Error: Connection refused
Time: 2026-03-07 14:30:00
Action: Auto-restarting (attempt 2/3)

🟢 <b>Tool Recovered</b>
Tool: Pharos-Automation-Bot
Downtime: 15s
Action: Auto-restart successful

🌐 <b>Proxy Updated</b>
Fetched: 100 proxies from Webshare
Applied to: 68/72 tools
Restarted: 3 error tools

⚠️ <b>Tool Failed</b>
Tool: Dawn-BOT
Error: Max retries (3) exceeded
Action: Manual intervention required
```

**Rate limiting:** Max 1 message per tool per 60s (avoid spam)

### 7.2 Auto-heal Flow (`server/services/auto-healer.ts`)

```
Tool crashes
  ↓
Auto-restart (up to maxRetries)
  ↓
If still failing after maxRetries:
  ↓
Check: is it proxy-related? (scan last logs for keywords)
  Keywords: "proxy", "connection refused", "timeout", "403", "407"
  ↓
  YES → Fetch fresh proxies from Webshare
       → Update proxy.txt + proxies.txt for this tool
       → Restart tool
       → Alert via Telegram
  ↓
  NO → Mark as 'error'
      → Alert via Telegram (manual intervention needed)
```

### 7.3 Settings Integration
- Telegram enable/disable toggle
- Test button: send test message to verify bot token + chat id
- Configure auto-heal on/off
- Configure proxy-error keywords (customizable)

## Definition of Done
- [ ] Telegram sends alert when tool crashes
- [ ] Telegram sends alert when tool recovers
- [ ] Rate limiting prevents spam (1 msg/tool/60s)
- [ ] Test button in settings sends test message
- [ ] Auto-heal detects proxy errors in logs
- [ ] Auto-heal fetches and applies new proxies
- [ ] Auto-heal restarts affected tools
- [ ] All alert templates render correctly with HTML
