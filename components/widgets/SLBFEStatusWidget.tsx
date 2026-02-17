import React from 'react';
import { Candidate, WorkflowStage } from '../../types';
import { SLBFEAutomationEngine } from '../../services/slbfe/SLBFEEngine';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Ticket } from 'lucide-react';

interface SLBFEStatusWidgetProps {
    candidate: Candidate;
}

const SLBFEStatusWidget: React.FC<SLBFEStatusWidgetProps> = ({ candidate }) => {
    // Only relevant if we are approaching Ticket stage or past it
    // But helpful to see always.

    // Check if relevant based on stage? 
    // Maybe hide if very early stage? Let's show it always but maybe collapsed or distinct.

    const report = SLBFEAutomationEngine.validateForTicketing(candidate);

    // Status Logic
    const isReady = report.isEligibleForTicketing;
    const completedCount = report.checklist.filter(i => i.status === 'Complete').length;
    const totalCount = report.checklist.length;

    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-purple-600" size={20} />
                    <h3 className="font-bold text-slate-800">SLBFE Compliance</h3>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full border ${isReady
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                    {isReady ? 'Ready for Ticketing' : 'In Progress'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Readiness</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isReady ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
                {report.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="mt-0.5">
                            {item.status === 'Complete' && <CheckCircle2 size={16} className="text-green-600" />}
                            {item.status === 'Failed' && <XCircle size={16} className="text-red-600" />}
                            {item.status === 'Pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${item.status === 'Complete' ? 'text-slate-700' : 'text-slate-500'}`}>
                                {item.label}
                            </p>
                            {item.details && (
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.details}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Certificate (Virtual) */}
            {isReady && report.certificate && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border border-green-100">
                        <Ticket size={20} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Deployment Authorized</p>
                        <p className="text-[10px] text-green-600 font-mono">{report.certificate.certificateId}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SLBFEStatusWidget;
