import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    KanbanSquare,
    MessageSquare,
    Settings
} from 'lucide-react';

const MobileNav: React.FC = () => {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-30 safe-bottom">
            <div className="flex items-center justify-around h-[72px] px-2 sm:px-4">
                <NavLink
                    to="/"
                    className={({ isActive }) => `mobile-nav-item flex-1 ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`}
                >
                    <LayoutDashboard size={22} className="mb-0.5" />
                    <span className="text-[9px] uppercase tracking-tighter font-black">Dashboard</span>
                </NavLink>
                <NavLink
                    to="/pipeline"
                    className={({ isActive }) => `mobile-nav-item flex-1 ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`}
                >
                    <KanbanSquare size={22} className="mb-0.5" />
                    <span className="text-[9px] uppercase tracking-tighter font-black">Pipeline</span>
                </NavLink>
                <NavLink
                    to="/candidates"
                    className={({ isActive }) => `mobile-nav-item flex-1 ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`}
                >
                    <Users size={22} className="mb-0.5" />
                    <span className="text-[9px] uppercase tracking-tighter font-black">Candidates</span>
                </NavLink>
                <NavLink
                    to="/team-chat"
                    className={({ isActive }) => `mobile-nav-item flex-1 ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`}
                >
                    <MessageSquare size={22} className="mb-0.5" />
                    <span className="text-[9px] uppercase tracking-tighter font-black">Chat</span>
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `mobile-nav-item flex-1 ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`}
                >
                    <Settings size={22} className="mb-0.5" />
                    <span className="text-[9px] uppercase tracking-tighter font-black">Settings</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default MobileNav;
