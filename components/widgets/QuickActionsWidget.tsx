import React from 'react';
import { FileEdit, Calendar, MessageCircle, Briefcase, FileText, Trash2 } from 'lucide-react';
import { Candidate, ProfileCompletionStatus } from '../../types';
import { Link } from 'react-router-dom';

interface QuickActionsWidgetProps {
    candidate: Candidate;
    onDelete?: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ candidate, onDelete }) => {
    const actions = [];

    // Complete Profile action (for incomplete profiles)
    if (candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
        actions.push({
            icon: FileEdit,
            label: 'Complete Profile',
            description: 'Fill in missing information',
            color: 'orange',
            link: `/applications/new?upgrade=${candidate.id}`
        });
    }

    // Schedule Interview
    actions.push({
        icon: Calendar,
        label: 'Schedule Interview',
        description: 'Set interview date and time',
        color: 'blue',
        onClick: () => alert('Interview scheduling coming soon!')
    });

    // Send Message
    actions.push({
        icon: MessageCircle,
        label: 'Send Message',
        description: 'Email or SMS to candidate',
        color: 'green',
        onClick: () => alert('Messaging coming soon!')
    });

    // Assign to Job
    actions.push({
        icon: Briefcase,
        label: 'Assign to Job',
        description: 'Match with available position',
        color: 'purple',
        onClick: () => alert('Job assignment coming soon!')
    });

    // Generate Report
    actions.push({
        icon: FileText,
        label: 'Generate Report',
        description: 'Create PDF summary',
        color: 'indigo',
        onClick: () => alert('Report generation coming soon!')
    });

    const getColorClasses = (color: string) => {
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
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    const content = (
                        <>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{action.label}</div>
                                    <div className="text-xs opacity-75 mt-0.5">{action.description}</div>
                                </div>
                            </div>
                        </>
                    );

                    if (action.link) {
                        return (
                            <Link
                                key={idx}
                                to={action.link}
                                className={`block p-3 rounded-lg border transition-colors ${getColorClasses(action.color)}`}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={idx}
                            onClick={action.onClick}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${getColorClasses(action.color)}`}
                        >
                            {content}
                        </button>
                    );
                })}

                {/* Delete Action */}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="w-full text-left p-3 rounded-lg border transition-colors bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border border-red-200">
                                <Trash2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">Delete Candidate</div>
                                <div className="text-xs opacity-75 mt-0.5">Permanently remove</div>
                            </div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuickActionsWidget;
