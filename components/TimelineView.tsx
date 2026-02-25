import React, { useState, useMemo } from 'react';
import { TimelineEvent } from '../types';
import {
  Circle, CheckCircle2, AlertCircle, FileText, MessageSquare,
  ArrowRight, User, Search, Database, Clock, ChevronDown, ChevronUp,
  Activity, Terminal, Filter, CalendarDays, Maximize2, ShieldAlert
} from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

type ViewMode = 'timeline' | 'audit_table';
type EventFilter = 'ALL' | 'WORKFLOW' | 'DOCUMENT' | 'ALERT' | 'SYSTEM' | 'NOTE' | 'STAGE_TRANSITION' | 'STATUS_CHANGE';

const TimelineView: React.FC<TimelineViewProps> = ({ events = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filter, setFilter] = useState<EventFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedEvents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedEvents(newSet);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return date.toLocaleString(); // Future date
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDateGroup = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Unknown Date';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getEventIcon = (type: string) => {
    const safeType = type || 'SYSTEM';
    switch (safeType) {
      case 'STAGE_TRANSITION': return <ArrowRight size={16} className="text-white" />;
      case 'WORKFLOW': return <Activity size={16} className="text-white" />;
      case 'STATUS_CHANGE': return <CheckCircle2 size={16} className="text-white" />;
      case 'DOCUMENT': return <FileText size={16} className="text-white" />;
      case 'NOTE': return <MessageSquare size={16} className="text-white" />;
      case 'ALERT': return <AlertCircle size={16} className="text-white" />;
      case 'MANUAL_OVERRIDE': return <ShieldAlert size={16} className="text-white" />;
      case 'SYSTEM': return <Terminal size={16} className="text-white" />;
      default: return <Circle size={16} className="text-white" />;
    }
  };

  const getEventColor = (type: string, isCritical?: boolean) => {
    if (isCritical) return 'bg-red-500 ring-2 ring-red-50';
    const safeType = type || 'SYSTEM';
    switch (safeType) {
      case 'STAGE_TRANSITION':
      case 'WORKFLOW': return 'bg-blue-600 ring-2 ring-blue-50';
      case 'STATUS_CHANGE': return 'bg-emerald-500 ring-2 ring-emerald-50';
      case 'ALERT': return 'bg-orange-500 ring-2 ring-orange-50';
      case 'MANUAL_OVERRIDE': return 'bg-orange-600 ring-2 ring-orange-50';
      case 'DOCUMENT': return 'bg-purple-500 ring-2 ring-purple-50';
      case 'NOTE': return 'bg-amber-500 ring-2 ring-amber-50';
      case 'SYSTEM': return 'bg-slate-600 ring-2 ring-slate-50';
      default: return 'bg-slate-400 ring-2 ring-slate-50';
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'ALERT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'DOCUMENT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'STAGE_TRANSITION':
      case 'WORKFLOW': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'STATUS_CHANGE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'NOTE': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Process and Filter
  const filteredAndSortedEvents = useMemo(() => {
    return (events || [])
      .filter(e => e && e.timestamp)
      .filter(e => {
        if (filter !== 'ALL') {
          // Grouped matching rules
          if (filter === 'WORKFLOW' && !['WORKFLOW', 'STAGE_TRANSITION', 'STATUS_CHANGE'].includes(e.type)) return false;
          if (filter === 'ALERT' && !['ALERT', 'MANUAL_OVERRIDE'].includes(e.type)) return false;
          if (filter === 'SYSTEM' && !['SYSTEM', 'NOTE'].includes(e.type)) return false;

          if (filter !== 'WORKFLOW' && filter !== 'ALERT' && filter !== 'SYSTEM' && e.type !== filter) return false;
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          if (!q) return true;

          const titleStr = String(e.title || '').toLowerCase();
          const descStr = String(e.description || '').toLowerCase();
          const actorStr = String(e.actor || '').toLowerCase();
          const typeStr = String(e.type || '').replace(/_/g, ' ').toLowerCase();
          const stageStr = String(e.stage || '').toLowerCase();

          return titleStr.includes(q) ||
            descStr.includes(q) ||
            actorStr.includes(q) ||
            typeStr.includes(q) ||
            stageStr.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
  }, [events, filter, searchQuery]);

  // Group by Date for Timeline View
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};
    filteredAndSortedEvents.forEach(e => {
      const g = getDateGroup(e.timestamp);
      if (!groups[g]) groups[g] = [];
      groups[g].push(e);
    });
    return groups;
  }, [filteredAndSortedEvents]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header & Controls */}
      <div className="pb-4 mb-4 border-b border-slate-100 bg-white">
        <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3">

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar shrink-0">
            {['ALL', 'WORKFLOW', 'DOCUMENT', 'ALERT', 'SYSTEM'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as EventFilter)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${filter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-300 focus:bg-white outline-none transition-all min-w-[200px]"
              />
            </div>

            <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg shrink-0 hide-scrollbar">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${viewMode === 'timeline' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                title="View Timeline"
              >
                <Clock size={14} />
              </button>
              <button
                onClick={() => setViewMode('audit_table')}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${viewMode === 'audit_table' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                title="View Raw Audit Table"
              >
                <Database size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
      <div className="bg-white flex-1 overflow-y-auto">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
              <Filter size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-700 mb-1">No events found</h4>
            <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          viewMode === 'timeline' ? (
            <div className="p-4 sm:p-6 space-y-8">
              {Object.entries(groupedEvents).map(([dateGroup, groupEvents]) => (
                <div key={dateGroup} className="relative">
                  {/* Date Sticky Header */}
                  <div className="sticky top-0 z-20 flex items-center gap-3 mb-6 pt-2 bg-white pb-2 px-2">
                    <div className="text-xs font-semibold text-slate-500 tracking-wide flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-slate-400" /> {dateGroup}
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-5">
                    {/* Continuous Line inside the group */}
                    <div className="absolute left-[31px] top-4 bottom-0 w-px bg-slate-200"></div>

                    {groupEvents.map((event, index) => {
                      const isExpanded = expandedEvents.has(event.id);
                      const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

                      return (
                        <div key={event.id || `evt-${event.timestamp}-${index}`} className="relative flex gap-4 group items-start">
                          {/* Timeline Dot */}
                          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white mt-0.5 ${getEventColor(event.type, event.metadata?.isCritical)}`}>
                            {getEventIcon(event.type)}
                          </div>

                          {/* Event Content minimal layout */}
                          <div className={`flex-1 pb-1 transition-all ${event.metadata?.isCritical ? 'bg-red-50/50 p-2 rounded-lg -ml-2' : ''}`}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                              <div>
                                <h4 className={`font-semibold text-sm ${event.metadata?.isCritical ? 'text-red-700' : 'text-slate-800'}`}>
                                  {event.title || 'Timeline Event'}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider ${getEventBadgeClass(event.type)}`}>
                                    {event.type.replace('_', ' ')}
                                  </span>
                                  {event.stage && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                                      {event.stage}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 mt-0.5 sm:mt-0">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>

                            <p className="text-[13px] text-slate-500 mt-1 mb-2">
                              {event.description || 'No additional details provided.'}
                            </p>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
                                  {event.actor?.charAt(0).toUpperCase() || <User size={10} />}
                                </div>
                                <span title={event.userId ? `User ID: ${event.userId}` : 'Action Performed By'} className="cursor-help transition-colors hover:text-slate-800">
                                  {event.actor || 'System'}
                                </span>
                              </div>

                              {hasMetadata && (
                                <button
                                  onClick={() => toggleExpand(event.id)}
                                  className="text-[11px] font-medium text-blue-500 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                                >
                                  {isExpanded ? <><ChevronUp size={12} /> Hide Data</> : <><ChevronDown size={12} /> View Data</>}
                                </button>
                              )}
                            </div>

                            {/* Expanded Metadata Viewer */}
                            {isExpanded && hasMetadata && (
                              <div className="mt-2 p-2 bg-slate-50 rounded-md overflow-x-auto border border-slate-100">
                                <pre className="text-[10px] font-mono text-slate-600 leading-relaxed">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // RAW AUDIT TABLE
            <div className="overflow-x-auto min-h-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-semibold tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3">Date / Time</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Action Details</th>
                    <th className="px-5 py-3">Stage Context</th>
                    <th className="px-5 py-3">Performed By</th>
                    <th className="px-5 py-3 text-right">Raw Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAndSortedEvents.map((event) => (
                    <tr key={event.id} className={`hover:bg-slate-50 transition-colors ${event.metadata?.isCritical ? 'bg-red-50/50' : ''}`}>
                      <td className="px-5 py-3 text-slate-500 tabular-nums text-xs">
                        {new Date(event.timestamp).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider ${getEventBadgeClass(event.type)}`}>
                          {event.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className={`font-medium text-sm ${event.metadata?.isCritical ? 'text-red-700' : 'text-slate-700'}`}>{event.title}</p>
                        <p className="text-xs text-slate-400 max-w-[200px] truncate" title={event.description}>{event.description}</p>
                      </td>
                      <td className="px-5 py-3">
                        {event.stage ? (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{event.stage}</span>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Global</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-500">
                            {event.actor?.charAt(0).toUpperCase() || '?'}
                          </span>
                          <span title={event.userId || 'System'} className="text-xs font-medium text-slate-600 cursor-help transition-colors hover:text-slate-800">
                            {event.actor || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {event.metadata && Object.keys(event.metadata).length > 0 ? (
                          <button
                            onClick={() => {
                              alert("METADATA DUMP:\n\n" + JSON.stringify(event.metadata, null, 2));
                            }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all font-semibold text-xs flex items-center gap-1 ml-auto"
                            title="View Raw JSON"
                          >
                            <Database size={14} /> View
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs italic pr-2">none</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div >
  );
};

export default TimelineView;