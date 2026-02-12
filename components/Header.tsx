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

  // Auth State
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
  const Method_GetCandidates = () => {
    try {
      return CandidateService.getCandidates() || [];
    } catch {
      return MOCK_CANDIDATES;
    }
  };

  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ candidates: [], employers: [], jobs: [] });
      setIsOpen(false);
      return;
    }

    const lowerQ = query.toLowerCase();

    // Search Candidates
    const candidates = Method_GetCandidates().filter(c =>
      c.name.toLowerCase().includes(lowerQ) ||
      (c.nic && c.nic.toLowerCase().includes(lowerQ)) ||
      (c.phone && c.phone.includes(lowerQ)) ||
      c.role.toLowerCase().includes(lowerQ)
    ).slice(0, 3);

    // Search Employers
    const employers = PartnerService.getEmployers().filter(e =>
      e.companyName.toLowerCase().includes(lowerQ) ||
      e.contactPerson.toLowerCase().includes(lowerQ)
    ).slice(0, 3);

    // Search Jobs
    const jobs = JobService.getJobs().filter(j =>
      j.title.toLowerCase().includes(lowerQ) ||
      j.company.toLowerCase().includes(lowerQ)
    ).slice(0, 3);

    setResults({ candidates, employers, jobs });
    setIsOpen(true);
    setSelectedIndex(-1);
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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Smart Global Search */}
        <div className="relative w-full max-w-xl" ref={wrapperRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              placeholder="Quick Find (Name, Passport, Phone)..."
              className="w-full pl-10 pr-12 py-2.5 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none font-medium text-slate-800 placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="pointer-events-auto hover:text-red-500 text-slate-400"
                >
                  <X size={14} />
                </button>
              )}
              {!query && (
                <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-500">
                  <Command size={10} /> K
                </div>
              )}
            </div>
          </div>

          {/* Typeahead Results Dropdown */}
          {isOpen && (results.candidates.length > 0 || results.employers.length > 0 || results.jobs.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top max-h-[80vh] overflow-y-auto z-50">

              {/* Candidates Section */}
              {results.candidates.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                    Candidates
                  </div>
                  <ul>
                    {results.candidates.map((candidate, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <li key={candidate.id}>
                          <button
                            onClick={() => handleSelect('candidate', candidate.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={candidate.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {candidate.name}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                  <span className="font-mono">{candidate.nic}</span> • {candidate.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>
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
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 border-t text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                    Partners & Employers
                  </div>
                  <ul>
                    {results.employers.map((employer, index) => {
                      const globalIndex = results.candidates.length + index;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <li key={employer.id}>
                          <button
                            onClick={() => handleSelect('employer', employer.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                {employer.companyName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {employer.companyName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {employer.country} • {employer.contactPerson}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
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
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 border-t text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                    Jobs
                  </div>
                  <ul>
                    {results.jobs.map((job, index) => {
                      const globalIndex = results.candidates.length + results.employers.length + index;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <li key={job.id}>
                          <button
                            onClick={() => handleSelect('job', job.id)}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                J
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                  {job.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {job.company} • {job.location}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="p-2 bg-slate-50 text-[10px] text-center text-slate-400 border-t border-slate-100">
                Press ESC to close
              </div>
            </div>
          )}
          {isOpen && query.length >= 2 && results.candidates.length === 0 && results.employers.length === 0 && results.jobs.length === 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-8 text-center animate-in fade-in zoom-in-95 duration-100 origin-top z-50">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No results found for \"{query}\"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for candidates, companies, or jobs.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-2 rounded-full transition-all ${isNotificationOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
              }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                <button
                  onClick={() => {
                    NotificationService.markAllAsRead();
                    refreshNotifications();
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.link) navigate(notif.link);
                          NotificationService.markAsRead(notif.id);
                          setIsNotificationOpen(false);
                          refreshNotifications();
                        }}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors relative group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'SUCCESS' ? 'bg-green-500' :
                            notif.type === 'WARNING' ? 'bg-orange-500' :
                              notif.type === 'DELAY' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                          <div className="flex-1">
                            <p className={`text-sm leading-tight ${!notif.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 italic">No new notifications</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Communication Hub Button */}
        <div className="relative">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-full transition-all flex items-center justify-center relative ${isChatOpen ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
            title="Organization Chat"
          >
            <MessageSquare size={20} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.role || 'Guest'}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={28} />
              )}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <SettingsIcon size={16} /> Account Settings
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2 transition-colors mt-1"
                >
                  <LogOut size={16} /> Sign Out
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
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500" style={{ zIndex: 9999 }}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Organization Chat</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Internal Communications</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
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