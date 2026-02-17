import React from 'react';
import { User, FileText, History, Bot, LucideIcon } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
    count?: number;
}

interface TabNavigationProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    tabs: Tab[];
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="border-b border-slate-200 bg-white sticky top-0 lg:top-16 z-20 backdrop-blur-xl bg-white/90 pb-safe">
            <div className="flex gap-1 px-4 md:px-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-premium font-bold text-[10px] uppercase tracking-widest shrink-0 ${isActive
                                ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-200 text-slate-500'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TabNavigation;
export type { Tab };
