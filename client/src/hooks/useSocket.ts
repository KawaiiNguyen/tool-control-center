import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../lib/socket';

export function useSocket(
  onStatusUpdate: (data: any) => void,
  onHeartbeat: (data: any) => void,
) {
  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    socket.on('tool:status', onStatusUpdate);
    socket.on('tools:heartbeat', onHeartbeat);

    return () => {
      socket.off('tool:status', onStatusUpdate);
      socket.off('tools:heartbeat', onHeartbeat);
    };
  }, [onStatusUpdate, onHeartbeat]);
}

export function useLogStream(
  toolId: string | null,
  onLog: (line: string) => void,
  onHistory: (lines: string[]) => void,
) {
  const prevToolId = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;

    // Unsubscribe from previous
    if (prevToolId.current) {
      socket.emit('unsubscribe:log', prevToolId.current);
      socket.off('tool:log');
      socket.off('tool:log:history');
    }

    if (toolId) {
      socket.on('tool:log', (data: { toolId: string; line: string }) => {
        if (data.toolId === toolId) onLog(data.line);
      });
      socket.on('tool:log:history', (data: { toolId: string; lines: string[] }) => {
        if (data.toolId === toolId) onHistory(data.lines);
      });
      socket.emit('subscribe:log', toolId);
    }

    prevToolId.current = toolId;

    return () => {
      if (toolId) {
        socket.emit('unsubscribe:log', toolId);
        socket.off('tool:log');
        socket.off('tool:log:history');
      }
    };
  }, [toolId, onLog, onHistory]);
}
