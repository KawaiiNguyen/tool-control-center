import { useState } from 'react';
import { Globe, Download, Upload, RefreshCw } from 'lucide-react';
import api from '../lib/api';

export default function ProxyPanel() {
  const [proxies, setProxies] = useState<string[]>([]);
  const [currentProxies, setCurrentProxies] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const fetchCurrent = async () => {
    setLoading('current');
    try {
      const res = await api.get('/proxy/current');
      setCurrentProxies(res.data.proxies);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(null); }
  };

  const fetchNew = async () => {
    setLoading('fetch');
    setResult(null);
    try {
      const res = await api.post('/proxy/fetch');
      setProxies(res.data.proxies);
      setResult(`Fetched ${res.data.count} proxies from Webshare`);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(null); }
  };

  const applyAll = async () => {
    if (proxies.length === 0) { setResult('Fetch proxies first'); return; }
    setLoading('apply');
    try {
      const res = await api.post('/proxy/apply-all', { proxies });
      setResult(`Applied to ${res.data.updated.length} tools. ${res.data.failed.length} failed.`);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(null); }
  };

  const fetchAndApply = async () => {
    setLoading('fetchApply');
    setResult(null);
    try {
      const res = await api.post('/proxy/fetch-and-apply', { restart: true });
      const msg = [
        `Fetched ${res.data.proxies.count} proxies`,
        `Applied to ${res.data.applied.updated.length} tools`,
        res.data.restarted ? `Restarted ${res.data.restarted.restarted.length} error tools` : '',
      ].filter(Boolean).join('. ');
      setResult(msg);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(null); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Globe className="w-5 h-5 text-blue-400" /> Proxy Manager
      </h2>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={fetchNew} disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors">
          <Download className={`w-4 h-4 ${loading === 'fetch' ? 'animate-spin' : ''}`} />
          Fetch New Proxies
        </button>
        <button onClick={applyAll} disabled={!!loading || proxies.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors">
          <Upload className={`w-4 h-4 ${loading === 'apply' ? 'animate-spin' : ''}`} />
          Apply to All Tools
        </button>
        <button onClick={fetchAndApply} disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading === 'fetchApply' ? 'animate-spin' : ''}`} />
          Fetch + Apply + Restart
        </button>
        <button onClick={fetchCurrent} disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
          View Current
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-lg mb-6 text-sm ${
          result.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {result}
        </div>
      )}

      {/* Proxy List */}
      {(proxies.length > 0 || currentProxies.length > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              {proxies.length > 0 ? `Fetched Proxies (${proxies.length})` : `Current Proxies (${currentProxies.length})`}
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto font-mono text-xs space-y-0.5">
            {(proxies.length > 0 ? proxies : currentProxies).map((p, i) => (
              <div key={i} className="text-gray-400 hover:text-gray-200 py-0.5 px-2 rounded hover:bg-gray-800">
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
