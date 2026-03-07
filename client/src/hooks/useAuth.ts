import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { password });
      const { token: newToken } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return { token, isAuthenticated: !!token, login, logout, loading, error };
}
