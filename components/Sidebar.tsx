import React from 'react';
import { NavLink } from 'react-router-dom';
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
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className={`w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2 lg:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Navigation</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <LogOut size={18} className="rotate-180" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-black text-white text-lg">SU</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">Suhara ERP CORE</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          <TrendingUp size={20} />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/pipeline" className={linkClass}>
          <KanbanSquare size={20} />
          <span>Pipeline</span>
        </NavLink>
        <NavLink to="/candidates" className={linkClass}>
          <Users size={20} />
          <span>Candidates</span>
        </NavLink>
        <NavLink to="/jobs" className={linkClass}>
          <Briefcase size={20} />
          <span>Jobs</span>
        </NavLink>
        <NavLink to="/partners" className={linkClass}>
          <Target size={20} />
          <span>Partners</span>
        </NavLink>
        <NavLink to="/finance" className={linkClass}>
          <DollarSign size={20} />
          <span>Finance</span>
        </NavLink>
        <NavLink to="/team-chat" className={linkClass}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <NavLink to="/settings" className={linkClass}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;