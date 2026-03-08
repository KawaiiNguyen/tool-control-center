import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import type { Tool } from '../types';

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      const res = await api.get('/tools');
      setTools(res.data);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  const startTool = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/tools/${id}/start`);
      await fetchTools();
    } finally { setActionLoading(null); }
  }, [fetchTools]);

  const stopTool = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/tools/${id}/stop`);
      await fetchTools();
    } finally { setActionLoading(null); }
  }, [fetchTools]);

  const restartTool = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/tools/${id}/restart`);
      await fetchTools();
    } finally { setActionLoading(null); }
  }, [fetchTools]);

  const installTool = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/tools/${id}/install`);
      await fetchTools();
    } finally { setActionLoading(null); }
  }, [fetchTools]);

  const startAll = useCallback(async () => {
    setActionLoading('all');
    try { await api.post('/tools/start-all'); await fetchTools(); }
    finally { setActionLoading(null); }
  }, [fetchTools]);

  const stopAll = useCallback(async () => {
    setActionLoading('all');
    try { await api.post('/tools/stop-all'); await fetchTools(); }
    finally { setActionLoading(null); }
  }, [fetchTools]);

  const restartAll = useCallback(async () => {
    setActionLoading('all');
    try { await api.post('/tools/restart-all'); await fetchTools(); }
    finally { setActionLoading(null); }
  }, [fetchTools]);

  const scanTools = useCallback(async () => {
    setActionLoading('scan');
    try { await api.post('/tools/scan'); await fetchTools(); }
    finally { setActionLoading(null); }
  }, [fetchTools]);

  const updateToolStatus = useCallback((toolId: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, ...updates } : t));
  }, []);

  const updateAllStatuses = useCallback((heartbeats: Array<{ id: string; status: string; uptime?: number; crashCount: number; lastError?: string }>) => {
    setTools(prev => prev.map(t => {
      const hb = heartbeats.find(h => h.id === t.id);
      if (hb) {
        return { ...t, status: hb.status as Tool['status'], uptime: hb.uptime, crashCount: hb.crashCount, lastError: hb.lastError };
      }
      return t;
    }));
  }, []);

  return {
    tools, loading, actionLoading,
    fetchTools, startTool, stopTool, restartTool, installTool,
    startAll, stopAll, restartAll, scanTools,
    updateToolStatus, updateAllStatuses,
  };
}
