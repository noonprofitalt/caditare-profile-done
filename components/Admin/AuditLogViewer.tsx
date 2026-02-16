
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Activity, Search, Filter } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    details: any;
    ip_address: string;
    created_at: string;
    user_id: string;
    user_email?: string; // Joined
}

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching logs:', error);
            } else {
                setLogs(data?.map(log => ({
                    ...log,
                    user_email: log.profiles?.email
                })) || []);
            }
            setLoading(false);
        };

        fetchLogs();
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Audit Logs</h2>
                    <p className="text-slate-500 text-sm">System activity and security events</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600">
                    <Filter size={18} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No activity logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {log.user_email || 'Unknown System'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {log.ip_address}
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
