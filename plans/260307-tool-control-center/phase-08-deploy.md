# Phase 08: Integration + Deploy

## Objective
Tích hợp toàn bộ, build production, deploy lên VPS Linux.

## Tasks

### 8.1 Production Build
- Backend: `tsc` → compile TypeScript → `dist/`
- Frontend: `vite build` → static files → `client/dist/`
- Backend serves frontend static files in production
- Single port deployment (backend serves both API + static)

### 8.2 PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'tool-control-center',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production'
    },
    max_restarts: 10,
    restart_delay: 5000
  }]
}
```

### 8.3 Nginx Config (optional, for HTTPS)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 8.4 Deploy Script
```bash
#!/bin/bash
# deploy.sh
git pull
npm install
npm run build
pm2 restart tool-control-center
```

### 8.5 Security Checklist
- [ ] Change default password
- [ ] JWT secret is strong and unique
- [ ] API key not exposed in frontend
- [ ] CORS configured for production domain only
- [ ] Rate limiting on login endpoint
- [ ] Firewall: only expose port 80/443

### 8.6 Startup Recovery
- On server start: read saved state (which tools were running)
- Auto-start previously running tools
- Emit startup notification via Telegram

## Definition of Done
- [ ] `npm run build` produces production-ready output
- [ ] Single command `npm start` runs entire app
- [ ] PM2 keeps app alive on VPS
- [ ] Frontend served from same port as API
- [ ] WebSocket works through Nginx proxy
- [ ] Tools auto-start on server restart
- [ ] Deploy script works end-to-end
- [ ] Security checklist completed
