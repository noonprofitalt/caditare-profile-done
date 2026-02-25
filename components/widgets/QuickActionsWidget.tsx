import React from 'react';
import { FileEdit, Calendar, MessageCircle, Briefcase, FileText, Trash2, RefreshCw } from 'lucide-react';
import { Candidate, ProfileCompletionStatus } from '../../types';
import { Link } from 'react-router-dom';
import WorkflowEngine from '../../services/workflowEngine';

interface QuickActionsWidgetProps {
    candidate: Candidate;
    onDelete?: () => void;
    onGenerateReport?: () => void;
    isGeneratingReport?: boolean;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
    candidate,
    onDelete,
    onGenerateReport,
    isGeneratingReport = false
}) => {

    const actions = [];

    // Check policies for common actions
    const schedulePolicy = WorkflowEngine.canPerformAction(candidate, 'SCHEDULE_INTERVIEW');
    const assignPolicy = WorkflowEngine.canPerformAction(candidate, 'ASSIGN_TO_JOB');
    const deletePolicy = WorkflowEngine.canPerformAction(candidate, 'DELETE');

    // Complete Profile action (for incomplete profiles)
    if (candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
        actions.push({
            id: 'complete_profile',
            icon: FileEdit,
            label: 'Complete Profile',
            description: 'Fill in missing information',
            color: 'orange',
            link: `/applications/new?upgrade=${candidate.id}`,
            allowed: true
        });
    }

    // Schedule Interview
    actions.push({
        id: 'schedule_interview',
        icon: Calendar,
        label: 'Schedule Interview',
        description: schedulePolicy.allowed ? 'Set interview date and time' : schedulePolicy.reason,
        color: 'blue',
        allowed: schedulePolicy.allowed,
        onClick: () => alert('Interview scheduling coming soon!')
    });

    // Send Message
    actions.push({
        id: 'send_message',
        icon: MessageCircle,
        label: 'Send Message',
        description: 'Email or SMS to candidate',
        color: 'green',
        allowed: true,
        onClick: () => alert('Messaging coming soon!')
    });

    // Assign to Job
    actions.push({
        id: 'assign_job',
        icon: Briefcase,
        label: 'Assign to Job',
        description: assignPolicy.allowed ? 'Match with available position' : assignPolicy.reason,
        color: 'purple',
        allowed: assignPolicy.allowed,
        onClick: () => alert('Job assignment coming soon!')
    });

    // Generate Report
    actions.push({
        id: 'generate_report',
        icon: isGeneratingReport ? RefreshCw : FileText,
        label: isGeneratingReport ? 'Generating...' : 'Generate Report',
        description: isGeneratingReport ? 'Preparing PDF summary...' : 'Create PDF summary',
        color: 'indigo',
        allowed: !isGeneratingReport,
        onClick: onGenerateReport || (() => alert('Report generation coming soon!'))
    });

    const getColorClasses = (color: string, allowed: boolean) => {
        if (!allowed) return 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed grayscale opacity-60';

        switch (color) {
            case 'orange':
                return 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700';
            case 'blue':
                return 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700';
            case 'green':
                return 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700';
            case 'purple':
                return 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700';
            case 'indigo':
                return 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700';
            case 'red':
                return 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700';
            default:
                return 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded" />
                Quick Actions
            </h3>
            <div className="space-y-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    const content = (
                        <>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 bg-white rounded-lg border ${action.allowed ? 'border-slate-200' : 'border-slate-100'} ${isGeneratingReport && action.id === 'generate_report' ? 'animate-spin text-indigo-500 border-indigo-200' : ''}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{action.label}</div>
                                    <div className="text-xs opacity-75 mt-0.5">{action.description}</div>
                                </div>
                            </div>
                        </>
                    );

                    if (action.link && action.allowed) {
                        return (
                            <Link
                                key={`action-${action.id}`}
                                to={action.link}
                                className={`block p-3 rounded-lg border transition-colors ${getColorClasses(action.color, action.allowed)}`}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={`action-${action.id}`}
                            onClick={action.allowed ? action.onClick : undefined}
                            disabled={!action.allowed}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${getColorClasses(action.color, action.allowed)}`}
                        >
                            {content}
                        </button>
                    );
                })}

                {/* Delete Action */}
                {onDelete && (
                    <button
                        onClick={deletePolicy.allowed ? onDelete : undefined}
                        disabled={!deletePolicy.allowed}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${deletePolicy.allowed
                            ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed grayscale opacity-60'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 bg-white rounded-lg border ${deletePolicy.allowed ? 'border-red-200' : 'border-slate-100'}`}>
                                <Trash2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">Delete Candidate</div>
                                <div className="text-xs opacity-75 mt-0.5">{deletePolicy.allowed ? 'Permanently remove' : deletePolicy.reason}</div>
                            </div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuickActionsWidget;
