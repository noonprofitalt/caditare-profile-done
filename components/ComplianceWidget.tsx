import React from 'react';
import { PassportData, PCCData, MedicalStatus, StageData } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Calendar, Activity } from 'lucide-react';

interface ComplianceWidgetProps {
    passport?: PassportData;
    pcc?: PCCData;
    stageData?: StageData;
    onUpdate?: (data: { passport: Partial<PassportData>; pcc: Partial<PCCData> }) => void;
}

const ComplianceWidget: React.FC<ComplianceWidgetProps> = ({ passport, pcc, stageData, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);

    // Form State
    const [formData, setFormData] = React.useState({
        passportNumber: passport?.passportNumber || '',
        passportCountry: passport?.country || '',
        passportIssued: passport?.issuedDate || '',
        passportExpiry: passport?.expiryDate || '',
        pccIssued: pcc?.issuedDate || '',
        pccLastInspection: pcc?.lastInspectionDate || ''
    });

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                passport: {
                    passportNumber: formData.passportNumber,
                    country: formData.passportCountry,
                    issuedDate: formData.passportIssued,
                    expiryDate: formData.passportExpiry
                },
                pcc: {
                    issuedDate: formData.pccIssued,
                    lastInspectionDate: formData.pccLastInspection
                }
            });
        }
        setIsEditing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VALID': return 'bg-green-50 text-green-700 border-green-200';
            case 'EXPIRING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'EXPIRED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VALID': return <CheckCircle2 size={16} className="text-green-600" />;
            case 'EXPIRING': return <AlertTriangle size={16} className="text-amber-600" />;
            case 'EXPIRED': return <XCircle size={16} className="text-red-600" />;
            default: return <AlertTriangle size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={20} />
                    <h3 className="font-bold text-slate-800">Compliance & Travel Docs</h3>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    {isEditing ? 'Save Changes' : 'Edit Details'}
                </button>
            </div>

            <div className="space-y-4">
                {/* Passport Section */}
                <div className={`p-4 rounded-lg border ${passport ? getStatusColor(passport.status) : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm uppercase tracking-wide">Passport</span>
                            {passport && !isEditing && getStatusIcon(passport.status)}
                        </div>
                        {passport && !isEditing && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-white/50 rounded-full border border-black/5">
                                {passport.status}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 mt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Passport Number</label>
                                <input
                                    type="text"
                                    value={formData.passportNumber}
                                    onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Passport No."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Issued Date</label>
                                    <input
                                        type="date"
                                        value={formData.passportIssued}
                                        onChange={e => setFormData({ ...formData, passportIssued: e.target.value })}
                                        className="w-full text-sm border-slate-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.passportExpiry}
                                        onChange={e => setFormData({ ...formData, passportExpiry: e.target.value })}
                                        className="w-full text-sm border-slate-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        passport ? (
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="opacity-75">Number:</span>
                                    <span className="font-mono font-bold">{passport.passportNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Expiry:</span>
                                    <span>{passport.expiryDate}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                                    <span className="text-xs opacity-75">Validity:</span>
                                    <span className={`font-bold ${passport.validityDays < 180 ? 'text-red-600' : 'text-green-700'}`}>
                                        {passport.validityDays} days remaining
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-2 text-slate-400 text-sm">
                                No Passport Data Linked
                            </div>
                        )
                    )}
                </div>

                {/* PCC Section */}
                <div className={`p-4 rounded-lg border ${pcc ? getStatusColor(pcc.status) : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm uppercase tracking-wide">Police Clearance</span>
                            {pcc && !isEditing && getStatusIcon(pcc.status)}
                        </div>
                        {pcc && !isEditing && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-white/50 rounded-full border border-black/5">
                                {pcc.status}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 mt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">PCC Issued Date</label>
                                    <input
                                        type="date"
                                        value={formData.pccIssued}
                                        onChange={e => setFormData({ ...formData, pccIssued: e.target.value })}
                                        className="w-full text-sm border-slate-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Last Inspection</label>
                                    <input
                                        type="date"
                                        value={formData.pccLastInspection}
                                        onChange={e => setFormData({ ...formData, pccLastInspection: e.target.value })}
                                        className="w-full text-sm border-slate-300 rounded-md transition-all focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        pcc ? (
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="opacity-75">Issued:</span>
                                    <span>{pcc.issuedDate}</span>
                                </div>
                                {pcc.lastInspectionDate && (
                                    <div className="flex justify-between">
                                        <span className="opacity-75">Last Insp:</span>
                                        <span className="font-medium text-blue-600">{pcc.lastInspectionDate}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                                    <span className="text-xs opacity-75">Age:</span>
                                    <span className={`font-bold ${pcc.ageDays > 150 ? 'text-red-600' : 'text-green-700'}`}>
                                        {pcc.ageDays} days old
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-2 text-slate-400 text-sm">
                                No PCC Data Linked
                            </div>
                        )
                    )}
                </div>

                {/* Medical Status Section */}
                {stageData?.medicalStatus && (
                    <div className={`p-4 rounded-lg border ${stageData.medicalStatus === MedicalStatus.COMPLETED ? 'bg-green-50 border-green-200' :
                        stageData.medicalStatus === MedicalStatus.FAILED ? 'bg-red-50 border-red-200' :
                            stageData.medicalStatus === MedicalStatus.SCHEDULED ? 'bg-blue-50 border-blue-200' :
                                'bg-slate-50 border-slate-200'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className={
                                    stageData.medicalStatus === MedicalStatus.COMPLETED ? 'text-green-600' :
                                        stageData.medicalStatus === MedicalStatus.FAILED ? 'text-red-600' :
                                            stageData.medicalStatus === MedicalStatus.SCHEDULED ? 'text-blue-600' :
                                                'text-slate-400'
                                } />
                                <span className="font-bold text-sm uppercase tracking-wide">Medical Status</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stageData.medicalStatus === MedicalStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-300' :
                                stageData.medicalStatus === MedicalStatus.FAILED ? 'bg-red-100 text-red-700 border-red-300' :
                                    stageData.medicalStatus === MedicalStatus.SCHEDULED ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                        'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                {stageData.medicalStatus}
                            </span>
                        </div>

                        <div className="text-sm space-y-1">
                            {stageData.medicalScheduledDate && (
                                <div className="flex justify-between items-center">
                                    <span className="opacity-75 flex items-center gap-1">
                                        <Calendar size={14} />
                                        Scheduled:
                                    </span>
                                    <span className="font-medium text-blue-600">{stageData.medicalScheduledDate}</span>
                                </div>
                            )}
                            {stageData.medicalCompletedDate && (
                                <div className="flex justify-between">
                                    <span className="opacity-75">Completed:</span>
                                    <span className="font-medium text-green-600">{stageData.medicalCompletedDate}</span>
                                </div>
                            )}
                            {stageData.medicalNotes && (
                                <div className="mt-2 pt-2 border-t border-black/5">
                                    <span className="text-xs opacity-75 block mb-1">Notes:</span>
                                    <p className="text-xs italic">{stageData.medicalNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplianceWidget;
