import React from 'react';
import { Candidate, PassportData, PCCData, MedicalStatus, ComplianceFlag } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Calendar, Activity, AlertOctagon, Flag, Plus, Trash2 } from 'lucide-react';
import { ComplianceEngine } from '../services/compliance/ComplianceEngine';
import { ComplianceSeverity } from '../services/compliance/ComplianceTypes';
import { CandidateService } from '../services/candidateService';

interface ComplianceWidgetProps {
    candidate: Candidate;
    onUpdate?: (data: any) => void; // General update trigger
    onRefresh?: () => void; // Trigger reload
}

const ComplianceWidget: React.FC<ComplianceWidgetProps> = ({ candidate, onUpdate, onRefresh }) => {
    const passport = candidate.passportData;
    const pcc = candidate.pccData;
    const stageData = candidate.stageData;

    // Report
    const report = ComplianceEngine.evaluateCandidate(candidate);
    const score = report.scoreCard.overallScore;
    const criticalIssues = report.results.filter(r => r.issue?.severity === ComplianceSeverity.CRITICAL);
    const warningIssues = report.results.filter(r => r.issue?.severity === ComplianceSeverity.WARNING);

    // State
    const [isEditing, setIsEditing] = React.useState(false);
    const [showAddFlag, setShowAddFlag] = React.useState(false);
    const [flagForm, setFlagForm] = React.useState({
        type: 'BEHAVIORAL' as ComplianceFlag['type'],
        severity: 'WARNING' as ComplianceFlag['severity'],
        reason: ''
    });

    // Form State for Docs
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

    const handleAddFlag = async () => {
        if (!flagForm.reason) return;
        await CandidateService.addComplianceFlag(candidate.id, {
            type: flagForm.type,
            severity: flagForm.severity,
            reason: flagForm.reason,
            createdBy: 'User' // In real app, get current user
        });
        setShowAddFlag(false);
        setFlagForm({ type: 'BEHAVIORAL', severity: 'WARNING', reason: '' });
        if (onRefresh) onRefresh();
        else if (onUpdate) onUpdate({});
    };

    const handleResolveFlag = async (flagId: string) => {
        const notes = prompt("Enter resolution notes:");
        if (notes) {
            await CandidateService.resolveComplianceFlag(candidate.id, flagId, notes, 'User');
            if (onRefresh) onRefresh();
            else if (onUpdate) onUpdate({});
        }
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
                    <ShieldCheck className={score === 100 ? "text-green-600" : "text-blue-600"} size={20} />
                    <h3 className="font-bold text-slate-800">Compliance & Travel Docs</h3>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Score</span>
                        <span className={`text-lg font-black ${score === 100 ? 'text-green-600' : score < 50 ? 'text-red-600' : 'text-amber-600'}`}>
                            {score}%
                        </span>
                    </div>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
                    <button
                        onClick={() => setShowAddFlag(!showAddFlag)}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Flag size={12} /> Flag
                    </button>
                </div>
            </div>

            {/* Flag Form */}
            {showAddFlag && (
                <div className="mb-4 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-red-800 mb-2">Add Compliance Flag</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select
                            value={flagForm.type}
                            onChange={(e) => setFlagForm({ ...flagForm, type: e.target.value as any })}
                            className="text-xs border-red-200 rounded"
                        >
                            <option value="LEGAL">Legal</option>
                            <option value="MEDICAL">Medical</option>
                            <option value="DOCUMENT">Document</option>
                            <option value="BEHAVIORAL">Behavioral</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <select
                            value={flagForm.severity}
                            onChange={(e) => setFlagForm({ ...flagForm, severity: e.target.value as any })}
                            className="text-xs border-red-200 rounded"
                        >
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical (Blocker)</option>
                        </select>
                    </div>
                    <textarea
                        value={flagForm.reason}
                        onChange={(e) => setFlagForm({ ...flagForm, reason: e.target.value })}
                        placeholder="Reason for flagging..."
                        className="w-full text-xs border-red-200 rounded mb-2 h-16"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddFlag(false)} className="text-xs text-slate-500">Cancel</button>
                        <button onClick={handleAddFlag} className="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold">Add Flag</button>
                    </div>
                </div>
            )}

            {/* Active Flags List */}
            {candidate.complianceFlags && candidate.complianceFlags.some(f => !f.isResolved) && (
                <div className="mb-4 space-y-2">
                    {candidate.complianceFlags.filter(f => !f.isResolved).map(flag => (
                        <div key={flag.id} className={`p-2 rounded-md border flex justify-between items-start ${flag.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex gap-2">
                                <Flag size={14} className={flag.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'} />
                                <div>
                                    <p className={`text-xs font-bold ${flag.severity === 'CRITICAL' ? 'text-red-800' : 'text-amber-800'}`}>
                                        {flag.type} - {flag.severity}
                                    </p>
                                    <p className="text-xs text-slate-700">{flag.reason}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">By {flag.createdBy} on {new Date(flag.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleResolveFlag(flag.id)}
                                className="text-[10px] text-blue-600 hover:underline bg-white/50 px-2 py-1 rounded border border-blue-100"
                            >
                                Resolve
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Compliance Issues Summary */}
            {(criticalIssues.length > 0 || warningIssues.length > 0) && (
                <div className="mb-4 space-y-2">
                    {criticalIssues.map((item, idx) => (
                        <div key={`crit-${idx}`} className="bg-red-50 border border-red-100 p-2 rounded-md flex gap-2 items-start">
                            <AlertOctagon size={14} className="text-red-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-red-700">{item.issue?.message}</p>
                                <p className="text-[10px] text-red-500">{item.issue?.remedy}</p>
                            </div>
                        </div>
                    ))}
                    {warningIssues.map((item, idx) => (
                        <div key={`warn-${idx}`} className="bg-amber-50 border border-amber-100 p-2 rounded-md flex gap-2 items-start">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5" />
                            <p className="text-xs font-medium text-amber-700">{item.issue?.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ... Existing Passport/PCC/Medical Sections ... */}
            <div className="space-y-4">
                {/* Passport Section */}
                {/* Check for multiple passports or single legacy passport */}
                {(candidate.passports && candidate.passports.length > 0 ? candidate.passports : (passport ? [passport] : [])).map((ppt, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border mb-3 ${ppt ? getStatusColor(ppt.status) : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm uppercase tracking-wide">Passport {candidate.passports && candidate.passports.length > 1 ? `#${idx + 1}` : ''}</span>
                                {ppt && !isEditing && getStatusIcon(ppt.status)}
                            </div>
                            {ppt && !isEditing && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-white/50 rounded-full border border-black/5">
                                    {ppt.status}
                                </span>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-3 mt-2">
                                {/* Simple single-edit mode for primary passport only (idx 0) for now to avoid complexity in widget */}
                                {idx === 0 && (
                                    <>
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
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Country</label>
                                            <input
                                                type="text"
                                                value={formData.passportCountry}
                                                onChange={e => setFormData({ ...formData, passportCountry: e.target.value })}
                                                className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                                    </>
                                )}
                                {idx > 0 && <div className="text-xs text-slate-400 italic">Editing secondary passports is only available in full profile edit.</div>}
                            </div>
                        ) : (
                            ppt ? (
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="opacity-75">Number:</span>
                                        <span className="font-mono font-bold">{ppt.passportNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-75">Country:</span>
                                        <span>{ppt.country}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-75">Expiry:</span>
                                        <span>{ppt.expiryDate}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
                                        <span className="text-xs opacity-75">Validity:</span>
                                        <span className={`font-bold ${ppt.validityDays < 180 ? 'text-red-600' : 'text-green-700'}`}>
                                            {ppt.validityDays} days remaining
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
                ))}

                {(!candidate.passports || candidate.passports.length === 0) && !passport && (
                    <div className="p-4 rounded-lg border bg-slate-50 border-slate-200 border-dashed text-center py-4 text-slate-400 text-sm">
                        No Passport Data Linked
                    </div>
                )}

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
