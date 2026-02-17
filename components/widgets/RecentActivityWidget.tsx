import React from 'react';
import { Candidate } from '../../types';
import { Clock, ArrowRight } from 'lucide-react';

interface RecentActivityWidgetProps {
    candidate: Candidate;
    onViewAll?: () => void;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ candidate, onViewAll }) => {
    const recentEvents = (candidate?.timelineEvents || [])
        .filter(e => e && e.timestamp)
        .slice(-5)
        .reverse();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'SYSTEM':
                return 'bg-blue-500';
            case 'STAGE_CHANGE':
                return 'bg-green-500';
            case 'DOCUMENT':
                return 'bg-purple-500';
            case 'COMMENT':
                return 'bg-yellow-500';
            default:
                return 'bg-slate-500';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded" />
                    Recent Activity
                </h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        View All
                        <ArrowRight size={12} />
                    </button>
                )}
            </div>

            {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                    <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                    No activity yet
                </div>
            ) : (
                <div className="space-y-3">
                    {recentEvents.map((event, idx) => (
                        <div key={event.id || idx} className="relative">
                            {/* Connecting Line */}
                            {idx < recentEvents.length - 1 && (
                                <div className="absolute left-[7px] top-[20px] w-0.5 h-[calc(100%+4px)] bg-slate-200" />
                            )}

                            {/* Event Item */}
                            <div className="flex items-start gap-3">
                                {/* Dot */}
                                <div className={`w-4 h-4 rounded-full ${getEventColor(event.type)} flex-shrink-0 mt-0.5 relative z-10`} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-slate-900 font-medium leading-tight">
                                        {event.title}
                                    </div>
                                    {event.description && (
                                        <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                            {event.description}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock size={10} className="text-slate-400" />
                                        <span className="text-xs text-slate-500">{formatDate(event.timestamp)}</span>
                                        {event.actor && (
                                            <>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-xs text-slate-500">{event.actor}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentActivityWidget;
