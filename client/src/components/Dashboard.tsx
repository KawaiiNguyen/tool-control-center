import { useState, useMemo } from 'react';
import { Search, Play, Square, RotateCw, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Tool } from '../types';
import ToolCard from './ToolCard';

type Filter = 'all' | 'running' | 'stopped' | 'error';

interface Props {
  tools: Tool[];
  loading: boolean;
  actionLoading: string | null;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onInstall: (id: string, packages?: string) => void;
  onStartAll: () => void;
  onStopAll: () => void;
  onRestartAll: () => void;
  onScan: () => void;
  onViewLogs: (id: string) => void;
  onEditConfig: (id: string, entryFile: string) => void;
}

export default function Dashboard({ tools, loading, actionLoading, onStart, onStop, onRestart, onInstall, onStartAll, onStopAll, onRestartAll, onScan, onViewLogs, onEditConfig }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const stats = useMemo(() => ({
    total: tools.length,
    running: tools.filter(t => t.status === 'running').length,
    stopped: tools.filter(t => t.status === 'stopped').length,
    error: tools.filter(t => t.status === 'error').length,
  }), [tools]);

  const filtered = useMemo(() => {
    return tools.filter(t => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tools, filter, search]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading tools...</div>;
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-green-500/20">
          <p className="text-xs text-green-400 mb-1">Running</p>
          <p className="text-2xl font-bold text-green-400">{stats.running}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Stopped</p>
          <p className="text-2xl font-bold text-gray-400">{stats.stopped}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-red-500/20">
          <p className="text-xs text-red-400 mb-1">Error</p>
          <p className="text-2xl font-bold text-red-400">{stats.error}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'running', 'stopped', 'error'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f} {f !== 'all' && `(${stats[f]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={onStartAll} disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors">
          <Play className="w-3 h-3" /> Start All
        </button>
        <button onClick={onStopAll} disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors">
          <Square className="w-3 h-3" /> Stop All
        </button>
        <button onClick={onRestartAll} disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 disabled:opacity-50 transition-colors">
          <RotateCw className="w-3 h-3" /> Restart All
        </button>
        <button onClick={onScan} disabled={!!actionLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-3 h-3 ${actionLoading === 'scan' ? 'animate-spin' : ''}`} /> Scan
        </button>
        {stats.error > 0 && (
          <button onClick={onRestartAll} disabled={!!actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 disabled:opacity-50 transition-colors">
            <AlertTriangle className="w-3 h-3" /> Restart Errors
          </button>
        )}
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onStart={onStart}
            onStop={onStop}
            onRestart={onRestart}
            onInstall={onInstall}
            onViewLogs={onViewLogs}
            onEditConfig={onEditConfig}
            isLoading={actionLoading === tool.id || actionLoading === 'all'}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {search || filter !== 'all' ? 'No tools match filter' : 'No tools found. Check TOOLS_DIR setting.'}
        </div>
      )}
    </div>
  );
}
