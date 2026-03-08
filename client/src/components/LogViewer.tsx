import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollText, Pause, Play, Trash2 } from 'lucide-react';
import type { Tool } from '../types';
import { useLogStream } from '../hooks/useSocket';

interface Props {
  tools: Tool[];
  initialToolId?: string | null;
  onSendInput?: (id: string, input: string) => void;
}

export default function LogViewer({ tools, initialToolId, onSendInput }: Props) {
  const [selectedTool, setSelectedTool] = useState<string | null>(initialToolId || null);
  const [lines, setLines] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const onLog = useCallback((line: string) => {
    if (!paused) {
      setLines(prev => {
        const next = [...prev, line];
        return next.length > 500 ? next.slice(-500) : next;
      });
    }
  }, [paused]);

  const onHistory = useCallback((history: string[]) => {
    setLines(history);
  }, []);

  useLogStream(selectedTool, onLog, onHistory);

  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  useEffect(() => {
    setLines([]);
    setPaused(false);
    autoScrollRef.current = true;
    setInputValue('');
  }, [selectedTool]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTool && inputValue.trim() && onSendInput) {
      onSendInput(selectedTool, inputValue.trim());
      setInputValue('');
    }
  };

  const currentTool = tools.find(t => t.id === selectedTool);
  const isRunning = currentTool?.status === 'running';

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-blue-400" /> Log Viewer
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={selectedTool || ''}
          onChange={(e) => setSelectedTool(e.target.value || null)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Select a tool...</option>
          {tools.map(t => (
            <option key={t.id} value={t.id}>
              {t.status === 'running' ? '* ' : t.status === 'error' ? 'x ' : '- '}{t.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors ${
              paused ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
            }`}>
            {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>
          <button onClick={() => setLines([])}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-gray-950 border border-gray-800 rounded-xl p-4 h-[calc(100vh-350px)] min-h-[300px] overflow-y-auto font-mono text-xs leading-5"
      >
        {!selectedTool && (
          <p className="text-gray-600 text-center mt-8">Select a tool to view logs</p>
        )}
        {selectedTool && lines.length === 0 && (
          <p className="text-gray-600 text-center mt-8">No log output yet...</p>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className={`py-0.5 ${
              line.includes('[ERR]') || line.toLowerCase().includes('error')
                ? 'text-red-400'
                : line.toLowerCase().includes('warn')
                  ? 'text-yellow-400'
                  : 'text-gray-300'
            }`}
          >
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-gray-600 mb-2">
        <span>{lines.length} lines</span>
        {paused && <span className="text-yellow-400">Paused</span>}
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleInputSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!selectedTool || !isRunning}
            placeholder={!selectedTool ? "Select a tool first..." : isRunning ? "Type input for the bot and press Enter..." : "Tool must be running to receive input..."}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!selectedTool || !inputValue.trim() || !isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
