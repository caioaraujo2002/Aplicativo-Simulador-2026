import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Users, BarChart3, Settings, Menu, X, Wrench } from 'lucide-react';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Simulador (Grid)', href: '/simulador', icon: Calendar },
    { name: 'Colaboradores', href: '/colaboradores', icon: Users },
    { name: 'Configurações', href: '/config', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          flex-shrink-0 w-64 h-screen flex flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50 lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950" style={{ backgroundColor: '#020617' }}>
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <span>Simulador HH</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-950/50" style={{ backgroundColor: 'rgba(2, 6, 23, 0.5)' }}>
          <div className="text-xs text-slate-500 font-mono">
            Conectado: Google Sheets API
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 justify-between shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              CA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="min-w-[1024px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
