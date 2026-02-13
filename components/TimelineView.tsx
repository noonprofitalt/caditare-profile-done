import React from 'react';
import { TimelineEvent } from '../types';
import { Circle, CheckCircle2, AlertCircle, FileText, MessageSquare, ArrowRight, User } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  // Sort events newest first
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
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
    switch (type) {
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

        {sortedEvents.map((event) => (
          <div key={event.id} className="relative flex gap-6 group">
            {/* Timeline Dot */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getEventColor(event.type, event.metadata?.isCritical)}`}>
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-2">{event.description}</p>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide border border-slate-200">
                  {event.stage}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <User size={10} />
                  {event.actor}
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