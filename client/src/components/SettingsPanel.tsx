import { useState, useEffect } from 'react';
import { Settings, Save, Send } from 'lucide-react';
import api from '../lib/api';
import type { Settings as SettingsType } from '../types';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings').then(res => {
      setSettings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/settings', settings);
      setMessage('Settings saved');
    } catch (err: any) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    } finally { setSaving(false); }
  };

  const testTelegram = async () => {
    if (!settings) return;
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      setMessage('Error: Bot Token and Chat ID required');
      return;
    }
    try {
      const res = await api.post('/settings/telegram/test', {
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
      });
      setMessage(res.data.success ? 'Telegram test sent!' : 'Error: Failed to send test message');
    } catch (err: any) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading || !settings) return <div className="text-gray-500">Loading settings...</div>;

  const update = (key: keyof SettingsType, value: any) => {
    setSettings({ ...settings, [key]: value });
    setMessage(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-400" /> Settings
      </h2>

      <div className="space-y-6 max-w-2xl">
        {/* Tools Directory */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Tools Directory</h3>
          <input value={settings.toolsDir} onChange={e => update('toolsDir', e.target.value)}
            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>

        {/* Process Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Process Manager</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.autoRestart} onChange={e => update('autoRestart', e.target.checked)}
              className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500" />
            <span className="text-sm text-gray-300">Auto-restart on crash</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Max retries:</label>
            <input type="number" value={settings.maxRetries} onChange={e => update('maxRetries', parseInt(e.target.value) || 3)}
              className="w-20 px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Scan interval (ms):</label>
            <input type="number" value={settings.scanIntervalMs} onChange={e => update('scanIntervalMs', parseInt(e.target.value) || 60000)}
              className="w-28 px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Webshare */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Webshare API</h3>
          <input type="password" value={settings.webshareApiKey} onChange={e => update('webshareApiKey', e.target.value)}
            placeholder="Webshare API Key"
            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        {/* Telegram */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Telegram Alerts</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.telegramEnabled} onChange={e => update('telegramEnabled', e.target.checked)}
              className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500" />
            <span className="text-sm text-gray-300">Enable Telegram alerts</span>
          </label>
          <input type="text" value={settings.telegramBotToken} onChange={e => update('telegramBotToken', e.target.value)}
            placeholder="Bot Token"
            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          <input type="text" value={settings.telegramChatId} onChange={e => update('telegramChatId', e.target.value)}
            placeholder="Chat ID"
            className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          <button onClick={testTelegram}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">
            <Send className="w-3 h-3" /> Test Telegram
          </button>
        </div>

        {/* Save */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}>{message}</div>
        )}
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
