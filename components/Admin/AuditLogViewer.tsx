import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Activity, Filter, Search, Check, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    details: any;
    ip_address: string;
    created_at: string;
    user_id: string;
    user_email?: string; // Joined
    user_role?: string; // Joined
}

const MODULES = [
    'All Modules',
    'Jobs & Orders',
    'Candidates',
    'Partners',
    'Finance',
    'Documents',
    'Access Control',
    'System Setup',
    'General Engine'
];

const PAGE_SIZE = 50;

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hideLogins, setHideLogins] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('All Modules');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
        };

        if (showFilterDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilterDropdown]);

    const fetchLogs = async (isLoadMore = false) => {
        if (!isLoadMore) {
            setLoading(true);
            setPage(0);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        const currentPage = isLoadMore ? page + 1 : 0;

        try {
            const { data, error: fetchError } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (email, role)
                `)
                .order('created_at', { ascending: false })
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (fetchError) {
                console.error('Error fetching logs:', fetchError);
                setError(fetchError.message);
            } else if (data) {
                const formattedData = data.map(log => ({
                    ...log,
                    user_email: Array.isArray(log?.profiles) ? log.profiles[0]?.email : log?.profiles?.email,
                    user_role: Array.isArray(log?.profiles) ? log.profiles[0]?.role : log?.profiles?.role
                }));

                if (isLoadMore) {
                    setLogs(prev => {
                        const existingIds = new Set(prev.map(l => l.id));
                        const uniqueNew = formattedData.filter(l => !existingIds.has(l.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setLogs(formattedData);
                }

                setHasMore(data.length === PAGE_SIZE);
                setPage(currentPage);
            }
        } catch (err: any) {
            console.error('Exception fetching logs:', err);
            setError(err.message || 'An unexpected error occurred while fetching logs');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getModuleName = (action: string) => {
        if (!action || typeof action !== 'string') return 'General Engine';
        const a = action.toUpperCase();
        if (a.includes('CANDIDATE') || a.includes('SELECTION')) return 'Candidates';
        if (a.includes('DEMAND_ORDER') || a.includes('JOB')) return 'Jobs & Orders';
        if (a.includes('FINANCE') || a.includes('INVOICE')) return 'Finance';
        if (a.includes('EMPLOYER')) return 'Partners';
        if (a.includes('DOCUMENT')) return 'Documents';
        if (a.includes('USER') || a.includes('LOGIN') || a.includes('LOGOUT')) return 'Access Control';
        if (a.includes('SYSTEM') || a.includes('DIAGNOSTICS') || a.includes('WORKFLOW')) return 'System Setup';
        return 'General Engine';
    };

    const extractTargetId = (details: any) => {
        if (!details || typeof details !== 'object') return '-';
        const possibleIds = [
            details.candidateId, details.orderId, details.employerId,
            details.userId, details.targetUserId, details.documentId,
            details.jobId, details.selectionId, details.invoiceId
        ];
        const found = possibleIds.find(id => id !== undefined && id !== null);

        if (!found) return '-';
        const foundStr = String(found);
        return foundStr.length > 20 ? `${foundStr.substring(0, 8)}...` : foundStr;
    };

    const getSeverity = (action: string) => {
        if (!action || typeof action !== 'string') return { level: 'Low', color: 'text-green-700 bg-green-50 border-green-200' };
        const a = action.toUpperCase();
        if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('REJECT') || a.includes('FAIL') || a.includes('SECURITY') || a.includes('EXPORT') || a.includes('ERROR') || a.includes('FATAL')) {
            return { level: 'High', color: 'text-red-700 bg-red-50 border-red-200' };
        }
        if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY') || a.includes('ADVANCED') || a.includes('WORKFLOW') || a.includes('STATUS') || a.includes('INVOICE') || a.includes('PAYMENT') || a.includes('SETTINGS')) {
            return { level: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
        }
        return { level: 'Low', color: 'text-green-700 bg-green-50 border-green-200' };
    };

    const displayedLogs = useMemo(() => {
        return logs.filter(log => {
            const actionSafe = typeof log.action === 'string' ? log.action : '';

            // 1. Hide routine logins toggle
            if (hideLogins && (actionSafe.includes('LOGIN') || actionSafe.includes('LOGOUT'))) {
                return false;
            }

            // 2. Module Filter
            if (filterModule !== 'All Modules' && getModuleName(actionSafe) !== filterModule) {
                return false;
            }

            // 3. Deep search algorithm
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase().trim();

                const moduleName = getModuleName(actionSafe).toLowerCase();
                const actionStr = actionSafe.toLowerCase().replace(/_/g, ' ');
                const emailStr = (log.user_email || 'System Service').toLowerCase();
                const roleStr = (log.user_role || '').toLowerCase();
                const idStr = (log.user_id || '').toLowerCase();
                const targetIdStr = String(extractTargetId(log.details) || '').toLowerCase();
                const ipStr = (log.ip_address || '').toLowerCase();

                let detailsStr = '';
                try {
                    detailsStr = typeof log.details === 'object' && log.details !== null ? JSON.stringify(log.details).toLowerCase() : '';
                } catch (e) {
                    detailsStr = '';
                }

                const matches =
                    moduleName.includes(query) ||
                    actionStr.includes(query) ||
                    emailStr.includes(query) ||
                    roleStr.includes(query) ||
                    idStr.includes(query) ||
                    targetIdStr.includes(query) ||
                    ipStr.includes(query) ||
                    detailsStr.includes(query);

                if (!matches) {
                    return false;
                }
            }

            return true;
        });
    }, [logs, hideLogins, searchQuery, filterModule]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Audit Logs
                        {loading && !loadingMore && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                    </h2>
                    <p className="text-slate-500 text-sm">System activity and security events</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Refresh Logs"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search user, action, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 bg-slate-50 focus:bg-white transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setHideLogins(!hideLogins)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${hideLogins ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Hide Routine Logins
                    </button>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 outline-none ${filterModule !== 'All Modules' || showFilterDropdown ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
                        >
                            <Filter size={16} className={filterModule !== 'All Modules' ? 'text-blue-500' : 'text-slate-400'} />
                            <span className={`text-xs font-semibold ${filterModule !== 'All Modules' ? 'text-blue-700' : 'text-slate-600'}`}>
                                {filterModule !== 'All Modules' ? filterModule : 'Filter'}
                            </span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''} ${filterModule !== 'All Modules' ? 'text-blue-400' : 'text-slate-400'}`} />
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Filter by Module
                                    </span>
                                </div>
                                <div className="p-1 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    {MODULES.map(mod => (
                                        <button
                                            key={mod}
                                            onClick={() => {
                                                setFilterModule(mod);
                                                setShowFilterDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${filterModule === mod ? 'bg-blue-50/80 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                        >
                                            <span>{mod}</span>
                                            {filterModule === mod && (
                                                <Check size={14} className="text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="overflow-x-auto rounded-b-xl flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Module</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && logs.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`skeleton-${i}`} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                </tr>
                            ))
                        ) : displayedLogs.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    No activity logs found for your current filters.
                                </td>
                            </tr>
                        ) : (
                            displayedLogs.map(log => {
                                const actionSafe = typeof log.action === 'string' ? log.action : 'UNKNOWN';
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 leading-tight flex items-center gap-2">
                                                {log.user_email || 'System'}
                                                {log.user_role && <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-1 inline-block rounded">{log.user_role}</span>}
                                            </div>
                                            {log.user_id && (
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5" title={log.user_id}>
                                                    {log.user_id.substring(0, 8)}...
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-medium text-xs whitespace-nowrap">
                                                {getModuleName(actionSafe)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 text-[10px] font-bold tracking-tight uppercase shadow-sm whitespace-nowrap">
                                                {actionSafe.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSeverity(actionSafe).color}`}>
                                                {getSeverity(actionSafe).level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                                {log.details && typeof log.details === 'object' && !Array.isArray(log.details) && Object.keys(log.details).length > 0 ? (
                                                    Object.entries(log.details).map(([k, v]) => {
                                                        const skipKeys = ['candidateId', 'orderId', 'employerId', 'userId', 'targetUserId', 'jobId', 'selectionId', 'invoiceId'];
                                                        if (skipKeys.includes(k)) return null;

                                                        return (
                                                            <div key={k} className="text-[11px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded leading-tight flex items-start max-w-full">
                                                                <span className="text-slate-400 capitalize mr-1 whitespace-nowrap">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                <span className="font-mono text-slate-700 font-medium truncate" title={typeof v === 'object' ? '{...}' : String(v)}>
                                                                    {typeof v === 'object' ? '{...}' : String(v)}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">No additional context</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-green-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                <span className="text-[10px] uppercase font-bold tracking-wider">Success</span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{log.ip_address}</div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && displayedLogs.length > 0 && (
                <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50 mt-auto rounded-b-xl">
                    {hasMore ? (
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loadingMore && <RefreshCw size={14} className="animate-spin" />}
                            {loadingMore ? 'Crunching logs...' : 'Load Older Logs'}
                        </button>
                    ) : (
                        <span className="text-slate-400 text-sm italic">You've reached the end of the audit trail</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
