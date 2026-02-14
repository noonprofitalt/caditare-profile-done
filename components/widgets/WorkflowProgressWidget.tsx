import React from 'react';
import { Candidate, WorkflowStage } from '../../types';
import { Check, Circle, AlertCircle } from 'lucide-react';
import WorkflowEngine, { WORKFLOW_STAGES } from '../../services/workflowEngine.v2';

interface WorkflowProgressWidgetProps {
    candidate: Candidate;
    onStageClick?: (stage: WorkflowStage) => void;
    onAdvance?: () => void;
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded" />
                    Workflow Progress
                </span>
            </h3>

            {/* Compliance Alert - New Segment */}
            {hasBlockers && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-1">
                    <div className="flex items-start gap-2 mb-2">
                        <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                        <div className="text-xs font-bold text-amber-800 uppercase tracking-tight">Stage Blockers detected</div>
                    </div>
                    <ul className="space-y-1">
                        {validation.blockers.map((blocker, idx) => (
                            <li key={idx} className="text-[10px] text-amber-700 flex items-center gap-1.5 ml-1">
                                <span className="w-1 h-1 bg-amber-400 rounded-full" />
                                {blocker}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quick Actions for Strict Workflow */}
            {(onAdvance || onRollback) && (
                <div className="mb-4 flex gap-2">
                    {onRollback && (
                        <button
                            onClick={() => {
                                const reason = prompt("Reason for rollback:");
                                const prevStage = WorkflowEngine.getPreviousStage(candidate.stage);
                                if (reason && prevStage) onRollback(prevStage, reason);
                            }}
                            className="flex-1 py-2 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        >
                            Rollback
                        </button>
                    )}
                    {onAdvance && (
                        <button
                            onClick={onAdvance}
                            disabled={hasBlockers}
                            className={`flex-1 py-2 text-xs font-medium text-white rounded transition-all shadow-sm ${hasBlockers
                                ? 'bg-slate-300 cursor-not-allowed grayscale'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {hasBlockers ? 'Path Blocked' : 'Advance Stage'}
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {stages.map((item, index) => {
                    const status = getStageStatus(index);
                    const isClickable = onStageClick && status !== 'current';

                    return (
                        <div key={item.stage} className="relative">
                            {/* Connecting Line */}
                            {index < stages.length - 1 && (
                                <div
                                    className={`absolute left-[11px] top-[28px] w-0.5 h-6 ${status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                                        }`}
                                />
                            )}

                            {/* Stage Item */}
                            <button
                                onClick={() => isClickable && onStageClick?.(item.stage)}
                                disabled={!isClickable}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isClickable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                                    } ${status === 'current' ? 'bg-blue-50 border border-blue-200' : ''}`}
                            >
                                {/* Icon */}
                                <div className="relative flex-shrink-0">
                                    {status === 'completed' ? (
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    ) : status === 'current' ? (
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 border-2 border-slate-300 rounded-full flex items-center justify-center">
                                            <Circle size={10} className="text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex-1 text-left">
                                    <div
                                        className={`text-sm font-medium ${status === 'completed'
                                            ? 'text-green-700'
                                            : status === 'current'
                                                ? 'text-blue-700'
                                                : 'text-slate-500'
                                            }`}
                                    >
                                        {item.label}
                                    </div>
                                    {status === 'current' && (
                                        <div className="text-xs text-blue-600 mt-0.5">In Progress</div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                {status === 'completed' && (
                                    <div className="text-xs text-green-600 font-medium">✓</div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Next Stage Preview */}
            {currentStageIndex < stages.length - 1 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Next Stage</div>
                    <div className="text-sm font-medium text-slate-900">
                        {stages[currentStageIndex + 1].label}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowProgressWidget;
