import React from 'react';
import { Candidate, WorkflowStage } from '../../types';
import { Check, Circle } from 'lucide-react';

interface WorkflowProgressWidgetProps {
    candidate: Candidate;
    onStageClick?: (stage: WorkflowStage) => void;
}

const WorkflowProgressWidget: React.FC<WorkflowProgressWidgetProps> = ({ candidate, onStageClick }) => {
    const stages: { stage: WorkflowStage; label: string }[] = [
        { stage: WorkflowStage.REGISTRATION, label: 'Registration' },
        { stage: WorkflowStage.VERIFICATION, label: 'Verification' },
        { stage: WorkflowStage.APPLIED, label: 'Applied' },
        { stage: WorkflowStage.OFFER_RECEIVED, label: 'Offer Received' },
        { stage: WorkflowStage.WP_RECEIVED, label: 'WP Received' },
        { stage: WorkflowStage.EMBASSY_APPLIED, label: 'Embassy Applied' },
        { stage: WorkflowStage.VISA_RECEIVED, label: 'Visa Received' },
        { stage: WorkflowStage.SLBFE_REGISTRATION, label: 'SLBFE Registration' },
        { stage: WorkflowStage.TICKET, label: 'Ticket Issued' },
        { stage: WorkflowStage.DEPARTURE, label: 'Departure' }
    ];

    const currentStageIndex = stages.findIndex(s => s.stage === candidate.stage);

    const getStageStatus = (index: number) => {
        if (index < currentStageIndex) return 'completed';
        if (index === currentStageIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded" />
                Workflow Progress
            </h3>
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
