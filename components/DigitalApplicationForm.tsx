import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Candidate, WorkflowStage, StageStatus } from '../types';
import { CandidateService } from '../services/candidateService';
import { Plus, Trash2, Save, X } from 'lucide-react';

const DigitalApplicationForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Partial<Candidate>>({
        // Header
        refNo: `APP-${Date.now()}`,
        applicationDate: new Date().toISOString().split('T')[0],
        country: '',
        position: '',

        // Personal Details
        name: '',
        address: '',
        nic: '',
        dob: '',
        phone: '',
        whatsapp: '',
        email: '',

        // Administrative
        province: '',
        divisionalSecretariat: '',
        gsDivision: '',
        district: '',
        drivingLicenseNo: '',

        // Physical & Personal
        height: { feet: 0, inches: 0 },
        weight: 0,
        religion: '',
        maritalStatus: 'Single',
        numberOfChildren: 0,

        // Education
        school: '',
        gceOL: { year: '' },
        gceAL: { year: '' },
        educationalQualifications: [],

        // Family
        fatherName: '',
        motherName: '',
        spouseName: '',
        guardianName: '',
        guardianIdNo: '',
        guardianBirthday: '',
        guardianContact: '',
        children: [],

        // Professional
        employmentHistory: [],
        trainingDetails: '',
        specialAchievements: '',

        // System defaults
        stage: WorkflowStage.REGISTRATION,
        stageStatus: StageStatus.PENDING,
        stageEnteredAt: new Date().toISOString(),
        avatarUrl: 'https://ui-avatars.com/api/?name=New+Applicant',
        location: '',
        preferredCountries: [],
        skills: [],
        role: '',
        experienceYears: 0,
        stageData: {},
        workflowLogs: [],
        timelineEvents: [],
        comments: [],
        documents: []
    });

    const [educationRows, setEducationRows] = useState([
        { courseName: '', level: '', institute: '', year: '' }
    ]);

    const [employmentRows, setEmploymentRows] = useState({
        local: [{ position: '', companyName: '', years: 0 }],
        foreign: [{ position: '', companyName: '', country: '', years: 0 }]
    });

    const [childrenRows, setChildrenRows] = useState([
        { name: '', gender: 'M' as 'M' | 'F', age: 0 }
    ]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (field: string, nestedField: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field] as any), [nestedField]: value }
        }));
    };

    const addEducationRow = () => {
        setEducationRows([...educationRows, { courseName: '', level: '', institute: '', year: '' }]);
    };

    const removeEducationRow = (index: number) => {
        setEducationRows(educationRows.filter((_, i) => i !== index));
    };

    const addEmploymentRow = (type: 'local' | 'foreign') => {
        if (type === 'local') {
            setEmploymentRows({
                ...employmentRows,
                local: [...employmentRows.local, { position: '', companyName: '', years: 0 }]
            });
        } else {
            setEmploymentRows({
                ...employmentRows,
                foreign: [...employmentRows.foreign, { position: '', companyName: '', country: '', years: 0 }]
            });
        }
    };

    const removeEmploymentRow = (type: 'local' | 'foreign', index: number) => {
        if (type === 'local') {
            setEmploymentRows({
                ...employmentRows,
                local: employmentRows.local.filter((_, i) => i !== index)
            });
        } else {
            setEmploymentRows({
                ...employmentRows,
                foreign: employmentRows.foreign.filter((_, i) => i !== index)
            });
        }
    };

    const addChildRow = () => {
        setChildrenRows([...childrenRows, { name: '', gender: 'M', age: 0 }]);
    };

    const removeChildRow = (index: number) => {
        setChildrenRows(childrenRows.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Compile employment history
        const employmentHistory = [
            ...employmentRows.local.map(row => ({ ...row, type: 'Local' as const })),
            ...employmentRows.foreign.map(row => ({ ...row, type: 'Foreign' as const }))
        ];

        // Create candidate with all data
        const candidateData: Partial<Candidate> = {
            ...formData,
            educationalQualifications: educationRows,
            employmentHistory,
            children: childrenRows,
            role: formData.position || 'General Worker',
            location: formData.district || '',
            preferredCountries: formData.country ? [formData.country] : [],
            id: `candidate-${Date.now()}`
        };

        // Save to localStorage
        CandidateService.addCandidate(candidateData as Candidate);

        // Navigate to candidates list
        navigate('/candidates');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Suhara Foreign Employment Agency</h1>
                            <p className="text-blue-100 text-sm mt-1">Application Form - Digital Version</p>
                        </div>
                        <button
                            onClick={() => navigate('/candidates')}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-200 block">Date:</span>
                            <input
                                type="date"
                                value={formData.applicationDate}
                                onChange={(e) => handleInputChange('applicationDate', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                            />
                        </div>
                        <div>
                            <span className="text-blue-200 block">Country:</span>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                                placeholder="Target Country"
                            />
                        </div>
                        <div>
                            <span className="text-blue-200 block">Position:</span>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                                placeholder="Desired Position"
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* SECTION 1: PERSONAL DETAILS */}
                    <section className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passport No</label>
                                <input
                                    type="text"
                                    value={formData.passportData?.passportNumber || ''}
                                    onChange={(e) => handleNestedChange('passportData', 'passportNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Address *</label>
                            <textarea
                                required
                                rows={2}
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Province</label>
                                <input
                                    type="text"
                                    value={formData.province}
                                    onChange={(e) => handleInputChange('province', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Divisional Secretariat</label>
                                <input
                                    type="text"
                                    value={formData.divisionalSecretariat}
                                    onChange={(e) => handleInputChange('divisionalSecretariat', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GS Division</label>
                                <input
                                    type="text"
                                    value={formData.gsDivision}
                                    onChange={(e) => handleInputChange('gsDivision', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">District</label>
                                <input
                                    type="text"
                                    value={formData.district}
                                    onChange={(e) => handleInputChange('district', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">ID No (NIC)</label>
                                <input
                                    type="text"
                                    value={formData.nic}
                                    onChange={(e) => handleInputChange('nic', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Driving License No</label>
                                <input
                                    type="text"
                                    value={formData.drivingLicenseNo}
                                    onChange={(e) => handleInputChange('drivingLicenseNo', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Age / DOB</label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => handleInputChange('dob', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact No *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">WhatsApp</label>
                                <input
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (FT)</label>
                                <input
                                    type="number"
                                    value={formData.height?.feet || 0}
                                    onChange={(e) => handleNestedChange('height', 'feet', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (IN)</label>
                                <input
                                    type="number"
                                    value={formData.height?.inches || 0}
                                    onChange={(e) => handleNestedChange('height', 'inches', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Weight (KG)</label>
                                <input
                                    type="number"
                                    value={formData.weight || 0}
                                    onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Religion</label>
                                <input
                                    type="text"
                                    value={formData.religion}
                                    onChange={(e) => handleInputChange('religion', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Marital Status</label>
                                <select
                                    value={formData.maritalStatus}
                                    onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">School</label>
                                <input
                                    type="text"
                                    value={formData.school}
                                    onChange={(e) => handleInputChange('school', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: EDUCATION */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                            Educational / Professional Qualifications
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GCE O/L (Year)</label>
                                <input
                                    type="text"
                                    value={formData.gceOL?.year || ''}
                                    onChange={(e) => handleNestedChange('gceOL', 'year', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GCE A/L (Year)</label>
                                <input
                                    type="text"
                                    value={formData.gceAL?.year || ''}
                                    onChange={(e) => handleNestedChange('gceAL', 'year', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Course Name (with NVQ / SLQF Level)</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Institute/Campus</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Year</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {educationRows.map((row, index) => (
                                        <tr key={index} className="border-t border-slate-100">
                                            <td className="px-3 py-2 text-sm">{index + 1}</td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={row.courseName}
                                                    onChange={(e) => {
                                                        const updated = [...educationRows];
                                                        updated[index].courseName = e.target.value;
                                                        setEducationRows(updated);
                                                    }}
                                                    className="w-full px-2 py-1 border border-slate-200 rounded"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={row.institute}
                                                    onChange={(e) => {
                                                        const updated = [...educationRows];
                                                        updated[index].institute = e.target.value;
                                                        setEducationRows(updated);
                                                    }}
                                                    className="w-full px-2 py-1 border border-slate-200 rounded"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={row.year}
                                                    onChange={(e) => {
                                                        const updated = [...educationRows];
                                                        updated[index].year = e.target.value;
                                                        setEducationRows(updated);
                                                    }}
                                                    className="w-full px-2 py-1 border border-slate-200 rounded"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeEducationRow(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                type="button"
                                onClick={addEducationRow}
                                className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                            >
                                <Plus size={16} /> Add Row
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Training Details (Related to the Position)</label>
                            <textarea
                                rows={2}
                                value={formData.trainingDetails}
                                onChange={(e) => handleInputChange('trainingDetails', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </section>

                    {/* SECTION 3: PROFESSIONAL EXPERIENCE */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                            Professional Experience
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2">LOCAL</h3>
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Position</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Company & Country</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Years</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employmentRows.local.map((row, index) => (
                                            <tr key={index} className="border-t border-slate-100">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.position}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.local];
                                                            updated[index].position = e.target.value;
                                                            setEmploymentRows({ ...employmentRows, local: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.companyName}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.local];
                                                            updated[index].companyName = e.target.value;
                                                            setEmploymentRows({ ...employmentRows, local: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.years}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.local];
                                                            updated[index].years = parseInt(e.target.value);
                                                            setEmploymentRows({ ...employmentRows, local: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEmploymentRow('local', index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={() => addEmploymentRow('local')}
                                    className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                >
                                    <Plus size={16} /> Add Local Employment
                                </button>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2">FOREIGN</h3>
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Position</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Company</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Country</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Years</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employmentRows.foreign.map((row, index) => (
                                            <tr key={index} className="border-t border-slate-100">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.position}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.foreign];
                                                            updated[index].position = e.target.value;
                                                            setEmploymentRows({ ...employmentRows, foreign: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.companyName}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.foreign];
                                                            updated[index].companyName = e.target.value;
                                                            setEmploymentRows({ ...employmentRows, foreign: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.country}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.foreign];
                                                            updated[index].country = e.target.value;
                                                            setEmploymentRows({ ...employmentRows, foreign: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.years}
                                                        onChange={(e) => {
                                                            const updated = [...employmentRows.foreign];
                                                            updated[index].years = parseInt(e.target.value);
                                                            setEmploymentRows({ ...employmentRows, foreign: updated });
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEmploymentRow('foreign', index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={() => addEmploymentRow('foreign')}
                                    className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                >
                                    <Plus size={16} /> Add Foreign Employment
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Special Achievements</label>
                            <textarea
                                rows={2}
                                value={formData.specialAchievements}
                                onChange={(e) => handleInputChange('specialAchievements', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </section>

                    {/* SECTION 4: FAMILY INFORMATION */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                            Family Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Father's Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fatherName}
                                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mother's Full Name</label>
                                <input
                                    type="text"
                                    value={formData.motherName}
                                    onChange={(e) => handleInputChange('motherName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Wife/Husband/Guardian's Full Name</label>
                                <input
                                    type="text"
                                    value={formData.guardianName}
                                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">No of Children</label>
                                <input
                                    type="number"
                                    value={formData.numberOfChildren || 0}
                                    onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian ID No</label>
                                <input
                                    type="text"
                                    value={formData.guardianIdNo}
                                    onChange={(e) => handleInputChange('guardianIdNo', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Birthday</label>
                                <input
                                    type="date"
                                    value={formData.guardianBirthday}
                                    onChange={(e) => handleInputChange('guardianBirthday', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Contact No</label>
                                <input
                                    type="tel"
                                    value={formData.guardianContact}
                                    onChange={(e) => handleInputChange('guardianContact', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {(formData.numberOfChildren || 0) > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-2">Children Details</h3>
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">#</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Child's Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">M/F</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Age</th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {childrenRows.map((row, index) => (
                                            <tr key={index} className="border-t border-slate-100">
                                                <td className="px-3 py-2 text-sm">{index + 1}</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.name}
                                                        onChange={(e) => {
                                                            const updated = [...childrenRows];
                                                            updated[index].name = e.target.value;
                                                            setChildrenRows(updated);
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={row.gender}
                                                        onChange={(e) => {
                                                            const updated = [...childrenRows];
                                                            updated[index].gender = e.target.value as 'M' | 'F';
                                                            setChildrenRows(updated);
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    >
                                                        <option value="M">M</option>
                                                        <option value="F">F</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.age}
                                                        onChange={(e) => {
                                                            const updated = [...childrenRows];
                                                            updated[index].age = parseInt(e.target.value);
                                                            setChildrenRows(updated);
                                                        }}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChildRow(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={addChildRow}
                                    className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                >
                                    <Plus size={16} /> Add Child
                                </button>
                            </div>
                        )}
                    </section>

                    {/* OFFICE USE ONLY */}
                    <section className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                            Office Use Only
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Selection</label>
                                <select
                                    value={formData.officeSelection || 'Select'}
                                    onChange={(e) => handleInputChange('officeSelection', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Reject">Reject</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remark</label>
                                <input
                                    type="text"
                                    value={formData.officeRemark}
                                    onChange={(e) => handleInputChange('officeRemark', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SUBMIT */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/candidates')}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white font-extrabold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Save size={20} /> Submit Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DigitalApplicationForm;
