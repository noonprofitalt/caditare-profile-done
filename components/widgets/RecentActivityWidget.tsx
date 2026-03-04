import React from 'react';
import { Candidate } from '../../types';
import { Clock, ArrowRight, Circle, CheckCircle2, AlertCircle, FileText, MessageSquare, Terminal, Activity, ShieldAlert } from 'lucide-react';

interface RecentActivityWidgetProps {
    candidate: Candidate;
    onViewAll?: () => void;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ candidate, onViewAll }) => {
    const allEvents = (candidate?.timelineEvents || [])
        .filter(e => e && e.timestamp);

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

    const getEventBg = (type: string, isCritical?: boolean) => {
        if (isCritical) return 'bg-red-500';
        switch (type) {
            case 'STAGE_TRANSITION':
            case 'WORKFLOW': return 'bg-blue-500';
            case 'STATUS_CHANGE': return 'bg-emerald-500';
            case 'ALERT': return 'bg-orange-500';
            case 'MANUAL_OVERRIDE': return 'bg-orange-600';
            case 'DOCUMENT': return 'bg-purple-500';
            case 'NOTE': return 'bg-amber-500';
            case 'SYSTEM': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Clock size={18} className="text-slate-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {allEvents.length} total events
                        </p>
                    </div>
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                    >
                        View All
                        <ArrowRight size={12} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-6 py-4">
                {recentEvents.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                        <Clock size={32} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">No activity yet.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {recentEvents.map((event, idx) => (
                            <div key={event.id || idx} className="relative">
                                {/* Connecting Line */}
                                {idx < recentEvents.length - 1 && (
                                    <div className="absolute left-[13px] top-[28px] w-px h-[calc(100%+12px)] bg-slate-100" />
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Dot */}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10 ${getEventBg(event.type, event.metadata?.isCritical)}`}>
                                        {getEventIcon(event.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="text-sm text-slate-900 font-semibold leading-snug">
                                            {event.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="text-xs font-medium text-slate-400">{formatDate(event.timestamp)}</span>
                                            {event.actor && (
                                                <>
                                                    <span className="text-slate-200">•</span>
                                                    <span className="text-xs font-semibold text-slate-500">{event.actor}</span>
                                                </>
                                            )}
                                        </div>
                                        {event.description && (
                                            <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
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
        </div>
    );
};

export default RecentActivityWidget;
