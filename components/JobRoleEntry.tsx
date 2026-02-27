import React from 'react';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { JobRole } from '../types';

interface JobRoleEntryProps {
    jobRoles: JobRole[];
    onChange: (roles: JobRole[]) => void;
}

const JobRoleEntry: React.FC<JobRoleEntryProps> = ({ jobRoles, onChange }) => {
    const addRole = () => {
        onChange([
            ...jobRoles,
            { title: '', experienceYears: 0, skillLevel: 'Beginner' }
        ]);
    };

    const removeRole = (index: number) => {
        onChange(jobRoles.filter((_, i) => i !== index));
    };

    const updateRole = (index: number, field: keyof JobRole, value: string | number) => {
        const updated = [...jobRoles];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Professional Job Roles
                </h3>
                <button
                    type="button"
                    onClick={addRole}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-colors"
                >
                    <Plus size={14} /> Add Role
                </button>
            </div>

            {jobRoles.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Briefcase size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm font-medium">No job roles added yet</p>
                    <p className="text-slate-400 text-xs mt-1">Click "Add Role" to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobRoles.map((role, index) => (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Briefcase size={16} className="text-blue-600" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">
                                        Role #{index + 1}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeRole(index)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                                    aria-label="Remove role"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Job Title */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={role.title}
                                        onChange={(e) => updateRole(index, 'title', e.target.value)}
                                        placeholder="e.g., Electrician, Plumber, Chef"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        required
                                    />
                                </div>

                                {/* Years of Experience */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Experience (Years) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={role.experienceYears}
                                        onChange={(e) => updateRole(index, 'experienceYears', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        required
                                    />
                                </div>

                                {/* Skill Level */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Skill Level *
                                    </label>
                                    <select
                                        value={role.skillLevel}
                                        onChange={(e) => updateRole(index, 'skillLevel', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                                        required
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Skilled">Skilled</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                {/* Notes (Optional) */}
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Notes
                                    </label>
                                    <input
                                        type="text"
                                        value={role.notes || ''}
                                        onChange={(e) => updateRole(index, 'notes', e.target.value)}
                                        placeholder="Optional details"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Visual Skill Level Indicator */}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Skill Level:</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${role.skillLevel === 'Expert'
                                            ? 'bg-purple-100 text-purple-700'
                                            : role.skillLevel === 'Skilled'
                                                ? 'bg-blue-100 text-blue-700'
                                                : role.skillLevel === 'Intermediate'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        {role.skillLevel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {jobRoles.length > 0 && (
                <p className="text-xs text-slate-500 italic">
                    * All fields marked with asterisk are required
                </p>
            )}
        </div>
    );
};

export default JobRoleEntry;
