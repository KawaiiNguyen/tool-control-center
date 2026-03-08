import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we are running from the dist folder or src folder
const envPath = __dirname.endsWith('dist') 
  ? path.resolve(__dirname, '../../.env') 
  : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  toolsDir: process.env.TOOLS_DIR || '/opt/tool-auto',
  webshareApiKey: process.env.WEBSHARE_API_KEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  isProduction: process.env.NODE_ENV === 'production',
};
