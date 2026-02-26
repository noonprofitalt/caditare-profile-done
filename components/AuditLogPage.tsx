import React from 'react';
import AuditLogViewer from './Admin/AuditLogViewer';
import { Activity } from 'lucide-react';

const AuditLogPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Audit Trails</h1>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">
                            <Activity size={12} className="text-blue-500" />
                            <span>System Security & Activity Logs</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
                <AuditLogViewer />
            </div>
        </div>
    );
};

export default AuditLogPage;
