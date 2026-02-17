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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 flex items-center justify-around z-50 safe-bottom">
            <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active scale-110' : ''}`}
            >
                <LayoutDashboard size={22} />
                <span className="text-[10px] uppercase tracking-tighter font-black">Core</span>
            </NavLink>
            <NavLink
                to="/pipeline"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active scale-110' : ''}`}
            >
                <KanbanSquare size={22} />
                <span className="text-[10px] uppercase tracking-tighter font-black">Ops</span>
            </NavLink>
            <NavLink
                to="/candidates"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active scale-110' : ''}`}
            >
                <Users size={22} />
                <span className="text-[10px] uppercase tracking-tighter font-black">Staff</span>
            </NavLink>
            <NavLink
                to="/team-chat"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active scale-110' : ''}`}
            >
                <MessageSquare size={22} />
                <span className="text-[10px] uppercase tracking-tighter font-black">Chat</span>
            </NavLink>
            <NavLink
                to="/settings"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active scale-110' : ''}`}
            >
                <Settings size={22} />
                <span className="text-[10px] uppercase tracking-tighter font-black">Set</span>
            </NavLink>
        </nav>
    );
};

export default MobileNav;
