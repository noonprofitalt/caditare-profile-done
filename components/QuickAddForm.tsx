import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { DuplicateDetectionService } from '../services/duplicateDetectionService';
import { ProfileCompletionService } from '../services/profileCompletionService';
import { NICService } from '../services/nicService';
import { Save, AlertCircle, UserPlus, TrendingUp } from 'lucide-react';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import MultiPhoneInput from './ui/MultiPhoneInput';
import { useCandidates } from '../context/CandidateContext';
import { useToast } from '../context/ToastContext';


const QuickAddForm: React.FC = () => {
    const navigate = useNavigate();
    const { candidates } = useCandidates();
    const toast = useToast();
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
    const [duplicateFields, setDuplicateFields] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        name: '',
        nic: '',
        dob: '',
        gender: '' as 'Male' | 'Female' | '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        role: '',
        preferredCountries: [] as string[],
        additionalContactNumbers: [] as string[],
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Smart NIC Parsing
            if (name === 'nic') {
                const parsed = NICService.parseNIC(value);
                if (parsed) {
                    updated.dob = parsed.dob;
                    updated.gender = parsed.gender;
                }
            }

            return updated;
        });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle duplicate check on blur
    const handleBlur = (field: 'nic' | 'phone' | 'whatsapp') => {
        const value = formData[field];
        if (!value) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkData: any = {};
        if (field === 'nic') checkData.nic = value;
        if (field === 'phone') checkData.phone = value;
        if (field === 'whatsapp') checkData.whatsapp = value;

        const { isDuplicate, matches, matchedFields } = DuplicateDetectionService.isDuplicate(checkData, candidates);

        if (isDuplicate) {
            setDuplicateMatches(matches);
            setDuplicateFields(matchedFields);
            // FRICTIONLESS: Modal disabled to allow rapid entry without interruption
            // setShowDuplicateModal(true);
            console.log('Duplicate detected (potential friction avoided):', matchedFields);
        }
    };

    // FRICTIONLESS: Validation disabled
    const validate = (): boolean => {
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // FRICTIONLESS: Duplicate check bypassed
        /*
        const { isDuplicate, matches, matchedFields } = DuplicateDetectionService.isDuplicate({
            nic: formData.nic,
            phone: formData.phone,
            whatsapp: formData.whatsapp || undefined
        });

        if (isDuplicate) {
            setDuplicateMatches(matches);
            setDuplicateFields(matchedFields);
            setShowDuplicateModal(true);
            return;
        }
        */

        // Create Quick Add candidate
        try {
            const candidate = await CandidateService.createQuickCandidate({
                name: (formData.name || '').trim() || 'Unknown Candidate',
                firstName: (formData.firstName || '').trim(),
                nic: (formData.nic || '').trim().toUpperCase(),
                phone: (formData.phone || '').trim(),
                whatsapp: (formData.whatsapp || '').trim() || (formData.phone || '').trim(),
                email: (formData.email || '').trim(),
                address: (formData.address || '').trim(),
                role: (formData.role || '').trim(),
                preferredCountries: formData.preferredCountries || [],
                additionalContactNumbers: (formData.additionalContactNumbers || []).filter(n => n && n.trim()),
                dob: formData.dob || undefined,
                gender: formData.gender || undefined,
                middleName: (formData.middleName || '').trim()
            });

            // Navigate to candidate detail page
            if (candidate) {
                navigate(`/candidates/${candidate.id}`);
            }
        } catch (error) {
            console.error('Error creating quick candidate:', error);
            toast.error('Failed to create candidate. Please try again.');
        }
    };

    // Handle viewing existing profile
    const handleViewExisting = () => {
        if (duplicateMatches.length > 0) {
            navigate(`/candidates/${duplicateMatches[0].id}`);
        }
    };

    // Handle continue anyway (admin override)
    const handleContinueAnyway = async () => {
        setShowDuplicateModal(false);
        // Proceed with submission without duplicate check
        try {
            const candidate = await CandidateService.createQuickCandidate({
                name: formData.name.trim(),
                firstName: formData.firstName.trim(),
                middleName: formData.middleName.trim(),
                nic: formData.nic.trim().toUpperCase(),
                phone: formData.phone.trim(),
                whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
                email: formData.email.trim(),
                address: formData.address.trim(),
                role: formData.role.trim(),
                preferredCountries: formData.preferredCountries,
                additionalContactNumbers: formData.additionalContactNumbers.filter(n => n.trim()),
                dob: formData.dob,
                gender: formData.gender
            });

            if (candidate) {
                navigate(`/candidates/${candidate.id}`);
            }
        } catch (error) {
            console.error('Error creating quick candidate:', error);
            toast.error('Failed to create candidate. Please try again.');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3 animate-float">
                            <UserPlus className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">Quick Form</h1>
                            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">
                                <TrendingUp size={12} className="animate-pulse" />
                                <span>Add a new candidate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                {/* Left Side: Form & Banner */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Overview */}
                    <div className="glass-card p-6 border-blue-100 bg-blue-50/30">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Quick Add</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Fill in the basic details. You can add documents, photos, and other info later.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-10 space-y-12">
                        <div className="space-y-12">
                            {/* Personal Information */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">1. Personal Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                                    placeholder="First name"
                                                />
                                                {errors.firstName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight ml-1">{errors.firstName}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                                                <input
                                                    type="text"
                                                    name="middleName"
                                                    value={formData.middleName}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                                    placeholder="Middle name"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                                placeholder="Full name"
                                            />
                                            {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight ml-1">{errors.name}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIC Number</label>
                                        <input
                                            type="text"
                                            name="nic"
                                            value={formData.nic}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('nic')}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 ${errors.nic ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                            placeholder="NIC number"
                                        />
                                        {formData.dob && (
                                            <div className="flex items-center gap-2 mt-2 ml-1">
                                                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black tracking-widest">DOB: {formData.dob}</div>
                                                <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black tracking-widest">{formData.gender}</div>
                                            </div>
                                        )}
                                        {errors.nic && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight ml-1">{errors.nic}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                            placeholder="Email address"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                            placeholder="Address"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">2. Contact Details</h2>
                                </div>
                                <div className="glass-card p-6 bg-slate-50/50 border-slate-100">
                                    <MultiPhoneInput
                                        primaryPhone={formData.phone}
                                        whatsappPhone={formData.whatsapp}
                                        additionalPhones={formData.additionalContactNumbers}
                                        onPrimaryPhoneChange={(value) => {
                                            setFormData(prev => ({ ...prev, phone: value }));
                                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                            handleBlur('phone');
                                        }}
                                        onWhatsappPhoneChange={(value) => {
                                            setFormData(prev => ({ ...prev, whatsapp: value }));
                                            handleBlur('whatsapp');
                                        }}
                                        onAdditionalPhonesChange={(phones) => setFormData(prev => ({ ...prev, additionalContactNumbers: phones }))}
                                        onDuplicateDetected={(phone, type) => {
                                            console.log(`Duplicate detected: ${phone} (${type})`);
                                        }}
                                    />
                                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-tight ml-1">{errors.phone}</p>}
                                </div>
                            </section>

                            {/* Job Preferences */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">3. Job Preferences</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Role</label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 ${errors.role ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                            placeholder="e.g. Nurse, Driver, Chef"
                                        />
                                        {errors.role && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight ml-1">{errors.role}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <PreferredCountriesSelector
                                            label="Preferred Countries"
                                            selectedCountries={formData.preferredCountries}
                                            onChange={(countries) => {
                                                setFormData(prev => ({ ...prev, preferredCountries: countries }));
                                                if (errors.preferredCountries) {
                                                    setErrors(prev => ({ ...prev, preferredCountries: '' }));
                                                }
                                            }}
                                        />
                                        {errors.preferredCountries && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-tight ml-1">{errors.preferredCountries}</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Notes */}
                            <section>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
                                        placeholder="Add any notes..."
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Actions Dock */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-4 mt-12 pt-8 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate('/candidates')}
                                className="w-full md:w-auto px-8 py-3.5 text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-premium font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-premium font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/40 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Save size={18} className="text-blue-400" />
                                Save Candidate
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Side: Stats & Completion */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                    {(() => {
                        const completionPercentage = ProfileCompletionService.calculateCompletionPercentage({
                            ...formData,
                            name: formData.name || `${formData.firstName} ${formData.middleName}`.trim()
                        });
                        return (
                            <div className="glass-card p-8 bg-white/50 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</h3>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase">Completion</p>
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter text-blue-600 leading-none">{completionPercentage}%</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20"
                                        style={{ width: `${completionPercentage}%` }}
                                    />
                                </div>
                                <div className="mt-8">
                                    <div className={`p-4 rounded-2xl border text-center transition-premium ${completionPercentage < 40 ? 'bg-red-50 border-red-100 text-red-600' :
                                        completionPercentage < 80 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                            'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        }`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none block opacity-60">Status</span>
                                        <span className="text-sm font-black mt-2 block tracking-tight">
                                            {completionPercentage < 40 ? 'NEEDS MORE INFO' :
                                                completionPercentage < 80 ? 'ALMOST COMPLETE' :
                                                    'COMPLETE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="glass-card p-6 bg-slate-900 text-white overflow-hidden relative border-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle size={14} className="text-blue-400" />
                            <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Note</h4>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10">
                            Duplicate detection is active. Records are checked against NIC and phone numbers to prevent duplicates.
                        </p>
                    </div>
                </div>
            </div>

            {/* Duplicate Warning Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="flex items-start gap-5 mb-8">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-inner shrink-0">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Duplicate Found</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    A candidate with matching {duplicateFields.join(', ')} already exists.
                                </p>
                            </div>
                        </div>

                        {duplicateMatches.length > 0 && (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Existing Record</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Name</span>
                                        <span className="text-xs font-black text-slate-900">{duplicateMatches[0].name}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">NIC</span>
                                        <span className="text-xs font-black text-slate-900">{duplicateMatches[0].nic || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">{duplicateMatches[0].stage}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleViewExisting}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-premium hover:shadow-2xl active:scale-95"
                            >
                                View Existing Profile
                            </button>
                            <button
                                onClick={handleContinueAnyway}
                                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-premium hover:shadow-2xl active:scale-95"
                            >
                                Continue Anyway
                            </button>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="w-full py-4 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickAddForm;
