import { Play, Square, RotateCw, ScrollText } from 'lucide-react';
import type { Tool } from '../types';

interface Props {
  tool: Tool;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onViewLogs: (id: string) => void;
  isLoading: boolean;
}

const STATUS_STYLES = {
  running: { dot: 'bg-green-500', bg: 'border-green-500/20', text: 'text-green-400' },
  stopped: { dot: 'bg-gray-500', bg: 'border-gray-700', text: 'text-gray-400' },
  error: { dot: 'bg-red-500', bg: 'border-red-500/20', text: 'text-red-400' },
  starting: { dot: 'bg-yellow-500 animate-pulse', bg: 'border-yellow-500/20', text: 'text-yellow-400' },
};

function formatUptime(ms?: number): string {
  if (!ms) return '--';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default function ToolCard({ tool, onStart, onStop, onRestart, onViewLogs, isLoading }: Props) {
  const style = STATUS_STYLES[tool.status];

  return (
    <div className={`bg-gray-900 border ${style.bg} rounded-xl p-4 hover:bg-gray-850 transition-colors group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <h3 className="text-sm font-medium text-white truncate" title={tool.name}>{tool.name}</h3>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          tool.type === 'python' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {tool.type === 'python' ? 'PY' : 'JS'}
        </span>
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span className={style.text}>{tool.status}</span>
        {tool.status === 'running' && (
          <span>{formatUptime(tool.uptime)}</span>
        )}
        {tool.crashCount > 0 && (
          <span className="text-red-400/70">crashes: {tool.crashCount}</span>
        )}
      </div>

      {/* Error */}
      {tool.lastError && tool.status === 'error' && (
        <p className="text-xs text-red-400/80 mb-3 truncate" title={tool.lastError}>{tool.lastError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {tool.status === 'running' ? (
          <>
            <button onClick={() => onStop(tool.id)} disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 transition-colors">
              <Square className="w-3 h-3" /> Stop
            </button>
            <button onClick={() => onRestart(tool.id)} disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400 disabled:opacity-50 transition-colors">
              <RotateCw className="w-3 h-3" /> Restart
            </button>
          </>
        ) : (
          <button onClick={() => onStart(tool.id)} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-green-500/20 hover:text-green-400 disabled:opacity-50 transition-colors">
            <Play className="w-3 h-3" /> Start
          </button>
        )}
        <button onClick={() => onViewLogs(tool.id)}
          className="flex items-center justify-center px-2 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
          <ScrollText className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
