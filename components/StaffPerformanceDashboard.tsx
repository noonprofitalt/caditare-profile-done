import React, { useState } from 'react';
import { StaffPerformanceMetric } from '../types';
import {
    ArrowLeft, Upload, MessageSquare,
    LogIn, ChevronRight, UserPlus, Edit3, Shield,
    Layers, Clock, Activity
} from 'lucide-react';

// ─── Formatting Helpers ──────────────────────────────────────────────────

const fmtDuration = (mins: number): string => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const timeAgo = (d: string): string => {
    if (!d) return 'Never';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRoleStyle = (role: string): string => {
    const styles: Record<string, string> = {
        Admin: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-500/20',
        Manager: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-500/20',
        Recruiter: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-500/20',
        HR: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-500/20',
        Finance: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20',
        Viewer: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20',
    };
    return styles[role] || styles.Viewer;
};

// ─── INDIVIDUAL DETAIL VIEW ──────────────────────────────────────────────

const StaffDetail: React.FC<{ s: StaffPerformanceMetric; onBack: () => void }> = ({ s, onBack }) => {
    const wb = s.workBreakdown;
    const totalWork = wb.candidatesCreated + wb.candidatesUpdated + wb.documentsUploaded + wb.chatMessagesSent + wb.usersManaged + wb.bulkExports + wb.otherActions;

    const workItems = [
        { label: 'Candidates Registered', val: wb.candidatesCreated, icon: UserPlus, color: '#10b981' },
        { label: 'Candidates Updated', val: wb.candidatesUpdated, icon: Edit3, color: '#3b82f6' },
        { label: 'Documents Uploaded', val: wb.documentsUploaded, icon: Upload, color: '#f59e0b' },
        { label: 'Chat Messages', val: wb.chatMessagesSent, icon: MessageSquare, color: '#8b5cf6' },
        { label: 'User Management', val: wb.usersManaged, icon: Shield, color: '#ef4444' },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-100 pb-4">
                <button onClick={onBack} className="p-2 sm:p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm shrink-0 mt-1 sm:mt-0">
                    <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{s.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(s.role)}`}>
                            {s.role}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 truncate">{s.email}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'WORKLOAD SCORE', value: totalWork, icon: Layers },
                    { label: 'TOTAL SESSIONS', value: s.totalSessions, icon: LogIn },
                    { label: 'UPTIME LOGGED', value: fmtDuration(s.totalUptimeMinutes), icon: Clock },
                    { label: 'AVG SESSION', value: fmtDuration(s.avgSessionMinutes), icon: Clock },
                ].map((k) => (
                    <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{k.label}</p>
                            <k.icon size={16} className="text-slate-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight truncate">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="text-blue-500" size={16} /> History Breakdown
                    </h3>
                    <div className="space-y-5">
                        {workItems.map((w) => {
                            const max = Math.max(...workItems.map(x => x.val), 1);
                            const pct = Math.max((w.val / max) * 100, 2);
                            return (
                                <div key={w.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <w.icon size={14} style={{ color: w.color }} />
                                            <span className="text-xs font-semibold text-slate-700">{w.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{w.val.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: w.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="text-indigo-500" size={16} /> Recent Sessions
                    </h3>
                    {s.sessions.length > 0 ? (
                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 min-h-[250px] sm:min-h-0">
                            {[...s.sessions].reverse().slice(0, 15).map((sess, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                            <LogIn size={14} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {new Date(sess.loginTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                                {new Date(sess.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                {' → '}
                                                {sess.logoutTime ? new Date(sess.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-600">Active</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{fmtDuration(sess.durationMinutes)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <span className="text-sm">No recent sessions</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN OVERVIEW ───────────────────────────────────────────────────────

interface Props {
    staffMetrics: StaffPerformanceMetric[];
}

const StaffPerformanceDashboard: React.FC<Props> = ({ staffMetrics }) => {
    const [selected, setSelected] = useState<StaffPerformanceMetric | null>(null);

    if (selected) return <StaffDetail s={selected} onBack={() => setSelected(null)} />;

    // Sorting
    const sortedMetrics = [...staffMetrics].sort((a, b) => {
        const aWork = a.workBreakdown.candidatesCreated + a.workBreakdown.candidatesUpdated + a.workBreakdown.documentsUploaded + a.workBreakdown.chatMessagesSent + a.workBreakdown.usersManaged + a.workBreakdown.bulkExports + a.workBreakdown.otherActions;
        const bWork = b.workBreakdown.candidatesCreated + b.workBreakdown.candidatesUpdated + b.workBreakdown.documentsUploaded + b.workBreakdown.chatMessagesSent + b.workBreakdown.usersManaged + b.workBreakdown.bulkExports + b.workBreakdown.otherActions;
        return bWork - aWork;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 -mx-4 sm:mx-0">
                <div className="min-w-[800px] px-4 sm:px-0">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold text-slate-600">Employee</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Candidates</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Documents</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Updates</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Total Workload</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Uptime</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedMetrics.map((s) => {
                                const totalWork = s.workBreakdown.candidatesCreated + s.workBreakdown.candidatesUpdated +
                                    s.workBreakdown.documentsUploaded + s.workBreakdown.chatMessagesSent +
                                    s.workBreakdown.usersManaged + s.workBreakdown.bulkExports + s.workBreakdown.otherActions;

                                return (
                                    <tr
                                        key={s.userId}
                                        onClick={() => setSelected(s)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner border border-slate-200">
                                                    {s.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{s.name}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${getRoleStyle(s.role)}`}>
                                                {s.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${s.workBreakdown.candidatesCreated > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {s.workBreakdown.candidatesCreated.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${s.workBreakdown.documentsUploaded > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {s.workBreakdown.documentsUploaded.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${s.workBreakdown.candidatesUpdated > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {s.workBreakdown.candidatesUpdated.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center">
                                                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                                                    {totalWork.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-slate-700 leading-tight">{fmtDuration(s.totalUptimeMinutes)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.totalSessions} sn</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${timeAgo(s.lastActive) === 'Just now' || timeAgo(s.lastActive).includes('m ago') ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {timeAgo(s.lastActive)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {sortedMetrics.length === 0 && (
                    <div className="py-16 text-center">
                        <Activity className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No performance metrics recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffPerformanceDashboard;
