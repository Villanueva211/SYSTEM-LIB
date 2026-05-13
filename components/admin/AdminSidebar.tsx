'use client';
import { Shield, LayoutDashboard, BookOpen, Clock, Calendar, Users, BarChart3, Settings, LogOut, Bell, X } from 'lucide-react';

type Tab = 'overview'|'books'|'borrows'|'reservations'|'appointments'|'users'|'reports'|'settings';

interface AdminSidebarProps {
  tab: Tab; setTab: (t: Tab) => void;
  userName: string; pendingCount: number; signOut: () => void;
  isOpen: boolean; onClose: () => void;
}

export function AdminSidebar({ tab, setTab, userName, pendingCount, signOut, isOpen, onClose }: AdminSidebarProps) {
  const nav: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',     label: 'Overview',     icon: <LayoutDashboard size={16} /> },
    { id: 'books',        label: 'Books',         icon: <BookOpen size={16} /> },
    { id: 'borrows',      label: 'Borrows',       icon: <Clock size={16} />, badge: pendingCount },
    { id: 'reservations', label: 'Reservations',  icon: <Bell size={16} /> },
    { id: 'appointments', label: 'Appointments',  icon: <Calendar size={16} /> },
    { id: 'users',        label: 'Users',         icon: <Users size={16} /> },
    { id: 'reports',      label: 'Reports',       icon: <BarChart3 size={16} /> },
    { id: 'settings',     label: 'Settings',      icon: <Settings size={16} /> },
  ];

  const handleSelect = (id: Tab) => { setTab(id); onClose(); };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/06
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:flex lg:w-60 lg:flex-shrink-0
          w-72
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'rgba(8,8,20,0.98)', minHeight: '100vh' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/06 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm">Library Admin</p>
              <p className="text-xs text-slate-500 truncate max-w-[130px]">{userName}</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/05 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ id, label, icon, badge }) => (
            <button key={id} onClick={() => handleSelect(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab===id ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/04'}`}
              style={tab===id ? { background:'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))', border:'1px solid rgba(99,102,241,0.2)' } : {}}>
              {icon} {label}
              {!!badge && <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background:'#ef4444' }}>{badge}</span>}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/06">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/08 transition-all">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
