import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    KanbanSquare,
    MessageSquare,
    Settings,
    Briefcase,
    MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const location = useLocation();
    const [showMore, setShowMore] = React.useState(false);

    // Close "more" menu when route changes
    React.useEffect(() => {
        setShowMore(false);
    }, [location.pathname]);

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        `mobile-nav-item flex-1 relative ${isActive ? 'active scale-105' : 'hover:bg-slate-50/50 rounded-xl'}`;

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
                        onClick={() => setShowMore(false)}
                    />
                    <div className="lg:hidden fixed bottom-[80px] left-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 p-3 animate-in slide-in-from-bottom-4 fade-in duration-200 safe-bottom">
                        <div className="grid grid-cols-3 gap-2">
                            {isAdmin && (
                                <>
                                    <NavLink
                                        to="/jobs"
                                        className={({ isActive }) =>
                                            `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                                        }
                                    >
                                        <Briefcase size={20} />
                                        <span className="text-[9px] uppercase tracking-tighter font-bold">Jobs</span>
                                    </NavLink>
                                    <NavLink
                                        to="/finance"
                                        className={({ isActive }) =>
                                            `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                                        }
                                    >
                                        <LayoutDashboard size={20} />
                                        <span className="text-[9px] uppercase tracking-tighter font-bold">Finance</span>
                                    </NavLink>
                                    <NavLink
                                        to="/partners"
                                        className={({ isActive }) =>
                                            `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                                        }
                                    >
                                        <Users size={20} />
                                        <span className="text-[9px] uppercase tracking-tighter font-bold">Partners</span>
                                    </NavLink>
                                </>
                            )}
                            {isAdmin && (
                                <NavLink
                                    to="/settings"
                                    className={({ isActive }) =>
                                        `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                                    }
                                >
                                    <Settings size={20} />
                                    <span className="text-[9px] uppercase tracking-tighter font-bold">Settings</span>
                                </NavLink>
                            )}
                            <NavLink
                                to="/analytics"
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                                }
                            >
                                <KanbanSquare size={20} />
                                <span className="text-[9px] uppercase tracking-tighter font-bold">Analytics</span>
                            </NavLink>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-30 safe-bottom">
                <div className="flex items-center justify-around h-[var(--bottom-nav-height)] px-1 sm:px-4 max-w-lg mx-auto">
                    <NavLink to="/" className={navItemClass}>
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />}
                                <LayoutDashboard size={21} className="mb-0.5" />
                                <span className="text-[9px] uppercase tracking-tighter font-black">Home</span>
                            </>
                        )}
                    </NavLink>
                    <NavLink to="/pipeline" className={navItemClass}>
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />}
                                <KanbanSquare size={21} className="mb-0.5" />
                                <span className="text-[9px] uppercase tracking-tighter font-black">Pipeline</span>
                            </>
                        )}
                    </NavLink>
                    <NavLink to="/candidates" className={navItemClass}>
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />}
                                <Users size={21} className="mb-0.5" />
                                <span className="text-[9px] uppercase tracking-tighter font-black">People</span>
                            </>
                        )}
                    </NavLink>
                    <NavLink to="/team-chat" className={navItemClass}>
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />}
                                <MessageSquare size={21} className="mb-0.5" />
                                <span className="text-[9px] uppercase tracking-tighter font-black">Chat</span>
                            </>
                        )}
                    </NavLink>
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`mobile-nav-item flex-1 relative ${showMore ? 'text-blue-600 font-bold' : ''}`}
                    >
                        {showMore && <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />}
                        <MoreHorizontal size={21} className="mb-0.5" />
                        <span className="text-[9px] uppercase tracking-tighter font-black">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default MobileNav;
