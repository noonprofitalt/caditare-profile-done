import React from 'react';
import { FileEdit, Calendar, MessageCircle, Briefcase, FileText, Trash2, RefreshCw, Zap } from 'lucide-react';
import { Candidate, ProfileCompletionStatus } from '../../types';
import { Link } from 'react-router-dom';
import WorkflowEngine from '../../services/workflowEngine';
import { useAuth } from '../../context/AuthContext';

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
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

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
        color: 'emerald',
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
                button: 'w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-70 flex items-center gap-3',
                icon: 'p-2 rounded-lg bg-slate-100 text-slate-400',
                title: 'text-sm font-semibold text-slate-500',
                subtitle: 'text-xs font-medium text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
            };
        }

        const baseButton = 'w-full text-left p-2.5 rounded-xl border flex items-center gap-3 transition-colors peer hover:z-10 bg-white ring-1 ring-transparent';
        const baseIcon = 'p-2 rounded-lg transition-colors flex-shrink-0';

        switch (color) {
            case 'orange':
                return {
                    button: `${baseButton} border-orange-100 hover:border-orange-300 hover:bg-orange-50/50 hover:ring-orange-100`,
                    icon: `${baseIcon} bg-orange-50 text-orange-600`,
                    title: 'text-sm font-semibold text-orange-900',
                    subtitle: 'text-xs font-medium text-orange-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            case 'blue':
                return {
                    button: `${baseButton} border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 hover:ring-blue-100`,
                    icon: `${baseIcon} bg-blue-50 text-blue-600`,
                    title: 'text-sm font-semibold text-blue-900',
                    subtitle: 'text-xs font-medium text-blue-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            case 'emerald':
                return {
                    button: `${baseButton} border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:ring-emerald-100`,
                    icon: `${baseIcon} bg-emerald-50 text-emerald-600`,
                    title: 'text-sm font-semibold text-emerald-900',
                    subtitle: 'text-xs font-medium text-emerald-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            case 'purple':
                return {
                    button: `${baseButton} border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 hover:ring-purple-100`,
                    icon: `${baseIcon} bg-purple-50 text-purple-600`,
                    title: 'text-sm font-semibold text-purple-900',
                    subtitle: 'text-xs font-medium text-purple-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            case 'indigo':
                return {
                    button: `${baseButton} border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 hover:ring-indigo-100`,
                    icon: `${baseIcon} bg-indigo-50 text-indigo-600`,
                    title: 'text-sm font-semibold text-indigo-900',
                    subtitle: 'text-xs font-medium text-indigo-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            case 'red':
                return {
                    button: `${baseButton} border-red-100 hover:border-red-300 hover:bg-red-50/50 hover:ring-red-100`,
                    icon: `${baseIcon} bg-red-50 text-red-600`,
                    title: 'text-sm font-semibold text-red-900',
                    subtitle: 'text-xs font-medium text-red-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
            default:
                return {
                    button: `${baseButton} border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:ring-slate-100`,
                    icon: `${baseIcon} bg-slate-50 text-slate-600`,
                    title: 'text-sm font-semibold text-slate-900',
                    subtitle: 'text-xs font-medium text-slate-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis'
                };
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Zap size={18} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Common operations
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-3">
                {actions.map((action) => {
                    const style = getColorStyle(action.color, action.allowed);
                    const Icon = action.icon;
                    const isGenerating = isGeneratingReport && action.id === 'generate_report';

                    const content = (
                        <>
                            <div className={style.icon}>
                                <Icon size={18} className={isGenerating ? "animate-spin" : ""} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={style.title}>{action.label}</div>
                                <div className={style.subtitle} title={action.description}>{action.description}</div>
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

                {/* Delete Action (Admins Only) */}
                {isAdmin && onDelete && (() => {
                    const style = getColorStyle('red', deletePolicy.allowed);
                    return (
                        <div className="pt-2"> {/* Tiny separator gap for destructive action */}
                            <button
                                onClick={deletePolicy.allowed ? onDelete : undefined}
                                disabled={!deletePolicy.allowed}
                                className={style.button}
                            >
                                <div className={style.icon}>
                                    <Trash2 size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={style.title}>Delete Candidate</div>
                                    <div className={style.subtitle} title={deletePolicy.allowed ? 'Permanently remove profile' : deletePolicy.reason}>
                                        {deletePolicy.allowed ? 'Permanently remove' : deletePolicy.reason}
                                    </div>
                                </div>
                            </button>
                        </div>
                    )
                })()}
            </div>
        </div>
    );
};

export default QuickActionsWidget;
