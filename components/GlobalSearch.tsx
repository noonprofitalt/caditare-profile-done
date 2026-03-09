import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, CreditCard, Command, X, ArrowRight, Loader2 } from 'lucide-react';
import { CandidateService } from '../services/candidateService';
import { Candidate, WorkflowStage } from '../types';

const GlobalSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Command Palette Trigger (Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSelectedIndex(0);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                const searchRes = await CandidateService.searchCandidates(5, 0, { query: query.trim() });
                setResults(searchRes.candidates);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Global search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex].id);
            }
        }
    };

    const handleSelect = (id: string) => {
        navigate(`/candidates/${id}`);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-[15vh] px-0 sm:px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Palette */}
            <div className="relative w-full h-full sm:h-auto max-w-2xl bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Search Bar */}
                <div className="relative border-b border-slate-100 p-3 sm:p-4 shrink-0">
                    <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by name, NIC, or phone..."
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-0 text-base sm:text-lg font-medium"
                    />
                    <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isLoading ? (
                            <Loader2 className="animate-spin text-blue-500" size={18} />
                        ) : (
                            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">
                                <Command size={10} />
                                <span>K</span>
                            </div>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 btn-touch p-1">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 max-h-[60vh] sm:max-h-[60vh] overflow-y-auto p-2 touch-pan-y">
                    {!query.trim() ? (
                        <div className="py-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={24} />
                            </div>
                            <p className="font-bold text-sm uppercase tracking-widest">Search Enterprise Database</p>
                            <p className="text-xs mt-1">Start typing to find candidates instantly</p>
                        </div>
                    ) : results.length === 0 && !isLoading ? (
                        <div className="py-12 text-center text-slate-400">
                            <p className="font-bold text-sm uppercase tracking-widest">No candidates found</p>
                            <p className="text-xs mt-1">Try a different name or NIC number</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((candidate, index) => (
                                <div
                                    key={candidate.id}
                                    onClick={() => handleSelect(candidate.id)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${index === selectedIndex ? 'bg-blue-50 border-blue-100 translate-x-1' : 'hover:bg-slate-50 border-transparent'
                                        } border`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${index === selectedIndex ? 'border-blue-400' : 'border-slate-100'}`}>
                                            <img
                                                src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                                                alt={candidate.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight ${index === selectedIndex ? 'text-blue-900' : 'text-slate-800'}`}>
                                                {candidate.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                                <div className="flex items-center gap-1">
                                                    <CreditCard size={12} />
                                                    {candidate.nic || 'No NIC'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {candidate.phone || 'No Phone'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex flex-col items-end gap-1 ${index === selectedIndex ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${candidate.stage === WorkflowStage.REGISTERED ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {candidate.stage}
                                        </span>
                                        <ArrowRight size={16} className="text-blue-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 hidden sm:flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">↵</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">↑↓</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Navigate</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Enterprise Command v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
