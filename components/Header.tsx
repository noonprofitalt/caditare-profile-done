import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, UserCircle, X, ChevronRight, Command, MessageSquare, Menu, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { MOCK_CANDIDATES } from '../services/mockData';
import { Candidate, Employer, Job, AppNotification } from '../types';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import { JobService } from '../services/jobService';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../services/notificationService';
import GlobalChat from './GlobalChat';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ candidates: Candidate[], employers: Employer[], jobs: Job[] }>({ candidates: [], employers: [], jobs: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const totalResults = results.candidates.length + results.employers.length + results.jobs.length;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Global Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Mobile Search State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const refreshNotifications = () => {
    setNotifications(NotificationService.getNotifications());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshNotifications();
    window.addEventListener('storage', refreshNotifications);
    return () => window.removeEventListener('storage', refreshNotifications);
  }, []);

  // Smart Search Logic
  // Move function definition up to fix no-use-before-define
  const Method_GetCandidates = async () => {
    try {
      return await CandidateService.getCandidates() || [];
    } catch {
      return MOCK_CANDIDATES;
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2) {
        setResults({ candidates: [], employers: [], jobs: [] });
        setIsOpen(false);
        return;
      }

      const lowerQ = (query || '').toLowerCase();
      if (!lowerQ) return;

      // Search Candidates
      const allCandidates = await Method_GetCandidates();
      const candidates = (allCandidates || []).filter(c =>
        (c?.name && c.name.toLowerCase().includes(lowerQ)) ||
        (c?.nic && c.nic.toLowerCase().includes(lowerQ)) ||
        (c?.phone && c.phone.includes(lowerQ)) ||
        (c?.role && c.role.toLowerCase().includes(lowerQ))
      ).slice(0, 3);

      // Search Employers
      const employers = (PartnerService.getEmployers() || []).filter(e =>
        (e?.companyName && e.companyName.toLowerCase().includes(lowerQ)) ||
        (e?.contactPerson && e.contactPerson.toLowerCase().includes(lowerQ))
      ).slice(0, 3);

      // Search Jobs
      const jobs = (JobService.getJobs() || []).filter(j =>
        (j?.title && j.title.toLowerCase().includes(lowerQ)) ||
        (j?.company && j.company.toLowerCase().includes(lowerQ))
      ).slice(0, 3);

      setResults({ candidates, employers, jobs });
      setIsOpen(true);
      setSelectedIndex(-1);
    };
    performSearch();
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: 'candidate' | 'employer' | 'job', id: string) => {
    if (type === 'candidate') navigate(`/candidates/${id}`);
    if (type === 'employer') navigate(`/partners/${id}`);
    if (type === 'job') navigate(`/jobs?id=${id}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalResults - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        let current = 0;
        if (selectedIndex < results.candidates.length) {
          handleSelect('candidate', results.candidates[selectedIndex].id);
          return;
        }
        current += results.candidates.length;

        if (selectedIndex < current + results.employers.length) {
          handleSelect('employer', results.employers[selectedIndex - current].id);
          return;
        }
        current += results.employers.length;

        if (selectedIndex < current + results.jobs.length) {
          handleSelect('job', results.jobs[selectedIndex - current].id);
          return;
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
      <div className={`flex items-center gap-4 flex-1 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={onMenuClick}
          className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-lg transition-premium"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Logo/Title on Mobile */}
        {!isMobileSearchOpen && (
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 animate-float">
              <span className="font-black text-white text-xs">SU</span>
            </div>
            <span className="font-black text-slate-900 tracking-tighter text-sm uppercase">Suhara</span>
          </div>
        )}
      </div>

      {/* Smart Global Search */}
      <div className={`flex-[2] max-w-xl transition-all duration-300 ${isMobileSearchOpen ? 'flex' : 'hidden md:flex'} relative`} ref={wrapperRef}>
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Quick Find..."
            className="w-full pl-9 pr-12 py-2 bg-slate-100/50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none font-medium text-slate-800 placeholder:text-slate-400 h-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isMobileSearchOpen && (
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="md:hidden p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-premium"
              >
                <X size={16} />
              </button>
            )}
            {!isMobileSearchOpen && query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-red-500 transition-premium">
                <X size={14} />
              </button>
            )}
            {!query && !isMobileSearchOpen && (
              <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-bold text-slate-500">
                <Command size={10} /> K
              </div>
            )}
          </div>

          {/* Typeahead Results Dropdown */}
          {isOpen && (results.candidates.length > 0 || results.employers.length > 0 || results.jobs.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top max-h-[80vh] overflow-y-auto z-50">
              {/* Candidates Section */}
              {results.candidates.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                    Personnel
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {results.candidates.map((candidate, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <li key={candidate.id}>
                          <button
                            onClick={() => handleSelect('candidate', candidate.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-premium ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={candidate.avatarUrl} className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" alt="" />
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {candidate.name}
                                </p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-2 font-medium">
                                  <span className="font-mono bg-slate-100 px-1 rounded">{candidate.nic}</span> • {candidate.role}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {/* Employers Section */}
              {results.employers.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 border-t text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                    Partners
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {results.employers.map((employer, index) => {
                      const globalIndex = results.candidates.length + index;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <li key={employer.id}>
                          <button
                            onClick={() => handleSelect('employer', employer.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-premium ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                                {employer.companyName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {employer.companyName}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium lowercase">
                                  {employer.country} • {employer.contactPerson}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {/* Jobs Section */}
              {results.jobs.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 border-t text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                    Opportunities
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {results.jobs.map((job, index) => {
                      const globalIndex = results.candidates.length + results.employers.length + index;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <li key={job.id}>
                          <button
                            onClick={() => handleSelect('job', job.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-premium ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                                J
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {job.title}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {job.company} • {job.location}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="p-3 bg-slate-50/50 text-[9px] text-center text-slate-400 border-t border-slate-100 font-bold uppercase tracking-widest">
                Search Ecosystem Active
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-3 md:gap-4 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-full md:hidden transition-premium active:scale-90"
        >
          <Search size={20} />
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-2 rounded-full transition-premium active:scale-90 ${isNotificationOpen ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
              }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-tight">Notifications</h3>
                <button
                  onClick={() => {
                    NotificationService.markAllAsRead();
                    refreshNotifications();
                  }}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-premium"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[70vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {(() => {
                      const today = new Date().toDateString();
                      let lastDate = '';
                      return notifications.map((notif) => {
                        const notifDate = new Date(notif.timestamp).toDateString();
                        const showHeader = notifDate !== lastDate;
                        lastDate = notifDate;
                        const isToday = notifDate === today;

                        return (
                          <React.Fragment key={notif.id}>
                            {showHeader && (
                              <div className="px-4 py-1.5 bg-slate-50/80 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100 backdrop-blur-xs">
                                {isToday ? 'Recent Updates' : notifDate}
                              </div>
                            )}
                            <div
                              onClick={() => {
                                if (notif.link) navigate(notif.link);
                                NotificationService.markAsRead(notif.id);
                                setIsNotificationOpen(false);
                                refreshNotifications();
                              }}
                              className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-premium relative group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex gap-4">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-lg ${notif.type === 'SUCCESS' ? 'bg-emerald-500 shadow-emerald-200' :
                                  notif.type === 'WARNING' ? 'bg-amber-500 shadow-amber-200' :
                                    notif.type === 'DELAY' ? 'bg-red-500 shadow-red-200' : 'bg-blue-500 shadow-blue-200'
                                  }`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`text-sm leading-tight truncate ${!notif.isRead ? 'font-black text-slate-900' : 'text-slate-600 font-medium'}`}>
                                      {notif.title}
                                    </p>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 font-bold">
                                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">{notif.message}</p>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Bell size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-900 font-black uppercase tracking-tight">All Clear</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">No operational signals detected.</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-[10px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-premium">
                  View Comprehensive Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Communication Hub Button */}
        <div className="relative">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-full transition-premium flex items-center justify-center relative active:scale-90 ${isChatOpen ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200 shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
            title="Organization Chat"
          >
            <MessageSquare size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-3 md:pl-4 border-l border-slate-200 hover:opacity-80 transition-premium active:scale-95"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-black text-slate-900 leading-none uppercase tracking-tighter">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{user?.role || 'Guest'}</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-transparent hover:ring-blue-500/20 shadow-sm transition-premium">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} />
              )}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 backdrop-blur-sm">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest mt-1">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 transition-premium"
                >
                  <SettingsIcon size={16} /> Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 transition-premium mt-1"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GLOBAL CHAT DRAWER */}
      {isChatOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: 9998 }} onClick={() => setIsChatOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 z-[9999]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 animate-float">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Team Chat</h2>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Secure</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-premium"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <GlobalChat onClose={() => setIsChatOpen(false)} />
            </div>
          </div>
        </>
      )}
    </header>
  );
};


export default Header;