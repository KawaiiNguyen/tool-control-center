import { useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTools } from './hooks/useTools';
import { useSocket } from './hooks/useSocket';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProxyPanel from './components/ProxyPanel';
import LogViewer from './components/LogViewer';
import SettingsPanel from './components/SettingsPanel';

type Page = 'dashboard' | 'proxy' | 'logs' | 'settings';

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const {
    tools, loading: toolsLoading, actionLoading,
    startTool, stopTool, restartTool,
    startAll, stopAll, restartAll, scanTools,
    updateToolStatus, updateAllStatuses,
  } = useTools();
  const [page, setPage] = useState<Page>('dashboard');
  const [logToolId, setLogToolId] = useState<string | null>(null);

  const handleStatusUpdate = useCallback((data: any) => {
    updateToolStatus(data.toolId, { status: data.status, pid: data.pid, crashCount: data.crashCount, lastError: data.lastError });
  }, [updateToolStatus]);

  const handleHeartbeat = useCallback((data: any) => {
    updateAllStatuses(data);
  }, [updateAllStatuses]);

  useSocket(handleStatusUpdate, handleHeartbeat);

  const handleViewLogs = (toolId: string) => {
    setLogToolId(toolId);
    setPage('logs');
  };

  const running = tools.filter(t => t.status === 'running').length;
  const errors = tools.filter(t => t.status === 'error').length;

  return (
    <Layout
      currentPage={page}
      onPageChange={setPage}
      onLogout={onLogout}
      runningCount={running}
      totalCount={tools.length}
      errorCount={errors}
    >
      {page === 'dashboard' && (
        <Dashboard
          tools={tools}
          loading={toolsLoading}
          actionLoading={actionLoading}
          onStart={startTool}
          onStop={stopTool}
          onRestart={restartTool}
          onStartAll={startAll}
          onStopAll={stopAll}
          onRestartAll={restartAll}
          onScan={scanTools}
          onViewLogs={handleViewLogs}
        />
      )}
      {page === 'proxy' && <ProxyPanel />}
      {page === 'logs' && <LogViewer tools={tools} initialToolId={logToolId} />}
      {page === 'settings' && <SettingsPanel />}
    </Layout>
  );
}

function App() {
  const { isAuthenticated, login, logout, loading: authLoading, error: authError } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} loading={authLoading} error={authError} />;
  }

  return <AuthenticatedApp onLogout={logout} />;
}

export default App;
