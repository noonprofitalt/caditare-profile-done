import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { DuplicateDetectionService } from '../services/duplicateDetectionService';
import { ProfileCompletionService } from '../services/profileCompletionService';
import { NICService } from '../services/nicService';
import { Save, AlertCircle, UserPlus, TrendingUp, ArrowLeft, CheckCircle2 } from 'lucide-react';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import MultiPhoneInput from './ui/MultiPhoneInput';
import { useCandidates } from '../context/CandidateContext';
import { useToast } from '../context/ToastContext';

const QuickAddForm: React.FC = () => {
    const navigate = useNavigate();
    const { candidates } = useCandidates();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
    const [duplicateFields, setDuplicateFields] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        regNo: '',
        surname: '',
        otherNames: '',
        fullName: '',
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

            // Auto-generate Full Name from Surname and Other Names
            if (name === 'surname' || name === 'otherNames') {
                const s = name === 'surname' ? value : prev.surname;
                const o = name === 'otherNames' ? value : prev.otherNames;
                updated.fullName = `${s} ${o}`.trim();
            }

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
    const handleBlur = (field: 'regNo' | 'nic' | 'phone' | 'whatsapp') => {
        const value = formData[field];
        if (!value) return;

        const checkData: any = {};
        if (field === 'regNo') checkData.regNo = value;
        if (field === 'nic') checkData.nic = value;
        if (field === 'phone') checkData.phone = value;
        if (field === 'whatsapp') checkData.whatsapp = value;

        const { isDuplicate, matches, matchedFields } = DuplicateDetectionService.isDuplicate(checkData, candidates);

        if (isDuplicate) {
            setDuplicateMatches(matches);
            setDuplicateFields(matchedFields);
            console.log('Duplicate detected:', matchedFields);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.surname) newErrors.surname = 'Surname is required';
        if (!formData.fullName) newErrors.fullName = 'Full legal name is required';
        if (!formData.nic) newErrors.nic = 'NIC is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            showToast('Please fill in required fields', 'error');
            return;
        }

        if (!showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        setIsSubmitting(true);

        try {
            const candidate = await CandidateService.createCandidate({
                regNo: (formData.regNo || '').trim(),
                name: (formData.fullName || '').trim() || 'Unknown Candidate',
                firstName: (formData.otherNames || '').trim(),
                surname: (formData.surname || '').trim(),
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
                notes: formData.notes
            });

            if (candidate) {
                showToast('Candidate added successfully', 'success');
                navigate(`/candidates/${candidate.id}`);
            }
        } catch (error) {
            console.error('Error creating candidate:', error);
            showToast('Failed to create candidate', 'error');
        } finally {
            setIsSubmitting(false);
            setShowConfirmation(false);
        }
    };

    if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Registration</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Are you sure you want to add <strong>{formData.fullName}</strong>?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmation(false)}
                            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            Review
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const completionPercentage = ProfileCompletionService.calculateCompletionPercentage({
        ...formData,
        name: formData.fullName
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header / Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">New Candidate</h1>
                        <p className="text-sm text-slate-500">Quick Registration Form</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Personal Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-base font-semibold text-slate-800">1. Personal Details</h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration No.</label>
                                        <input
                                            type="text"
                                            name="regNo"
                                            value={formData.regNo}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('regNo')}
                                            className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="e.g. SPA 14-180125"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                                        <input
                                            type="text"
                                            name="surname"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.surname ? 'border-red-300' : 'border-slate-300'}`}
                                            placeholder="As in Passport"
                                        />
                                        <p className={`text-xs mt-1 transition-opacity ${errors.surname ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.surname || "Error placeholder"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Other Names</label>
                                        <input
                                            type="text"
                                            name="otherNames"
                                            value={formData.otherNames}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Given names"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-md shadow-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.fullName ? 'border-red-300' : 'border-slate-300'}`}
                                            placeholder="Auto-generated from above"
                                        />
                                        <p className={`text-xs mt-1 transition-opacity ${errors.fullName ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.fullName || "Error placeholder"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">NIC Number</label>
                                        <input
                                            type="text"
                                            name="nic"
                                            value={formData.nic}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('nic')}
                                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.nic ? 'border-red-300' : 'border-slate-300'}`}
                                            placeholder="NIC number"
                                        />
                                        {formData.dob && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    DOB: {formData.dob}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {formData.gender}
                                                </span>
                                            </div>
                                        )}
                                        <p className={`text-xs mt-1 transition-opacity ${errors.nic ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.nic || "Error placeholder"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Email address"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Residential address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-base font-semibold text-slate-800">2. Contact Numbers</h2>
                                </div>
                                <div className="p-6">
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
                                    <p className={`text-xs mt-1 transition-opacity ${errors.phone ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.phone || "Error placeholder"}</p>
                                </div>
                            </div>

                            {/* Job Preferences */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-base font-semibold text-slate-800">3. Job Preferences</h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Role</label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.role ? 'border-red-300' : 'border-slate-300'}`}
                                            placeholder="e.g. Nurse, Driver, Chef"
                                        />
                                        <p className={`text-xs mt-1 transition-opacity ${errors.role ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.role || "Error placeholder"}</p>
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
                                        <p className={`text-xs mt-1 transition-opacity ${errors.preferredCountries ? "text-red-600 opacity-100" : "opacity-0"}`}>{errors.preferredCountries || "Error placeholder"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-base font-semibold text-slate-800">Notes (Optional)</h2>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-y"
                                        placeholder="Add any special notes..."
                                    />
                                </div>
                            </div>

                            {/* Actions Dock */}
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/candidates')}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 border border-transparent text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Candidate
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Side Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="lg:sticky lg:top-24 space-y-4">

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={20} className="text-blue-600" />
                                        <h3 className="font-semibold text-slate-900">Profile Status</h3>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${completionPercentage}%` }}
                                    />
                                </div>

                                <div className={`p-3 rounded-lg border text-center transition-colors ${completionPercentage < 40 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                    completionPercentage < 80 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                        'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    }`}>
                                    <span className="text-sm font-medium block">
                                        {completionPercentage < 40 ? 'Needs More Info' :
                                            completionPercentage < 80 ? 'Almost Complete' :
                                                'Complete'}
                                    </span>
                                </div>
                            </div>

                            {(duplicateMatches.length > 0) && (
                                <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-amber-800 text-sm">Potential Duplicate Found</h4>
                                            <p className="text-xs text-amber-700 mt-1 mb-3">
                                                A candidate with similar details ({duplicateFields.join(', ')}) already exists.
                                            </p>
                                            <button
                                                onClick={() => navigate(`/candidates/${duplicateMatches[0].id}`)}
                                                className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
                                            >
                                                View existing profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickAddForm;
