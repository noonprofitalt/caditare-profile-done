import React from 'react';
import { Candidate } from '../../types';
import { SLBFEAutomationEngine } from '../../services/slbfe/SLBFEEngine';
import { CheckCircle2, XCircle, ShieldCheck, Ticket } from 'lucide-react';

interface SLBFEStatusWidgetProps {
    candidate: Candidate;
}

const SLBFEStatusWidget: React.FC<SLBFEStatusWidgetProps> = ({ candidate }) => {
    const report = SLBFEAutomationEngine.validateForTicketing(candidate);

    const isReady = report.isEligibleForTicketing;
    const completedCount = report.checklist.filter(i => i.status === 'Complete').length;
    const totalCount = report.checklist.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ShieldCheck size={18} className="text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">SLBFE Compliance</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {completedCount}/{totalCount} requirements met
                        </p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${isReady
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                    {isReady ? 'Ready' : 'In Progress'}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-5 pb-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="uppercase tracking-wider">Readiness</span>
                    <span className="text-slate-600">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Checklist */}
            <div className="px-6 py-4 divide-y divide-slate-100">
                {report.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 py-3.5 first:pt-1">
                        <div className="mt-0.5 shrink-0">
                            {item.status === 'Complete' && <CheckCircle2 size={18} className="text-green-500" />}
                            {item.status === 'Failed' && <XCircle size={18} className="text-red-500" />}
                            {item.status === 'Pending' && <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.status === 'Complete' ? 'text-slate-800' : 'text-slate-500'}`}>
                                {item.label}
                            </p>
                            {item.details && (
                                <p className="text-xs text-slate-400 mt-1 font-mono">{item.details}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Deployment Certificate */}
            {isReady && report.certificate && (
                <div className="mx-6 mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl border border-green-100 shrink-0">
                        <Ticket size={20} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Deployment Authorized</p>
                        <p className="text-[11px] text-green-600 font-mono mt-0.5">{report.certificate.certificateId}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SLBFEStatusWidget;
