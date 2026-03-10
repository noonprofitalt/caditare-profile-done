/**
 * ProfileAdminSection
 * Extracted from CandidateDetail.tsx — Administrative Details (View + Edit)
 * Handles address, province, district, divisional secretariat, GS division.
 */
import React from 'react';
import { Candidate } from '../../types';
import { MapPin } from 'lucide-react';

interface Props {
    candidate: Candidate;
    isEditing: boolean;
    editedProfile: Partial<Candidate>;
    setEditedProfile: React.Dispatch<React.SetStateAction<Partial<Candidate>>>;
}

const ProfileAdminSection: React.FC<Props> = ({
    candidate,
    isEditing,
    editedProfile,
    setEditedProfile,
}) => {
    const Field = ({ label, value, editValue, onChange, colSpan }: {
        label: string;
        value: string;
        editValue: string;
        onChange: (val: string) => void;
        colSpan?: number;
    }) => (
        <div className={colSpan === 2 ? 'col-span-1 md:col-span-2' : ''}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
            {isEditing ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                    {value || '-'}
                </div>
            )}
        </div>
    );

    return (
        <section className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-500" />
                Administrative Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                    label="Address"
                    value={candidate?.personalInfo?.address || candidate?.address || '-'}
                    editValue={editedProfile.personalInfo?.address || ''}
                    onChange={(val) => setEditedProfile({
                        ...editedProfile,
                        personalInfo: { ...editedProfile.personalInfo!, address: val }
                    })}
                    colSpan={2}
                />
                <Field
                    label="Province"
                    value={candidate?.personalInfo?.province || candidate?.province || '-'}
                    editValue={editedProfile.personalInfo?.province || ''}
                    onChange={(val) => setEditedProfile({
                        ...editedProfile,
                        personalInfo: { ...editedProfile.personalInfo!, province: val }
                    })}
                />
                <Field
                    label="District"
                    value={candidate?.personalInfo?.district || candidate?.district || '-'}
                    editValue={editedProfile.personalInfo?.district || ''}
                    onChange={(val) => setEditedProfile({
                        ...editedProfile,
                        personalInfo: { ...editedProfile.personalInfo!, district: val }
                    })}
                />
                <Field
                    label="Divisional Secretariat"
                    value={candidate?.personalInfo?.divisionalSecretariat || (candidate as any)?.divisionalSecretariat || '-'}
                    editValue={editedProfile.personalInfo?.divisionalSecretariat || ''}
                    onChange={(val) => setEditedProfile({
                        ...editedProfile,
                        personalInfo: { ...editedProfile.personalInfo!, divisionalSecretariat: val }
                    })}
                />
                <Field
                    label="GS Division"
                    value={candidate?.personalInfo?.gsDivision || (candidate as any)?.gsDivision || '-'}
                    editValue={editedProfile.personalInfo?.gsDivision || ''}
                    onChange={(val) => setEditedProfile({
                        ...editedProfile,
                        personalInfo: { ...editedProfile.personalInfo!, gsDivision: val }
                    })}
                />
            </div>
        </section>
    );
};

export default ProfileAdminSection;
