import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, JobRole } from '../types';
import { CandidateService } from '../services/candidateService';
import { DuplicateDetectionService } from '../services/duplicateDetectionService';
import { Save, X, AlertCircle, UserPlus, Phone, MapPin, Briefcase, Globe, Plus, Trash2 } from 'lucide-react';
import MultiSelect from './ui/MultiSelect';

const QuickAddForm: React.FC = () => {
    const navigate = useNavigate();
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
    const [duplicateFields, setDuplicateFields] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        nic: '',
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
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle duplicate check on blur
    const handleBlur = (field: 'nic' | 'phone' | 'whatsapp') => {
        const value = formData[field];
        if (!value) return;

        const checkData: any = {};
        if (field === 'nic') checkData.nic = value;
        if (field === 'phone') checkData.phone = value;
        if (field === 'whatsapp') checkData.whatsapp = value;

        const { isDuplicate, matches, matchedFields } = DuplicateDetectionService.isDuplicate(checkData);

        if (isDuplicate) {
            setDuplicateMatches(matches);
            setDuplicateFields(matchedFields);
            setShowDuplicateModal(true);
        }
    };

    // Add additional contact number
    const addContactNumber = () => {
        setFormData(prev => ({
            ...prev,
            additionalContactNumbers: [...prev.additionalContactNumbers, '']
        }));
    };

    // Remove additional contact number
    const removeContactNumber = (index: number) => {
        setFormData(prev => ({
            ...prev,
            additionalContactNumbers: prev.additionalContactNumbers.filter((_, i) => i !== index)
        }));
    };

    // Update additional contact number
    const updateContactNumber = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            additionalContactNumbers: prev.additionalContactNumbers.map((num, i) =>
                i === index ? value : num
            )
        }));
    };

    // Validate form
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Name must be at least 3 characters';
        }

        if (!formData.nic.trim()) {
            newErrors.nic = 'NIC is required';
        } else if (!/^(\d{9}[VXvx]|\d{12})$/.test(formData.nic.trim())) {
            newErrors.nic = 'Invalid NIC format (e.g., 123456789V or 200012345678)';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^(\+94|0)\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone format (e.g., +94771234567 or 0771234567)';
        }

        if (!formData.role.trim()) {
            newErrors.role = 'Job role is required';
        }

        if (formData.preferredCountries.length === 0) {
            newErrors.preferredCountries = 'Select at least one preferred country';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Final duplicate check
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

        // Create Quick Add candidate
        try {
            const candidate = CandidateService.createQuickCandidate({
                name: formData.name.trim(),
                nic: formData.nic.trim().toUpperCase(),
                phone: formData.phone.trim(),
                whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
                email: formData.email.trim(),
                address: formData.address.trim(),
                role: formData.role.trim(),
                preferredCountries: formData.preferredCountries,
                additionalContactNumbers: formData.additionalContactNumbers.filter(n => n.trim())
            });

            // Navigate to candidate detail page
            navigate(`/candidates/${candidate.id}`);
        } catch (error) {
            console.error('Error creating quick candidate:', error);
            alert('Failed to create candidate. Please try again.');
        }
    };

    // Handle viewing existing profile
    const handleViewExisting = () => {
        if (duplicateMatches.length > 0) {
            navigate(`/candidates/${duplicateMatches[0].id}`);
        }
    };

    // Handle continue anyway (admin override)
    const handleContinueAnyway = () => {
        setShowDuplicateModal(false);
        // Proceed with submission without duplicate check
        try {
            const candidate = CandidateService.createQuickCandidate({
                name: formData.name.trim(),
                nic: formData.nic.trim().toUpperCase(),
                phone: formData.phone.trim(),
                whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
                email: formData.email.trim(),
                address: formData.address.trim(),
                role: formData.role.trim(),
                preferredCountries: formData.preferredCountries,
                additionalContactNumbers: formData.additionalContactNumbers.filter(n => n.trim())
            });

            navigate(`/candidates/${candidate.id}`);
        } catch (error) {
            console.error('Error creating quick candidate:', error);
            alert('Failed to create candidate. Please try again.');
        }
    };

    const countryOptions = Object.values(Country);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <UserPlus className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Quick Add Candidate</h1>
                            <p className="text-sm text-slate-600 mt-1">Fast lead capture with minimal required information</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <h3 className="font-semibold text-blue-900">Quick Add Mode</h3>
                        <p className="text-sm text-blue-800 mt-1">
                            Capture essential candidate information quickly. You can complete the full profile later from the candidate detail page.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-slate-600" />
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="Enter full name"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    NIC <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nic"
                                    value={formData.nic}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('nic')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nic ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="123456789V or 200012345678"
                                />
                                {errors.nic && <p className="text-red-500 text-xs mt-1">{errors.nic}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="City, District"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Phone size={20} className="text-slate-600" />
                            Contact Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Primary Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('phone')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="+94771234567"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    WhatsApp Number
                                </label>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('whatsapp')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+94771234567"
                                />
                            </div>
                        </div>

                        {/* Additional Contact Numbers */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Additional Contact Numbers
                                </label>
                                <button
                                    type="button"
                                    onClick={addContactNumber}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    Add Number
                                </button>
                            </div>
                            {formData.additionalContactNumbers.map((number, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="tel"
                                        value={number}
                                        onChange={(e) => updateContactNumber(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="+94771234567"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeContactNumber(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Job Preferences */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-slate-600" />
                            Job Preferences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Desired Job Role <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.role ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="e.g., Driver, Housemaid, Nurse"
                                />
                                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Preferred Countries <span className="text-red-500">*</span>
                                </label>
                                <MultiSelect
                                    options={countryOptions}
                                    selected={formData.preferredCountries}
                                    onChange={(countries) => {
                                        setFormData(prev => ({ ...prev, preferredCountries: countries }));
                                        if (errors.preferredCountries) {
                                            setErrors(prev => ({ ...prev, preferredCountries: '' }));
                                        }
                                    }}
                                    placeholder="Select countries"
                                />
                                {errors.preferredCountries && <p className="text-red-500 text-xs mt-1">{errors.preferredCountries}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Any additional information..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => navigate('/candidates')}
                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Quick Profile
                    </button>
                </div>
            </form>

            {/* Duplicate Warning Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Duplicate Candidate Detected</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    A candidate with matching {duplicateFields.join(', ')} already exists.
                                </p>
                            </div>
                        </div>

                        {duplicateMatches.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <p className="text-sm font-medium text-slate-700 mb-2">Existing Candidate:</p>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p><strong>Name:</strong> {duplicateMatches[0].name}</p>
                                    <p><strong>NIC:</strong> {duplicateMatches[0].nic || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {duplicateMatches[0].phone}</p>
                                    <p><strong>Status:</strong> {duplicateMatches[0].stage}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleViewExisting}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                View Existing Profile
                            </button>
                            <button
                                onClick={handleContinueAnyway}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                            >
                                Continue Anyway (Admin Override)
                            </button>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="w-full px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
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
