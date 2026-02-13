import React from 'react';
import { Plus, Trash2, Globe, Building2, Briefcase } from 'lucide-react';

export interface EmploymentRecord {
    type: 'Local' | 'Foreign';
    position: string;
    companyName: string;
    country?: string;
    years: number;
}

interface EmploymentHistoryEntryProps {
    records: EmploymentRecord[];
    onChange: (records: EmploymentRecord[]) => void;
}

const EmploymentHistoryEntry: React.FC<EmploymentHistoryEntryProps> = ({ records, onChange }) => {
    const addRecord = (type: 'Local' | 'Foreign') => {
        onChange([
            ...records,
            { type, position: '', companyName: '', country: type === 'Foreign' ? '' : 'Sri Lanka', years: 0 }
        ]);
    };

    const removeRecord = (index: number) => {
        onChange(records.filter((_, i) => i !== index));
    };

    const updateRecord = (index: number, field: keyof EmploymentRecord, value: string | number) => {
        const updated = [...records];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-600" />
                    Employment History
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => addRecord('Local')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-bold transition-colors border border-slate-200"
                    >
                        <Plus size={14} /> Local
                    </button>
                    <button
                        type="button"
                        onClick={() => addRecord('Foreign')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-colors"
                    >
                        <Plus size={14} /> Foreign
                    </button>
                </div>
            </div>

            {records.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Briefcase size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm font-medium">No employment history added</p>
                    <p className="text-slate-400 text-xs mt-1">Add local or foreign work experience</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map((record, index) => (
                        <div
                            key={index}
                            className={`bg-white border rounded-xl p-4 transition-all shadow-sm hover:shadow-md ${record.type === 'Foreign' ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${record.type === 'Foreign' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {record.type === 'Foreign' ? <Globe size={14} /> : <Building2 size={14} />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${record.type === 'Foreign' ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {record.type} Experience
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeRecord(index)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Position / Role</label>
                                    <input
                                        type="text"
                                        value={record.position}
                                        onChange={(e) => updateRecord(index, 'position', e.target.value)}
                                        placeholder="e.g. Senior Electrician"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={record.companyName}
                                        onChange={(e) => updateRecord(index, 'companyName', e.target.value)}
                                        placeholder="Company Name"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration (Years)</label>
                                    <input
                                        type="number"
                                        value={record.years}
                                        onChange={(e) => updateRecord(index, 'years', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                {record.type === 'Foreign' && (
                                    <div className="lg:col-span-4 mt-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={record.country || ''}
                                            onChange={(e) => updateRecord(index, 'country', e.target.value)}
                                            placeholder="e.g. Dubai, Qatar"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmploymentHistoryEntry;
