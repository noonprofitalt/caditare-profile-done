/**
 * ProfilePassportSection
 * Extracted from CandidateDetail.tsx — Passport Bio Page (View + Edit)
 * Handles passport data display in Sri Lankan passport layout format,
 * including MRZ zone rendering, and inline editing of all passport fields.
 */
import React from 'react';
import { Candidate, PassportStatus } from '../../types';
import { ComplianceService } from '../../services/complianceService';
import { generateMRZ } from '../../utils/mrzGenerator';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
    candidate: Candidate;
    isEditing: boolean;
    editedProfile: Partial<Candidate>;
    setEditedProfile: React.Dispatch<React.SetStateAction<Partial<Candidate>>>;
}

const ProfilePassportSection: React.FC<Props> = ({
    candidate,
    isEditing,
    editedProfile,
    setEditedProfile,
}) => {
    return (
        <section>
            <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-500" />
                Passport Data
            </h3>

            {isEditing ? (
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    {/* Row 1: Type, Country Code, Passport No */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Type</label>
                            <input type="text" value="PB" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Country Code</label>
                            <input type="text" value="LKA" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Passport No.</label>
                            <input
                                type="text"
                                value={(editedProfile.passports || [])[0]?.passportNumber || ''}
                                onChange={(e) => {
                                    const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                                    passports[0] = { ...passports[0], passportNumber: e.target.value.toUpperCase() };
                                    setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                                placeholder="e.g. N11296133"
                            />
                        </div>
                    </div>

                    {/* Row 2: Surname */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Surname</label>
                        <input
                            type="text"
                            value={editedProfile.personalInfo?.surname || editedProfile.personalInfo?.firstName || ''}
                            onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                personalInfo: { ...editedProfile.personalInfo!, surname: e.target.value.toUpperCase(), firstName: e.target.value.toUpperCase() }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                            placeholder="e.g. BOGAHAWATHTHA"
                        />
                    </div>

                    {/* Row 3: Other Names */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Other Names</label>
                        <input
                            type="text"
                            value={editedProfile.personalInfo?.otherNames || editedProfile.personalInfo?.middleName || ''}
                            onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                personalInfo: { ...editedProfile.personalInfo!, otherNames: e.target.value.toUpperCase(), middleName: e.target.value.toUpperCase(), fullName: e.target.value.toUpperCase() }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                            placeholder="e.g. LAHIRU SHIWANTHA SRI"
                        />
                    </div>

                    {/* Row 4: National Status + Profession */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">National Status</label>
                            <input type="text" value="SRI LANKAN" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Profession</label>
                            <input
                                type="text"
                                value={(editedProfile as any).passportProfession || ''}
                                onChange={(e) => setEditedProfile({ ...editedProfile, passportProfession: e.target.value } as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="As per passport"
                            />
                        </div>
                    </div>

                    {/* Row 5: DOB + ID No. */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Date of Birth</label>
                            <input
                                type="date"
                                value={editedProfile.personalInfo?.dob || ''}
                                onChange={(e) => setEditedProfile({
                                    ...editedProfile,
                                    personalInfo: { ...editedProfile.personalInfo!, dob: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">ID No. (NIC)</label>
                            <input
                                type="text"
                                value={editedProfile.personalInfo?.nic || ''}
                                onChange={(e) => setEditedProfile({
                                    ...editedProfile,
                                    personalInfo: { ...editedProfile.personalInfo!, nic: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="e.g. 840631346V"
                            />
                        </div>
                    </div>

                    {/* Row 6: Sex + Place of Birth */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Sex</label>
                            <select
                                value={editedProfile.personalInfo?.gender || ''}
                                onChange={(e) => setEditedProfile({
                                    ...editedProfile,
                                    personalInfo: { ...editedProfile.personalInfo!, gender: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select</option>
                                <option value="M">M</option>
                                <option value="F">F</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Place of Birth</label>
                            <input
                                type="text"
                                value={(editedProfile as any).placeOfBirth || ''}
                                onChange={(e) => setEditedProfile({ ...editedProfile, placeOfBirth: e.target.value.toUpperCase() } as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                                placeholder="e.g. POLONNARUWA"
                            />
                        </div>
                    </div>

                    {/* Row 7: Date of Issue + Date of Expiry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Date of Issue</label>
                            <input
                                type="date"
                                value={(editedProfile.passports || [])[0]?.issuedDate ? new Date((editedProfile.passports || [])[0].issuedDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                                    passports[0] = { ...passports[0], issuedDate: e.target.value };
                                    setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-0.5">Date of Expiry</label>
                            <input
                                type="date"
                                value={(editedProfile.passports || [])[0]?.expiryDate ? new Date((editedProfile.passports || [])[0].expiryDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                                    const evaluation = ComplianceService.evaluatePassport(e.target.value, passports[0].passportNumber, passports[0].country, passports[0].issuedDate);
                                    passports[0] = { ...passports[0], expiryDate: e.target.value, status: evaluation.status, validityDays: evaluation.validityDays };
                                    setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Row 8: Authority */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Authority</label>
                        <input type="text" value="AUTHORITY COLOMBO" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500" />
                    </div>

                    {/* Row 9: Passport Remark */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Passport Remark</label>
                        <textarea
                            value={(editedProfile as any).passportRemark || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, passportRemark: e.target.value } as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            placeholder="e.g. unmarried, no foreign job experience, govt register no..."
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {(candidate.passports && candidate.passports.filter(p => p && (p.passportNumber?.trim() || p.issuedDate?.trim() || p.expiryDate?.trim())).length > 0) ? (
                        candidate.passports.filter(p => p && (p.passportNumber?.trim() || p.issuedDate?.trim() || p.expiryDate?.trim())).map((passport, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-amber-50/30 to-slate-50/80 rounded-xl border border-amber-200/60 overflow-hidden shadow-sm">
                                {/* Passport Header */}
                                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-5 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-amber-300 text-lg">🇱🇰</div>
                                        <div>
                                            <div className="text-xs text-blue-200 uppercase tracking-widest">Democratic Socialist Republic of</div>
                                            <div className="text-xs font-bold text-white tracking-wide">SRI LANKA</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-blue-200 uppercase">Passport No.</div>
                                        <div className="text-sm font-bold text-amber-300 font-mono tracking-wider">{passport.passportNumber || '-'}</div>
                                    </div>
                                </div>

                                {/* Passport Body */}
                                <div className="px-5 py-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Type</label>
                                            <div className="text-sm font-bold text-slate-800 font-mono">PB</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Country Code</label>
                                            <div className="text-sm font-bold text-slate-800 font-mono">LKA</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Passport No.</label>
                                            <div className="text-sm font-bold text-slate-900 font-mono">{passport.passportNumber || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="pt-1 border-t border-amber-100">
                                        <label className="text-xs font-medium text-slate-400 uppercase">Surname</label>
                                        <div className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                                            {candidate?.personalInfo?.surname || candidate?.personalInfo?.firstName || candidate?.firstName || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-400 uppercase">Other Names</label>
                                        <div className="text-base font-bold text-slate-800 uppercase">
                                            {candidate?.personalInfo?.otherNames || candidate?.personalInfo?.middleName || candidate?.middleName || '-'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-amber-100">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">National Status</label>
                                            <div className="text-sm font-bold text-slate-800">SRI LANKAN</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Profession</label>
                                            <div className="text-sm font-medium text-slate-700">{(candidate as any)?.passportProfession || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Date of Birth</label>
                                            <div className="text-sm font-bold text-slate-800">{candidate?.personalInfo?.dob || candidate?.dob || '-'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">ID No.</label>
                                            <div className="text-sm font-bold text-slate-800 font-mono">{candidate?.personalInfo?.nic || candidate?.nic || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Sex</label>
                                            <div className="text-sm font-bold text-slate-800">{candidate?.personalInfo?.gender || candidate?.gender || '-'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Place of Birth</label>
                                            <div className="text-sm font-bold text-slate-800 uppercase">{(candidate as any)?.placeOfBirth || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-amber-100">
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Date of Issue</label>
                                            <div className="text-sm font-medium text-slate-800">{passport.issuedDate || '-'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-400 uppercase">Date of Expiry</label>
                                            <div className="text-sm font-medium text-slate-800 mb-1">{passport.expiryDate || '-'}</div>
                                            {passport.expiryDate && (
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${passport.status === PassportStatus.VALID ? 'bg-green-50 text-green-700 border-green-200' :
                                                    passport.status === PassportStatus.EXPIRING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {passport.status === PassportStatus.VALID ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                                    {passport.status} • {passport.validityDays} Days Left
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-1 border-t border-amber-100">
                                        <label className="text-xs font-medium text-slate-400 uppercase">Authority</label>
                                        <div className="text-sm font-medium text-slate-600">AUTHORITY COLOMBO</div>
                                    </div>

                                    {(candidate as any)?.passportRemark && (
                                        <div className="pt-1 border-t border-amber-100">
                                            <label className="text-xs font-medium text-slate-400 uppercase">Remark</label>
                                            <div className="text-xs text-slate-600 italic leading-relaxed">{(candidate as any).passportRemark}</div>
                                        </div>
                                    )}
                                </div>

                                {/* MRZ Zone */}
                                {(function () {
                                    const [mrzLine1, mrzLine2] = generateMRZ(candidate, passport);
                                    return (
                                        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 font-mono text-[11px] tracking-[0.15em] text-slate-500 leading-relaxed overflow-x-auto whitespace-pre">
                                            <div>{mrzLine1}</div>
                                            <div>{mrzLine2}</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 bg-slate-50 rounded-lg text-sm text-slate-500 italic text-center border border-slate-200 border-dashed">
                            No passport data available — Click "Edit Profile" to add passport details
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ProfilePassportSection;
