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
        <div className="border-b border-slate-200 bg-white">
            <div className="flex gap-1 px-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm ${isActive
                                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 text-slate-600'
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
