import React, { useState } from 'react';
import { Employer, EmployerStatus, EmployerDocument, EmployerActivity } from '../../types';
import { PartnerService } from '../../services/partnerService';
import { X, Building2, MapPin, Mail, Phone, DollarSign, FileText, User } from 'lucide-react';

interface AddPartnerModalProps {
    onClose: () => void;
    onSaved: (employer: Employer) => void;
}

const COUNTRIES = [
    'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
    'Oman', 'Jordan', 'South Korea', 'Japan', 'Malaysia',
    'Singapore', 'Italy', 'Romania', 'Poland', 'Other',
];

const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ onClose, onSaved }) => {
    const [form, setForm] = useState({
        companyName: '',
        regNumber: '',
        country: '',
        address: '',
        contactPerson: '',
        email: '',
        phone: '',
        commissionPerHire: '',
        paymentTermDays: '30',
        quotaTotal: '50',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.companyName.trim()) errs.companyName = 'Company name is required';
        if (!form.country) errs.country = 'Country is required';
        if (!form.contactPerson.trim()) errs.contactPerson = 'Contact person is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const now = new Date().toISOString();
        const employer: Employer = {
            id: `emp-${Date.now()}`,
            companyName: form.companyName,
            regNumber: form.regNumber || `REG-${Date.now().toString().slice(-6)}`,
            country: form.country,
            contactPerson: form.contactPerson,
            email: form.email,
            phone: form.phone,
            status: EmployerStatus.PENDING_APPROVAL,
            commissionPerHire: form.commissionPerHire ? parseFloat(form.commissionPerHire) : undefined,
            paymentTermDays: parseInt(form.paymentTermDays) || 30,
            quotaTotal: parseInt(form.quotaTotal) || 50,
            quotaUsed: 0,
            selectionRatio: 0,
            joinedDate: now,
            documents: [
                {
                    id: `doc-${Date.now()}-1`,
                    title: 'Trade License',
                    type: 'License',
                    status: 'Pending',
                    expiryDate: '',
                } as EmployerDocument,
                {
                    id: `doc-${Date.now()}-2`,
                    title: 'Power of Attorney',
                    type: 'POA',
                    status: 'Pending',
                    expiryDate: '',
                    uploadedAt: now,
                } as EmployerDocument,
            ],
            activityLog: [
                {
                    id: `act-${Date.now()}`,
                    type: 'Note',
                    content: 'Partner account created',
                    timestamp: now,
                    actor: 'System',
                } as EmployerActivity,
            ],
        };

        try {
            await PartnerService.addEmployer(employer);
            onSaved(employer);
        } catch (error) {
            console.error("Failed to add partner:", error);
        }
    };

    const inputClasses = (field: string) =>
        `w-full px-4 py-2.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors[field]
            ? 'border-red-300 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'
        }`;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-8 py-5 rounded-t-3xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Add New Partner</h3>
                            <p className="text-xs text-slate-500">Register a new employer / recruitment partner</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Company Info Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Building2 size={12} /> Company Information
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Company Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., BuildCorp International"
                                    className={inputClasses('companyName')}
                                    value={form.companyName}
                                    onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                                />
                                {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Registration Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., REG-123456"
                                        className={inputClasses('regNumber')}
                                        value={form.regNumber}
                                        onChange={e => setForm(p => ({ ...p, regNumber: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                        <MapPin size={12} className="inline mr-1" /> Country *
                                    </label>
                                    <select
                                        className={inputClasses('country')}
                                        value={form.country}
                                        onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                                    >
                                        <option value="">Select country...</option>
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Address</label>
                                <input
                                    type="text"
                                    placeholder="Full company address"
                                    className={inputClasses('address')}
                                    value={form.address}
                                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Contact Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User size={12} /> Contact Details
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Contact Person *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Ahmed Al Rasheed"
                                    className={inputClasses('contactPerson')}
                                    value={form.contactPerson}
                                    onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))}
                                />
                                {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                        <Mail size={12} className="inline mr-1" /> Email *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="email@company.com"
                                        className={inputClasses('email')}
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                        <Phone size={12} className="inline mr-1" /> Phone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+971 xxx xxxx"
                                        className={inputClasses('phone')}
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Financial Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <DollarSign size={12} /> Financial Terms
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Commission/Hire ($)</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 450"
                                    className={inputClasses('commissionPerHire')}
                                    value={form.commissionPerHire}
                                    onChange={e => setForm(p => ({ ...p, commissionPerHire: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Payment Terms (days)</label>
                                <select
                                    className={inputClasses('paymentTermDays')}
                                    value={form.paymentTermDays}
                                    onChange={e => setForm(p => ({ ...p, paymentTermDays: e.target.value }))}
                                >
                                    <option value="15">15 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="45">45 Days</option>
                                    <option value="60">60 Days</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Quota (Annual)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={inputClasses('quotaTotal')}
                                    value={form.quotaTotal}
                                    onChange={e => setForm(p => ({ ...p, quotaTotal: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            Create Partner
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPartnerModal;
