import React from 'react';
import { Candidate, WorkflowStage } from '../../types';
import { Check, Circle, AlertCircle, FastForward, RotateCcw } from 'lucide-react';
import WorkflowEngine, { WORKFLOW_STAGES } from '../../services/workflowEngine.v2';

interface WorkflowProgressWidgetProps {
    candidate: Candidate;
    onStageClick?: (stage: WorkflowStage) => void;
    onAdvance?: (forceOverride?: boolean) => void;
    onRollback?: (stage: WorkflowStage, reason: string) => void;
}

const STAGE_LABELS: Record<WorkflowStage, string> = {
    [WorkflowStage.REGISTERED]: 'Registration',
    [WorkflowStage.VERIFIED]: 'Verification',
    [WorkflowStage.APPLIED]: 'Applied',
    [WorkflowStage.OFFER_RECEIVED]: 'Offer Received',
    [WorkflowStage.WP_RECEIVED]: 'WP Received',
    [WorkflowStage.EMBASSY_APPLIED]: 'Embassy Applied',
    [WorkflowStage.VISA_RECEIVED]: 'Visa Received',
    [WorkflowStage.SLBFE_REGISTRATION]: 'SLBFE Registration',
    [WorkflowStage.TICKET_ISSUED]: 'Ticket Issued',
    [WorkflowStage.DEPARTED]: 'Departure'
};

const STAGE_MILESTONE_KEYS: Partial<Record<WorkflowStage, string>> = {
    [WorkflowStage.VERIFIED]: 'verifiedDate',
    [WorkflowStage.APPLIED]: 'offerAppliedDate',
    [WorkflowStage.OFFER_RECEIVED]: 'offerReceivedDate',
    [WorkflowStage.WP_RECEIVED]: 'wpReceivedDate',
    [WorkflowStage.EMBASSY_APPLIED]: 'embAppliedDate',
    [WorkflowStage.VISA_RECEIVED]: 'stampRejectDate',
    [WorkflowStage.SLBFE_REGISTRATION]: 'slbfeRegistrationDate',
    [WorkflowStage.TICKET_ISSUED]: 'ticketIssuedDate',
    [WorkflowStage.DEPARTED]: 'departureDate'
};

const WorkflowProgressWidget: React.FC<WorkflowProgressWidgetProps> = ({ candidate, onStageClick, onAdvance, onRollback }) => {
    const stages = WORKFLOW_STAGES.map(stage => ({
        stage,
        label: STAGE_LABELS[stage]
    }));

    const currentStageIndex = stages.findIndex(s => s.stage === candidate.stage);
    const nextStage = currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1].stage : null;

    // Live validation for the next stage
    const validation = nextStage ? WorkflowEngine.validateTransition(candidate, nextStage) : null;
    const hasBlockers = !!(validation && !validation.allowed);

    const getStageStatus = (index: number) => {
        if (index < currentStageIndex) return 'completed';
        if (index === currentStageIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FastForward size={14} className="text-blue-500" />
                        Workflow Progress
                    </h3>
                    {nextStage && (
                        <div className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded shadow-sm">
                            Next: <span className="text-slate-800">{STAGE_LABELS[nextStage as WorkflowStage]}</span>
                        </div>
                    )}
                </div>

                {/* Compliance Alert */}
                {hasBlockers && (
                    <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[10px] font-bold text-red-700 uppercase tracking-tight mb-0.5">Blockers detected</div>
                            <ul className="space-y-0.5">
                                {validation?.blockers.map((blocker, idx) => (
                                    <li key={idx} className="text-[10px] font-medium text-red-600 flex items-start gap-1.5 leading-tight">
                                        <span className="w-1 h-1 bg-red-400 rounded-full mt-1.5 shrink-0" />
                                        <span>{blocker}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {(onAdvance || onRollback) && (
                    <div className="flex gap-2 w-full mt-1">
                        {onRollback && (
                            <button
                                onClick={() => {
                                    const reason = prompt("Reason for rollback:");
                                    const prevStage = WorkflowEngine.getPreviousStage(candidate.stage);
                                    if (reason && prevStage) onRollback(prevStage, reason);
                                }}
                                className="flex-1 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors flex justify-center items-center gap-1.5"
                            >
                                <RotateCcw size={12} />
                                Rollback
                            </button>
                        )}
                        {onAdvance && (
                            <button
                                onClick={() => onAdvance(hasBlockers)}
                                className={`flex-1 py-1.5 text-[11px] font-bold text-white rounded transition-all shadow-sm flex justify-center items-center gap-1.5 ${hasBlockers
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    }`}
                            >
                                {hasBlockers ? 'Override' : 'Advance'}
                                <FastForward size={12} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Stepper Content */}
            <div className="p-4 py-3">
                <div className="space-y-0 relative">
                    {/* Continuous Line behind */}
                    <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-slate-100 z-0"></div>

                    {stages.map((item, index) => {
                        const status = getStageStatus(index);
                        const isClickable = onStageClick && status !== 'current';

                        let milestoneDate = null;
                        if (item.stage === WorkflowStage.REGISTERED) {
                            milestoneDate = candidate.regDate ? new Date(candidate.regDate).toLocaleDateString() : null;
                        } else {
                            const key = STAGE_MILESTONE_KEYS[item.stage];
                            if (key && candidate.workflowMilestones) {
                                const dateStr = (candidate.workflowMilestones as any)[key];
                                if (dateStr) milestoneDate = dateStr;
                            }
                        }

                        return (
                            <div key={item.stage} className="relative z-10 flex items-start gap-3 py-1.5 group">
                                <button
                                    onClick={() => isClickable && onStageClick?.(item.stage)}
                                    disabled={!isClickable}
                                    className={`flex items-center gap-3 w-full focus:outline-none ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    {/* Icon */}
                                    <div className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white">
                                        {status === 'completed' ? (
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                                <Check size={10} className="text-white" strokeWidth={3} />
                                            </div>
                                        ) : status === 'current' ? (
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                                            </div>
                                        ) : (
                                            <div className="w-3 h-3 border-2 border-slate-200 bg-white rounded-full group-hover:border-slate-300 transition-colors" />
                                        )}
                                    </div>

                                    {/* Label & Date */}
                                    <div className="flex-1 text-left min-w-0 flex items-center justify-between">
                                        <div className="flex flex-col justify-center">
                                            <span
                                                className={`text-xs font-semibold truncate ${status === 'completed'
                                                    ? 'text-slate-700'
                                                    : status === 'current'
                                                        ? 'text-blue-700'
                                                        : 'text-slate-400 group-hover:text-slate-500 transition-colors'
                                                    }`}
                                            >
                                                {item.label}
                                            </span>
                                            {status === 'current' && (
                                                <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider inline-block">In Progress</span>
                                            )}
                                        </div>
                                        {milestoneDate && status !== 'current' && (
                                            <span className="text-[10px] font-medium text-slate-400">{milestoneDate}</span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkflowProgressWidget;
