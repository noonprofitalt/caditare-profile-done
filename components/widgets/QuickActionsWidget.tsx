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

    const getColorStyle = (color: string, allowed: boolean) => {
        if (!allowed) {
            return {
                button: 'w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-70 flex items-center gap-3 transition-all',
                icon: 'p-2 rounded-lg border border-slate-200 bg-white text-slate-400',
                title: 'font-semibold text-sm text-slate-500',
                subtitle: 'text-xs text-slate-400 mt-0.5'
            };
        }

        const baseButton = 'w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all group bg-white shadow-sm hover:shadow';
        const baseIcon = 'p-2 rounded-lg border transition-colors bg-white';

        switch (color) {
            case 'orange':
                return {
                    button: `${baseButton} border-orange-200 hover:bg-orange-50 hover:border-orange-300`,
                    icon: `${baseIcon} border-orange-200 text-orange-600 group-hover:bg-orange-100 group-hover:border-orange-300`,
                    title: 'font-semibold text-sm text-orange-700',
                    subtitle: 'text-xs text-orange-600/80 mt-0.5'
                };
            case 'blue':
                return {
                    button: `${baseButton} border-blue-200 hover:bg-blue-50 hover:border-blue-300`,
                    icon: `${baseIcon} border-blue-200 text-blue-600 group-hover:bg-blue-100 group-hover:border-blue-300`,
                    title: 'font-semibold text-sm text-blue-700',
                    subtitle: 'text-xs text-blue-600/80 mt-0.5'
                };
            case 'green':
                return {
                    button: `${baseButton} border-green-200 hover:bg-green-50 hover:border-green-300`,
                    icon: `${baseIcon} border-green-200 text-green-600 group-hover:bg-green-100 group-hover:border-green-300`,
                    title: 'font-semibold text-sm text-green-700',
                    subtitle: 'text-xs text-green-600/80 mt-0.5'
                };
            case 'purple':
                return {
                    button: `${baseButton} border-purple-200 hover:bg-purple-50 hover:border-purple-300`,
                    icon: `${baseIcon} border-purple-200 text-purple-600 group-hover:bg-purple-100 group-hover:border-purple-300`,
                    title: 'font-semibold text-sm text-purple-700',
                    subtitle: 'text-xs text-purple-600/80 mt-0.5'
                };
            case 'indigo':
                return {
                    button: `${baseButton} border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300`,
                    icon: `${baseIcon} border-indigo-200 text-indigo-600 group-hover:bg-indigo-100 group-hover:border-indigo-300`,
                    title: 'font-semibold text-sm text-indigo-700',
                    subtitle: 'text-xs text-indigo-600/80 mt-0.5'
                };
            case 'red':
                return {
                    button: `${baseButton} border-red-200 hover:bg-red-50 hover:border-red-300`,
                    icon: `${baseIcon} border-red-200 text-red-600 group-hover:bg-red-100 group-hover:border-red-300`,
                    title: 'font-semibold text-sm text-red-700',
                    subtitle: 'text-xs text-red-600/80 mt-0.5'
                };
            default:
                return {
                    button: `${baseButton} border-slate-200 hover:bg-slate-50 hover:border-slate-300`,
                    icon: `${baseIcon} border-slate-200 text-slate-600 group-hover:bg-slate-100 group-hover:border-slate-300`,
                    title: 'font-semibold text-sm text-slate-700',
                    subtitle: 'text-xs text-slate-500 mt-0.5'
                };
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
                Quick Actions
            </h3>
            <div className="space-y-3">
                {actions.map((action) => {
                    const style = getColorStyle(action.color, action.allowed);
                    const Icon = action.icon;
                    const isGenerating = isGeneratingReport && action.id === 'generate_report';

                    const content = (
                        <>
                            <div className={style.icon}>
                                <Icon size={18} className={isGenerating ? "animate-spin" : ""} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={style.title}>{action.label}</div>
                                <div className={style.subtitle}>{action.description}</div>
                            </div>
                        </>
                    );

                    if (action.link && action.allowed) {
                        return (
                            <Link
                                key={`action-${action.id}`}
                                to={action.link}
                                className={style.button}
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
                            className={style.button}
                        >
                            {content}
                        </button>
                    );
                })}

                {/* Delete Action */}
                {onDelete && (() => {
                    const style = getColorStyle('red', deletePolicy.allowed);
                    return (
                        <button
                            onClick={deletePolicy.allowed ? onDelete : undefined}
                            disabled={!deletePolicy.allowed}
                            className={style.button}
                        >
                            <div className={style.icon}>
                                <Trash2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={style.title}>Delete Candidate</div>
                                <div className={style.subtitle}>{deletePolicy.allowed ? 'Permanently remove' : deletePolicy.reason}</div>
                            </div>
                        </button>
                    )
                })()}
            </div>
        </div>
    );
};

export default QuickActionsWidget;
