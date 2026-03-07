#!/bin/bash
# deploy.sh - Script deploy/update Tool Control Center trên VPS
# Chạy: bash deploy.sh

set -e

APP_DIR="/root/tool-control-center"
REPO="https://github.com/KawaiiNguyen/tool-control-center.git"

echo "=== Tool Control Center Deploy ==="

# Lần đầu: clone repo
if [ ! -d "$APP_DIR" ]; then
  echo "[1/5] Cloning repo..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"

  echo "[2/5] Tạo file .env..."
  cp .env.example .env
  echo ""
  echo "⚠️  QUAN TRỌNG: Sửa file .env trước khi tiếp tục!"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Cần điền:"
  echo "   - JWT_SECRET (chạy: openssl rand -hex 32)"
  echo "   - ADMIN_PASSWORD"
  echo "   - TOOLS_DIR (đường dẫn tới thư mục tool-auto)"
  echo "   - WEBSHARE_API_KEY"
  echo "   - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (nếu cần)"
  echo ""
  echo "Sau khi sửa .env xong, chạy lại: bash deploy.sh"
  exit 0
fi

cd "$APP_DIR"

# Kiểm tra .env
if [ ! -f ".env" ]; then
  echo "❌ Chưa có file .env! Chạy: cp .env.example .env && nano .env"
  exit 1
fi

# Pull code mới
echo "[1/5] Pulling latest code..."
git pull origin main

# Install dependencies
echo "[2/5] Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build
echo "[3/5] Building production..."
npm run build

# Restart PM2
echo "[4/5] Restarting PM2..."
if pm2 describe tool-control-center > /dev/null 2>&1; then
  pm2 restart tool-control-center
else
  NODE_ENV=production pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "[5/5] Done!"
echo ""
pm2 status
echo ""
echo "✅ Dashboard: http://$(hostname -I | awk '{print $1}'):3001"
