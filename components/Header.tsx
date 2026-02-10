import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, UserCircle, X, ChevronRight, Command } from 'lucide-react';
import { MOCK_CANDIDATES } from '../services/mockData';
import { Candidate } from '../types';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Smart Search Logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQ = query.toLowerCase();
    const matches = MOCK_CANDIDATES.filter(c => 
      c.name.toLowerCase().includes(lowerQ) ||
      c.nic.includes(lowerQ) ||
      c.phone.includes(lowerQ) ||
      c.role.toLowerCase().includes(lowerQ)
    ).slice(0, 5); // Limit to 5 for speed

    setResults(matches);
    setIsOpen(true);
    setSelectedIndex(-1);
  }, [query]);

  // Click Outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
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
               <button onClick={() => setQuery('')} className="pointer-events-auto hover:text-red-500 text-slate-400">
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
        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               Search Results
            </div>
            {results.length > 0 ? (
              <ul>
                {results.map((candidate, index) => (
                  <li key={candidate.id}>
                    <button 
                      onClick={() => handleSelect(candidate)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${
                        index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <img src={candidate.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                         <div>
                            <p className={`text-sm font-semibold ${index === selectedIndex ? 'text-blue-700' : 'text-slate-800'}`}>
                                {candidate.name}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                               <span className="font-mono">{candidate.nic}</span> • {candidate.role}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            candidate.stage === 'Visa' ? 'bg-purple-100 text-purple-700' : 
                            candidate.stage === 'Medical' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                         }`}>
                           {candidate.stage}
                         </span>
                         <ChevronRight size={16} className={`text-slate-300 ${index === selectedIndex ? 'text-blue-500' : ''}`} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                 No candidates found matching "{query}"
              </div>
            )}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
               <span>Press <strong>Enter</strong> to select</span>
               <span><strong>Esc</strong> to close</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-slate-500 hover:text-blue-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full translate-x-1/2 -translate-y-1/2 border-2 border-white animate-pulse"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800">Admin User</p>
            <p className="text-xs text-slate-500">Super Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
             <UserCircle size={28} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;