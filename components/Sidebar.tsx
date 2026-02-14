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
  BrainCircuit,
  Target,
  DollarSign,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const iconClass = (isActive: boolean) =>
    `transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`;

  return (
    <aside className={`w-64 h-screen bg-[#0F172A] text-white flex flex-col fixed lg:left-0 top-0 border-r border-slate-800/60 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-black text-white text-xl tracking-tighter">GW</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none">GlobalWorkforce</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">Enterprise ERP</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div>
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operations</p>
            <nav className="space-y-1">
              <NavLink to="/" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Dashboard</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/candidates" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <Users size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Candidates</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/pipeline" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <KanbanSquare size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Pipeline</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Strategic</p>
            <nav className="space-y-1">
              <NavLink to="/intelligence" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <BrainCircuit size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Intelligence</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/jobs" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <Briefcase size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Job Board</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/finance" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <DollarSign size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Financials</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Communication</p>
            <nav className="space-y-1">
              <NavLink to="/team-chat" className={linkClass}>
                {({ isActive }) => (
                  <>
                    <MessageSquare size={18} className={iconClass(isActive)} />
                    <span className="text-sm font-semibold">Team Chat</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 m-2 rounded-2xl">
        <div className="flex items-center gap-3 mb-4 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800/50">
            JD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">John Doe</p>
            <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
          </div>
        </div>

        <nav className="space-y-1">
          <NavLink to="/settings" className={linkClass}>
            {({ isActive }) => (
              <>
                <Settings size={18} className={iconClass(isActive)} />
                <span className="text-sm font-semibold">Settings</span>
              </>
            )}
          </NavLink>
          <button className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 group">
            <LogOut size={18} className="text-slate-500 group-hover:text-rose-400" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;