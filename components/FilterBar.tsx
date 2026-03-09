import React from 'react';
import { ProfileCompletionStatus, WorkflowStage, Country } from '../types';
import { Filter, X, Search, Command } from 'lucide-react';
import { useEffect } from 'react';

interface FilterBarProps {
    activeStatus: ProfileCompletionStatus | 'ALL';
    onStatusChange: (status: ProfileCompletionStatus | 'ALL') => void;
    activeStage: WorkflowStage | 'ALL';
    onStageChange: (stage: WorkflowStage | 'ALL') => void;
    activeCountries: string[];
    onCountryChange: (countries: string[]) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    candidateCounts: {
        all: number;
        quick: number;
        partial: number;
        complete: number;
    };
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
    activeStatus,
    onStatusChange,
    activeStage,
    onStageChange,
    activeCountries,
    onCountryChange,
    searchQuery,
    onSearchChange,
    candidateCounts,
    onClearFilters,
    hasActiveFilters
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const statusTabs = [
        { value: 'ALL' as const, label: 'All Candidates', count: candidateCounts.all, color: 'slate' },
        { value: ProfileCompletionStatus.QUICK, label: 'Quick Create', count: candidateCounts.quick, color: 'red' },
        { value: ProfileCompletionStatus.PARTIAL, label: 'Partial', count: candidateCounts.partial, color: 'yellow' },
        { value: ProfileCompletionStatus.COMPLETE, label: 'Complete', count: candidateCounts.complete, color: 'green' }
    ];

    const stageTabs = [
        { value: 'ALL' as const, label: 'All Stages' },
        { value: WorkflowStage.REGISTERED, label: 'Registration' },
        { value: WorkflowStage.VERIFIED, label: 'Verified' },
        { value: WorkflowStage.APPLIED, label: 'Applied' },
        { value: WorkflowStage.OFFER_RECEIVED, label: 'Offer Received' },
        { value: WorkflowStage.VISA_RECEIVED, label: 'Visa Received' },
        { value: WorkflowStage.DEPARTED, label: 'Departed' }
    ];

    const getTabColor = (color: string, isActive: boolean) => {
        if (!isActive) {
            return 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200';
        }

        switch (color) {
            case 'red':
                return 'bg-red-50 text-red-700 border-red-300 font-semibold';
            case 'yellow':
                return 'bg-yellow-50 text-yellow-700 border-yellow-300 font-semibold';
            case 'green':
                return 'bg-green-50 text-green-700 border-green-300 font-semibold';
            case 'slate':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-300 font-semibold';
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 sticky top-16 lg:top-[64px] z-10">
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                        </div>
                        <input
                            id="global-search-input"
                            type="text"
                            placeholder="Find REG NO, Name or Phone..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-300 focus:border-slate-300 text-sm text-slate-800 transition-colors outline-none placeholder:text-slate-400 btn-touch"
                        />
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-100 rounded">
                                <Command size={9} /> K
                            </kbd>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs sm:text-sm font-medium shrink-0 btn-touch"
                        >
                            <X size={16} />
                            <span className="hidden sm:inline">Clear Filters</span>
                            <span className="sm:hidden">Clear</span>
                        </button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-none">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onStatusChange(tab.value)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-all whitespace-nowrap text-xs sm:text-sm shrink-0 btn-touch ${getTabColor(tab.color, activeStatus === tab.value)
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeStatus === tab.value
                                ? 'bg-white/50'
                                : 'bg-slate-100'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Stage Filter */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Stage:</span>
                    {stageTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onStageChange(tab.value)}
                            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap text-xs shrink-0 btn-touch ${activeStage === tab.value
                                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Country Filter */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-1 scrollbar-none">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Countries:</span>
                    {Object.values(Country).map((country) => {
                        const isActive = activeCountries.includes(country);
                        return (
                            <button
                                key={country}
                                onClick={() => {
                                    if (isActive) {
                                        onCountryChange(activeCountries.filter(c => c !== country));
                                    } else {
                                        onCountryChange([...activeCountries, country]);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-md border transition-all whitespace-nowrap text-xs font-medium shrink-0 btn-touch ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                    }`}
                            >
                                {country}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
