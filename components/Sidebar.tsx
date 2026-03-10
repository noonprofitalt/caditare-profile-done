import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  LogOut,
  Settings,
  KanbanSquare,
  Target,
  DollarSign,
  TrendingUp,
  BrainCircuit,
  Activity,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const [agencyName, setAgencyName] = React.useState(() => localStorage.getItem('agency_name') || 'Suhara');

  React.useEffect(() => {
    const updateName = () => {
      setAgencyName(localStorage.getItem('agency_name') || 'Suhara');
    };
    window.addEventListener('agency_update', updateName);
    return () => window.removeEventListener('agency_update', updateName);
  }, []);

  const initials = agencyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const isAdmin = user?.role === 'Admin';

  // Close sidebar on nav link click (mobile)
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside className={`w-[var(--sidebar-width)] h-[100dvh] h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 transition-transform duration-300 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2 lg:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Navigation</span>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all btn-touch"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="font-black text-white text-lg">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight uppercase truncate">{agencyName} ERP CORE</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto custom-scrollbar touch-pan-y">
        <NavLink to="/" className={linkClass} onClick={handleNavClick}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analytics" className={linkClass} onClick={handleNavClick}>
          <BrainCircuit size={20} />
          <span>Intelligence</span>
        </NavLink>
        <NavLink to="/pipeline" className={linkClass} onClick={handleNavClick}>
          <KanbanSquare size={20} />
          <span>Pipeline</span>
        </NavLink>
        <NavLink to="/candidates" className={linkClass} onClick={handleNavClick}>
          <Users size={20} />
          <span>Candidates</span>
        </NavLink>

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4">Admin</p>
            </div>
            <NavLink to="/jobs" className={linkClass} onClick={handleNavClick}>
              <Briefcase size={20} />
              <span>Jobs</span>
            </NavLink>
            <NavLink to="/partners" className={linkClass} onClick={handleNavClick}>
              <Target size={20} />
              <span>Partners</span>
            </NavLink>
            <NavLink to="/finance" className={linkClass} onClick={handleNavClick}>
              <DollarSign size={20} />
              <span>Finance</span>
            </NavLink>
          </>
        )}

        <NavLink to="/team-chat" className={linkClass} onClick={handleNavClick}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-800 space-y-1 shrink-0 safe-bottom">
        {isAdmin && (
          <>
            <NavLink to="/audit" className={linkClass} onClick={handleNavClick}>
              <Activity size={20} />
              <span>Audit Trails</span>
            </NavLink>
            <NavLink to="/settings" className={linkClass} onClick={handleNavClick}>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </>
        )}
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;