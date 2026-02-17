import React from 'react';
import { ProfileCompletionStatus, WorkflowStage } from '../types';
import { Filter, X } from 'lucide-react';

interface FilterBarProps {
    activeStatus: ProfileCompletionStatus | 'ALL';
    onStatusChange: (status: ProfileCompletionStatus | 'ALL') => void;
    activeStage: WorkflowStage | 'ALL';
    onStageChange: (stage: WorkflowStage | 'ALL') => void;
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
    searchQuery,
    onSearchChange,
    candidateCounts,
    onClearFilters,
    hasActiveFilters
}) => {
    const statusTabs = [
        { value: 'ALL' as const, label: 'All Candidates', count: candidateCounts.all, color: 'slate' },
        { value: ProfileCompletionStatus.QUICK, label: 'Quick Add', count: candidateCounts.quick, color: 'red' },
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
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-6 py-4 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by name, phone, NIC, or email..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                            <X size={16} />
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onStatusChange(tab.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap text-sm ${getTabColor(tab.color, activeStatus === tab.value)
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
                <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Stage:</span>
                    {stageTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => onStageChange(tab.value)}
                            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap text-xs ${activeStage === tab.value
                                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
