import React from 'react';
import { TimelineEvent } from '../types';
import { Circle, CheckCircle2, AlertCircle, FileText, MessageSquare, ArrowRight, User } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  // Sort events newest first, handle potentially invalid dates
  const sortedEvents = [...(events || [])]
    .filter(e => e && e.timestamp)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return date.toLocaleDateString(); // Future date
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getEventIcon = (type: string) => {
    const safeType = type || 'SYSTEM';
    switch (safeType) {
      case 'STAGE_TRANSITION': return <ArrowRight size={16} className="text-white" />;
      case 'STATUS_CHANGE': return <CheckCircle2 size={16} className="text-white" />;
      case 'DOCUMENT': return <FileText size={16} className="text-white" />;
      case 'NOTE': return <MessageSquare size={16} className="text-white" />;
      case 'ALERT': return <AlertCircle size={16} className="text-white" />;
      case 'MANUAL_OVERRIDE': return <AlertCircle size={16} className="text-white" />;
      case 'SYSTEM': return <User size={16} className="text-white" />;
      default: return <Circle size={16} className="text-white" />;
    }
  };

  const getEventColor = (type: string, isCritical?: boolean) => {
    if (isCritical) return 'bg-red-500 ring-4 ring-red-100';
    const safeType = type || 'SYSTEM';
    switch (safeType) {
      case 'STAGE_TRANSITION': return 'bg-blue-600 ring-4 ring-blue-100';
      case 'STATUS_CHANGE': return 'bg-green-500 ring-4 ring-green-100';
      case 'ALERT': return 'bg-orange-500 ring-4 ring-orange-100';
      case 'MANUAL_OVERRIDE': return 'bg-orange-600 ring-4 ring-orange-100';
      case 'DOCUMENT': return 'bg-purple-500 ring-4 ring-purple-100';
      default: return 'bg-slate-400 ring-4 ring-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
        Processing Timeline
      </h3>

      <div className="relative pl-4 space-y-8">
        {/* Continuous Line */}
        <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

        {sortedEvents.map((event, index) => (
          <div key={event.id || `evt-${event.timestamp}-${index}`} className="relative flex gap-6 group">
            {/* Timeline Dot */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getEventColor(event.type, event.metadata?.isCritical)}`}>
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{event.title || 'Timeline Event'}</h4>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDate(event.timestamp)}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-2">{event.description || 'No additional details provided.'}</p>

              <div className="items-center gap-3 flex">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide border border-slate-200">
                  {event.stage || 'STAGE'}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <User size={10} />
                  <span title={event.userId ? `User ID: ${event.userId}` : 'System User'} className="cursor-help border-b border-dashed border-slate-300">
                    {event.actor || 'System'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {sortedEvents.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm italic">
            No history recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;