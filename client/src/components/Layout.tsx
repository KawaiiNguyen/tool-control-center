import { type ReactNode, useState } from 'react';
import { LayoutDashboard, Globe, ScrollText, Settings, LogOut, Menu, X, Activity } from 'lucide-react';

type Page = 'dashboard' | 'proxy' | 'logs' | 'settings';

interface Props {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  runningCount: number;
  totalCount: number;
  errorCount: number;
  children: ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'proxy', label: 'Proxy', icon: Globe },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ currentPage, onPageChange, onLogout, runningCount, totalCount, errorCount, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-16 lg:w-56 flex-col bg-gray-900 border-r border-gray-800 fixed h-full z-30">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400 shrink-0" />
            <span className="text-white font-semibold hidden lg:block">TCC</span>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold text-sm">TCC</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-400">{runningCount}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{totalCount}</span>
            {errorCount > 0 && <span className="text-red-400 ml-1">({errorCount} err)</span>}
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-gray-900 border-b border-gray-800 p-2" onClick={e => e.stopPropagation()}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { onPageChange(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  currentPage === item.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-red-400">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-16 lg:ml-56 mt-14 md:mt-0">
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
