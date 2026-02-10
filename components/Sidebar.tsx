import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  MessageSquare,
  LogOut,
  Settings,
  KanbanSquare
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
             <span className="font-bold text-white text-lg">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GlobalWorkforce</h1>
            <p className="text-xs text-slate-400">ERP System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
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
        <NavLink to="/team-chat" className={linkClass}>
          <MessageSquare size={20} />
          <span>Team Chat</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;