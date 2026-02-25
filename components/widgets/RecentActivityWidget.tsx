import React from 'react';
import { Candidate } from '../../types';
import { Clock, ArrowRight, Circle, CheckCircle2, AlertCircle, FileText, MessageSquare, Terminal, Activity, ShieldAlert } from 'lucide-react';

interface RecentActivityWidgetProps {
    candidate: Candidate;
    onViewAll?: () => void;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ candidate, onViewAll }) => {
    // Filter out pure "SYSTEM" noise if we have enough other events to show
    const allEvents = (candidate?.timelineEvents || [])
        .filter(e => e && e.timestamp);

    // Prioritize showing meaningful changes, but fall back to anything if count is low
    const meaningfulEvents = allEvents.filter(e => e.type !== 'SYSTEM');
    const sourceEvents = meaningfulEvents.length >= 3 ? meaningfulEvents : allEvents;

    const recentEvents = sourceEvents.slice(-5).reverse();

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

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'STAGE_TRANSITION': return <ArrowRight size={12} className="text-white" />;
            case 'WORKFLOW': return <Activity size={12} className="text-white" />;
            case 'STATUS_CHANGE': return <CheckCircle2 size={12} className="text-white" />;
            case 'DOCUMENT': return <FileText size={12} className="text-white" />;
            case 'NOTE': return <MessageSquare size={12} className="text-white" />;
            case 'ALERT': return <AlertCircle size={12} className="text-white" />;
            case 'MANUAL_OVERRIDE': return <ShieldAlert size={12} className="text-white" />;
            case 'SYSTEM': return <Terminal size={12} className="text-white" />;
            default: return <Circle size={12} className="text-white" />;
        }
    };

    const getEventColorClass = (type: string, isCritical?: boolean) => {
        if (isCritical) return 'bg-red-500 ring-4 ring-red-50';
        switch (type) {
            case 'STAGE_TRANSITION':
            case 'WORKFLOW': return 'bg-blue-500 ring-2 ring-blue-50';
            case 'STATUS_CHANGE': return 'bg-emerald-500 ring-2 ring-emerald-50';
            case 'ALERT': return 'bg-orange-500 ring-2 ring-orange-50';
            case 'MANUAL_OVERRIDE': return 'bg-orange-600 ring-2 ring-orange-50';
            case 'DOCUMENT': return 'bg-purple-500 ring-2 ring-purple-50';
            case 'NOTE': return 'bg-amber-500 ring-2 ring-amber-50';
            case 'SYSTEM': return 'bg-slate-500 ring-2 ring-slate-50';
            default: return 'bg-slate-400 ring-2 ring-slate-50';
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
                <div className="space-y-4 mt-2">
                    {recentEvents.map((event, idx) => (
                        <div key={event.id || idx} className="relative">
                            {/* Connecting Line */}
                            {idx < recentEvents.length - 1 && (
                                <div className="absolute left-[11px] top-[24px] w-px h-[calc(100%+8px)] bg-slate-200" />
                            )}

                            {/* Event Item */}
                            <div className="flex items-start gap-4">
                                {/* Dot/Icon */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${getEventColorClass(event.type, event.metadata?.isCritical)}`}>
                                    {getEventIcon(event.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pb-1">
                                    <div className="text-sm text-slate-800 font-semibold leading-tight">
                                        {event.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                                        <Clock size={10} className="text-slate-400" />
                                        <span className="text-[11px] font-medium text-slate-500">{formatDate(event.timestamp)}</span>
                                        {event.actor && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[11px] font-medium text-slate-600">{event.actor}</span>
                                            </>
                                        )}
                                    </div>
                                    {event.description && (
                                        <div className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                            {event.description}
                                        </div>
                                    )}
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
