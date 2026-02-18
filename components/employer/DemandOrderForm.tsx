import React, { useState } from 'react';
import { DemandOrder, DemandOrderStatus, JobStatus } from '../../types';
import { DemandOrderService } from '../../services/demandOrderService';
import { JobService } from '../../services/jobService';
import { PartnerService } from '../../services/partnerService';
import { X, Package, MapPin, DollarSign, Clock, Users, FileText, Briefcase } from 'lucide-react';

interface DemandOrderFormProps {
    employerId: string;
    existingOrder?: DemandOrder;
    onClose: () => void;
    onSaved: () => void;
}

const JOB_CATEGORIES = [
    'Construction', 'Hospitality', 'Manufacturing', 'Healthcare',
    'Domestic', 'Agriculture', 'Security', 'Cleaning',
    'Driving', 'IT', 'Retail', 'Food & Beverage', 'Other',
];

const BENEFIT_OPTIONS = [
    'Accommodation', 'Food', 'Transport', 'Medical Insurance',
    'Annual Leave Ticket', 'Overtime Pay', 'Uniform', 'End of Service Benefits',
];

const DemandOrderForm: React.FC<DemandOrderFormProps> = ({
    employerId,
    existingOrder,
    onClose,
    onSaved,
}) => {
    const isEditing = !!existingOrder;

    const [form, setForm] = useState({
        title: existingOrder?.title || '',
        jobCategory: existingOrder?.jobCategory || '',
        country: existingOrder?.country || '',
        location: existingOrder?.location || '',
        positionsRequired: existingOrder?.positionsRequired || 1,
        salaryRange: existingOrder?.salaryRange || '',
        contractDuration: existingOrder?.contractDuration || '2 years',
        benefits: existingOrder?.benefits || [],
        requirements: existingOrder?.requirements?.join(', ') || '',
        deadline: existingOrder?.deadline || '',
        notes: existingOrder?.notes || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.jobCategory) errs.jobCategory = 'Select a category';
        if (!form.country.trim()) errs.country = 'Country is required';
        if (!form.location.trim()) errs.location = 'Location is required';
        if (form.positionsRequired < 1) errs.positionsRequired = 'At least 1 position required';
        if (!form.salaryRange.trim()) errs.salaryRange = 'Salary range is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const order: DemandOrder = {
            id: existingOrder?.id || `do-${Date.now()}`,
            employerId,
            title: form.title,
            jobCategory: form.jobCategory,
            country: form.country,
            location: form.location,
            positionsRequired: form.positionsRequired,
            positionsFilled: existingOrder?.positionsFilled || 0,
            salaryRange: form.salaryRange,
            contractDuration: form.contractDuration,
            benefits: form.benefits,
            requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
            status: existingOrder?.status || DemandOrderStatus.OPEN,
            createdAt: existingOrder?.createdAt || new Date().toISOString(),
            deadline: form.deadline || undefined,
            notes: form.notes || undefined,
        };

        if (isEditing) {
            DemandOrderService.update(order);
        } else {
            DemandOrderService.add(order);
            // Auto-create a companion Job on the job board
            const employer = PartnerService.getEmployerById(employerId);
            JobService.addJob({
                id: `job-${Date.now()}`,
                title: form.title,
                company: employer?.companyName || 'Unknown',
                location: `${form.location}, ${form.country}`,
                salaryRange: form.salaryRange,
                type: 'Full-time',
                description: `Auto-created from Demand Order: ${form.title}. ${form.notes || ''}`.trim(),
                status: JobStatus.OPEN,
                postedDate: new Date().toISOString().split('T')[0],
                requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
                matchedCandidateIds: [],
                employerId,
                demandOrderId: order.id,
                category: form.jobCategory || undefined,
                positions: form.positionsRequired,
                filledPositions: 0,
                deadline: form.deadline || undefined,
                contactPerson: employer?.contactPerson || undefined,
                benefits: form.benefits,
            });
        }
        onSaved();
    };

    const toggleBenefit = (benefit: string) => {
        setForm(prev => ({
            ...prev,
            benefits: prev.benefits.includes(benefit)
                ? prev.benefits.filter(b => b !== benefit)
                : [...prev.benefits, benefit],
        }));
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
                            <Package size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {isEditing ? 'Edit Demand Order' : 'New Demand Order'}
                            </h3>
                            <p className="text-xs text-slate-500">Define the employer's manpower requirements</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                            <Briefcase size={12} className="inline mr-1" /> Order Title *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., 20x Construction Workers for Dubai Project"
                            className={inputClasses('title')}
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Category + Positions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Job Category *</label>
                            <select
                                className={inputClasses('jobCategory')}
                                value={form.jobCategory}
                                onChange={e => setForm(p => ({ ...p, jobCategory: e.target.value }))}
                            >
                                <option value="">Select category...</option>
                                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.jobCategory && <p className="text-xs text-red-500 mt-1">{errors.jobCategory}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                <Users size={12} className="inline mr-1" /> Positions Required *
                            </label>
                            <input
                                type="number"
                                min={1}
                                className={inputClasses('positionsRequired')}
                                value={form.positionsRequired}
                                onChange={e => setForm(p => ({ ...p, positionsRequired: parseInt(e.target.value) || 1 }))}
                            />
                        </div>
                    </div>

                    {/* Country + Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                <MapPin size={12} className="inline mr-1" /> Country *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., United Arab Emirates"
                                className={inputClasses('country')}
                                value={form.country}
                                onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                            />
                            {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">City / Location *</label>
                            <input
                                type="text"
                                placeholder="e.g., Dubai"
                                className={inputClasses('location')}
                                value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            />
                            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                        </div>
                    </div>

                    {/* Salary + Contract */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                <DollarSign size={12} className="inline mr-1" /> Salary Range *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., $1,200 - $1,800/month"
                                className={inputClasses('salaryRange')}
                                value={form.salaryRange}
                                onChange={e => setForm(p => ({ ...p, salaryRange: e.target.value }))}
                            />
                            {errors.salaryRange && <p className="text-xs text-red-500 mt-1">{errors.salaryRange}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                <Clock size={12} className="inline mr-1" /> Contract Duration
                            </label>
                            <select
                                className={inputClasses('contractDuration')}
                                value={form.contractDuration}
                                onChange={e => setForm(p => ({ ...p, contractDuration: e.target.value }))}
                            >
                                <option value="6 months">6 Months</option>
                                <option value="1 year">1 Year</option>
                                <option value="2 years">2 Years</option>
                                <option value="3 years">3 Years</option>
                            </select>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                            <Clock size={12} className="inline mr-1" /> Deadline (Optional)
                        </label>
                        <input
                            type="date"
                            className={inputClasses('deadline')}
                            value={form.deadline}
                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                        />
                    </div>

                    {/* Benefits */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-2 block">Benefits Included</label>
                        <div className="flex flex-wrap gap-2">
                            {BENEFIT_OPTIONS.map(b => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => toggleBenefit(b)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.benefits.includes(b)
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
                                        }`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                            <FileText size={12} className="inline mr-1" /> Requirements (comma-separated)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="e.g., 3+ years experience, Physical fitness, Safety certification"
                            className={inputClasses('requirements')}
                            value={form.requirements}
                            onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Internal Notes (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Any additional notes for the team..."
                            className={inputClasses('notes')}
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        />
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
                            {isEditing ? 'Save Changes' : 'Create Demand Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DemandOrderForm;
