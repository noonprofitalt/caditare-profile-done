
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Activity, Filter, Search, Check, ChevronDown } from 'lucide-react';

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

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (email, role)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching logs:', error);
            } else {
                setLogs(data?.map(log => ({
                    ...log,
                    user_email: log.profiles?.email,
                    user_role: log.profiles?.role
                })) || []);
            }
            setLoading(false);
        };

        fetchLogs();
    }, []);

    const getModuleName = (action: string) => {
        if (action.includes('CANDIDATE') || action.includes('SELECTION')) return 'Candidates';
        if (action.includes('DEMAND_ORDER') || action.includes('JOB')) return 'Jobs & Orders';
        if (action.includes('FINANCE') || action.includes('INVOICE')) return 'Finance';
        if (action.includes('EMPLOYER')) return 'Partners';
        if (action.includes('DOCUMENT')) return 'Documents';
        if (action.includes('USER') || action.includes('LOGIN') || action.includes('LOGOUT')) return 'Access Control';
        if (action.includes('SYSTEM') || action.includes('DIAGNOSTICS') || action.includes('WORKFLOW')) return 'System Setup';
        return 'General Engine';
    };

    const extractTargetId = (details: any) => {
        if (!details) return '-';
        const possibleIds = [
            details.candidateId, details.orderId, details.employerId,
            details.userId, details.targetUserId, details.documentId,
            details.jobId, details.selectionId, details.invoiceId
        ];
        const found = possibleIds.find(id => id !== undefined && id !== null);

        if (!found) return '-';
        // Format UUIDs to be shorter and cleaner (e.g. first 8 chars)
        return typeof found === 'string' && found.length > 20 ? `${found.substring(0, 8)}...` : found;
    };

    const getSeverity = (action: string) => {
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
            // 1. Hide routine logins toggle
            if (hideLogins && (log.action.includes('LOGIN') || log.action.includes('LOGOUT'))) {
                return false;
            }

            // 2. Module Filter
            if (filterModule !== 'All Modules' && getModuleName(log.action) !== filterModule) {
                return false;
            }

            // 3. Deep search algorithm
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase().trim();

                const moduleName = getModuleName(log.action).toLowerCase();
                const actionStr = log.action.toLowerCase().replace(/_/g, ' ');
                const emailStr = (log.user_email || 'System Service').toLowerCase();
                const roleStr = (log.user_role || '').toLowerCase();
                const idStr = log.user_id.toLowerCase();
                const targetIdStr = extractTargetId(log.details).toLowerCase();
                const ipStr = (log.ip_address || '').toLowerCase();

                // Stringify the details object safely to allow deep searching inside properties
                let detailsStr = '';
                try {
                    detailsStr = JSON.stringify(log.details || {}).toLowerCase();
                } catch (e) {
                    detailsStr = '';
                }

                // If any of these fields match the query, we keep the log
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

    const formatDetails = (details: any) => {
        if (!details || Object.keys(details).length === 0) return <span className="text-slate-400 italic">No additional details recorded</span>;

        return (
            <div className="flex flex-col gap-1">
                {Object.entries(details).map(([key, value]) => {
                    // Filter out raw JSON representation if it's too long, or format it nicely
                    if (typeof value === 'object') {
                        return (
                            <div key={key} className="text-xs">
                                <span className="font-semibold text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="text-slate-500 ml-1">Object Updated</span>
                            </div>
                        )
                    }
                    return (
                        <div key={key} className="text-xs">
                            <span className="font-semibold text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-slate-700 ml-1 font-mono bg-slate-100 px-1 py-0.5 rounded outline outline-1 outline-slate-200">{String(value)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Audit Logs</h2>
                    <p className="text-slate-500 text-sm">System activity and security events</p>
                </div>
                <div className="flex items-center gap-3">
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

            <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Module</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4">Target Entity ID</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                </tr>
                            ))
                        ) : displayedLogs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                    No activity logs found.
                                </td>
                            </tr>
                        ) : (
                            displayedLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 leading-tight flex items-center gap-2">
                                            {log.user_email || 'System'}
                                            {log.user_role && <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-1 inline-block rounded">{log.user_role}</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5" title={log.user_id}>{log.user_id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600 font-medium text-xs">
                                            {getModuleName(log.action)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 text-[10px] font-bold tracking-tight uppercase shadow-sm">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSeverity(log.action).color}`}>
                                            {getSeverity(log.action).level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {extractTargetId(log.details)}
                                    </td>
                                    <td className="px-4 py-3 max-w-sm">
                                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                                            {log.details && Object.keys(log.details).length > 0 ? (
                                                Object.entries(log.details).map(([k, v]) => {
                                                    // Don't clutter details with IDs we already extracted
                                                    const skipKeys = ['candidateId', 'orderId', 'employerId', 'userId', 'targetUserId', 'jobId', 'selectionId', 'invoiceId'];
                                                    if (skipKeys.includes(k)) return null;

                                                    return (
                                                        <div key={k} className="text-[11px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded leading-tight">
                                                            <span className="text-slate-400 capitalize mr-1">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                            <span className="font-mono text-slate-700 font-medium">
                                                                {typeof v === 'object' ? '{...}' : String(v).length > 30 ? String(v).substring(0, 30) + '...' : String(v)}
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
                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{log.ip_address}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogViewer;
