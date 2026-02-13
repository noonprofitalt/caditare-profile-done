import React from 'react';
import { Activity, Calendar, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MedicalStatus } from '../../types';

interface MedicalStatusInputProps {
    status: MedicalStatus;
    scheduledDate?: string;
    completedDate?: string;
    bloodGroup?: string;
    allergies?: string;
    notes?: string;
    onStatusChange: (status: MedicalStatus) => void;
    onScheduledDateChange: (date: string) => void;
    onCompletedDateChange: (date: string) => void;
    onBloodGroupChange: (bloodGroup: string) => void;
    onAllergiesChange: (allergies: string) => void;
    onNotesChange: (notes: string) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MedicalStatusInput: React.FC<MedicalStatusInputProps> = ({
    status,
    scheduledDate,
    completedDate,
    bloodGroup,
    allergies,
    notes,
    onStatusChange,
    onScheduledDateChange,
    onCompletedDateChange,
    onBloodGroupChange,
    onAllergiesChange,
    onNotesChange
}) => {
    // Check if scheduled date is overdue
    const isOverdue = (): boolean => {
        if (status !== MedicalStatus.SCHEDULED || !scheduledDate) return false;
        const scheduled = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scheduled < today;
    };

    // Get status icon and color
    const getStatusDisplay = (medicalStatus: MedicalStatus): {
        icon: React.ComponentType<{ size?: number; className?: string }>;
        color: string;
        bgColor: string;
        borderColor: string;
        label: string;
    } => {
        switch (medicalStatus) {
            case MedicalStatus.NOT_STARTED:
                return {
                    icon: Clock,
                    color: 'text-slate-500',
                    bgColor: 'bg-slate-100',
                    borderColor: 'border-slate-300',
                    label: 'Not Started'
                };
            case MedicalStatus.SCHEDULED:
                return {
                    icon: Calendar,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    borderColor: 'border-blue-300',
                    label: 'Scheduled'
                };
            case MedicalStatus.COMPLETED:
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    borderColor: 'border-green-300',
                    label: 'Completed'
                };
            case MedicalStatus.FAILED:
                return {
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    borderColor: 'border-red-300',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-slate-500',
                    bgColor: 'bg-slate-100',
                    borderColor: 'border-slate-300',
                    label: 'Not Started'
                };
        }
    };

    const currentStatus = getStatusDisplay(status);
    const StatusIcon = currentStatus.icon;

    return (
        <div className="space-y-4">
            {/* Medical Status Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Medical Status <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.values(MedicalStatus).map((medicalStatus) => {
                        const display = getStatusDisplay(medicalStatus);
                        const Icon = display.icon;
                        const isSelected = status === medicalStatus;

                        return (
                            <button
                                key={medicalStatus}
                                type="button"
                                onClick={() => onStatusChange(medicalStatus)}
                                className={`p-3 rounded-lg border-2 transition-all ${isSelected
                                    ? `${display.borderColor} ${display.bgColor} shadow-sm`
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Icon
                                        size={24}
                                        className={isSelected ? display.color : 'text-slate-400'}
                                    />
                                    <span
                                        className={`text-xs font-medium ${isSelected ? display.color : 'text-slate-600'
                                            }`}
                                    >
                                        {display.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conditional Fields Based on Status */}

            {/* SCHEDULED: Show Date Picker */}
            {status === MedicalStatus.SCHEDULED && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Calendar size={18} />
                        <span className="font-medium text-sm">Medical Appointment Details</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Scheduled Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={scheduledDate || ''}
                            onChange={(e) => onScheduledDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isOverdue() ? 'border-red-500' : 'border-slate-300'
                                }`}
                        />
                        {isOverdue() && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                This appointment is overdue. Please update the status.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes || ''}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add any notes about the appointment..."
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            )}

            {/* COMPLETED: Show Completion Details */}
            {status === MedicalStatus.COMPLETED && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle size={18} />
                        <span className="font-medium text-sm">Medical Examination Completed</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Completed Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={completedDate || ''}
                            onChange={(e) => onCompletedDateChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Blood Group
                            </label>
                            <select
                                value={bloodGroup || ''}
                                onChange={(e) => onBloodGroupChange(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select blood group</option>
                                {BLOOD_GROUPS.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Allergies
                            </label>
                            <input
                                type="text"
                                value={allergies || ''}
                                onChange={(e) => onAllergiesChange(e.target.value)}
                                placeholder="e.g., Penicillin, Peanuts"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Medical Notes
                        </label>
                        <textarea
                            value={notes || ''}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add any medical notes or observations..."
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>
            )}

            {/* FAILED: Show Failure Details */}
            {status === MedicalStatus.FAILED && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <XCircle size={18} />
                        <span className="font-medium text-sm">Medical Examination Failed</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Failure Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={notes || ''}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Explain why the medical examination failed..."
                            rows={3}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>

                    <div className="bg-white border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                            <strong>Important:</strong> A failed medical examination will block workflow progression to Embassy/Visa/SLBFE stages.
                        </p>
                    </div>
                </div>
            )}

            {/* NOT_STARTED: Show Info */}
            {status === MedicalStatus.NOT_STARTED && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Activity size={18} />
                        <span className="text-sm">Medical examination has not been scheduled yet.</span>
                    </div>
                </div>
            )}

            {/* Workflow Impact Warning */}
            {(status === MedicalStatus.NOT_STARTED || status === MedicalStatus.SCHEDULED || status === MedicalStatus.FAILED) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-700">
                            <strong>Workflow Restriction:</strong> Candidate cannot progress to Embassy Applied, Visa Received, or SLBFE Registration stages until medical is completed.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalStatusInput;
