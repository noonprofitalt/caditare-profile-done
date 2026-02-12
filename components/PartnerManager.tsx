import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PartnerService } from '../services/partnerService';
import { CandidateService } from '../services/candidateService';
import { JobService } from '../services/jobService';
import { Employer, EmployerStatus } from '../types';
import {
    Building2, Users, MapPin, Mail,
    ShieldCheck, AlertTriangle, Clock, Search, Plus,
    ChevronRight, FileText, Star,
    Briefcase
} from 'lucide-react';

const PartnerManager: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    // Lazy load employers
    const [employers] = useState<Employer[]>(() => PartnerService.getEmployers() || []);

    const [searchQuery, setSearchQuery] = useState('');

    // Initialize selectedEmployer based on ID if present, otherwise null
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(() => {
        if (id) {
            return PartnerService.getEmployers()?.find(e => e.id === id) || null;
        }
        return null;
    });

    // Derive jobs and candidates using useMemo
    const employerJobs = useMemo(() => {
        if (!selectedEmployer) return [];
        return JobService.getJobsByEmployerId(selectedEmployer.id);
    }, [selectedEmployer]);

    const employerCandidates = useMemo(() => {
        if (!selectedEmployer) return [];
        const jobs = JobService.getJobsByEmployerId(selectedEmployer.id);
        const jobIds = jobs.map(j => j.id);
        const allCandidates = CandidateService.getCandidates() || [];
        return allCandidates.filter(c => c.jobId && jobIds.includes(c.jobId));
    }, [selectedEmployer]);

    const filteredEmployers = employers.filter(e => {
        const query = searchQuery.toLowerCase();
        return (
            (e.companyName || '').toLowerCase().includes(query) ||
            (e.country || '').toLowerCase().includes(query) ||
            (e.contactPerson || '').toLowerCase().includes(query)
        );
    });

    const getStatusColor = (status: EmployerStatus) => {
        switch (status) {
            case EmployerStatus.ACTIVE: return 'bg-green-100 text-green-700';
            case EmployerStatus.INACTIVE: return 'bg-slate-100 text-slate-700';
            case EmployerStatus.PENDING_APPROVAL: return 'bg-amber-100 text-amber-700';
            case EmployerStatus.BLACKLISTED: return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Employer CRM</h2>
                    <p className="text-slate-500 mt-1">Manage global partners, agency agreements, and recruitment quotas.</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                    <Plus size={18} /> Add New Partner
                </button>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partners', value: employers.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Agreements', value: employers.filter(e => e.status === EmployerStatus.ACTIVE).length, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Expiring Soon', value: 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Pending Docs', value: 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h4 className="text-2xl font-black text-slate-800">{stat.value}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-8">
                {/* PARTNER LIST */}
                <div className="flex-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by company name, country, or contact..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Utilization</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployers.map(employer => {
                                    const quotaPercent = employer.quotaTotal ? Math.round((employer.quotaUsed || 0) / employer.quotaTotal * 100) : 0;
                                    return (
                                        <tr
                                            key={employer.id}
                                            onClick={() => setSelectedEmployer(employer)}
                                            className={`hover:bg-blue-50/30 transition-colors cursor-pointer group ${selectedEmployer?.id === employer.id ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        {employer.companyName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{employer.companyName}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {employer.country}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="w-32">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Quota {employer.quotaUsed}/{employer.quotaTotal}</span>
                                                        <span className="text-[9px] font-black text-slate-800">{quotaPercent}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 70 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                            style={{ width: `${quotaPercent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(employer.status)}`}>
                                                    {employer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DETAILS SIDEBAR */}
                <div className="w-96 shrink-0">
                    {selectedEmployer ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 sticky top-8">
                            <div className="flex items-start justify-between">
                                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                                    {selectedEmployer.companyName.charAt(0)}
                                </div>
                                <div className="flex gap-1">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                                        <Star size={12} fill="currentColor" /> {selectedEmployer.selectionRatio ? (selectedEmployer.selectionRatio * 10).toFixed(1) : '8.5'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedEmployer.companyName}</h3>
                                <p className="text-sm text-slate-500">{selectedEmployer.regNumber}</p>
                            </div>

                            {/* ANALYTICS GRID */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Comms / Hire</p>
                                    <p className="text-lg font-black text-slate-800">${selectedEmployer.commissionPerHire || '450'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pay Cycle</p>
                                    <p className="text-lg font-black text-slate-800">{selectedEmployer.paymentTermDays || '30'} Days</p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* TABS FOR INFO */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        Recent Activity
                                        <button className="text-blue-600 hover:underline">View All</button>
                                    </h4>
                                    <div className="space-y-4">
                                        {(selectedEmployer.activityLog || []).slice(0, 3).map(act => (
                                            <div key={act.id} className="flex gap-3 relative before:absolute before:left-2.5 before:top-8 before:bottom-0 before:w-px before:bg-slate-100 last:before:hidden">
                                                <div className="w-5 h-5 bg-white border-2 border-slate-100 rounded-full flex-shrink-0 z-10"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">{act.type}: {act.content}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(act.timestamp).toLocaleDateString()} • {act.actor}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LIVE ACTIVITY SECTION */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Activity</h4>

                                    {/* Active Jobs */}
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
                                            <Briefcase size={12} />
                                            Active Jobs ({employerJobs.length})
                                        </p>
                                        <div className="space-y-2">
                                            {employerJobs.length > 0 ? employerJobs.map(job => (
                                                <div key={job.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-slate-800 leading-tight">{job.title}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{job.location}</p>
                                                        </div>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-green-600 font-bold mt-1">{job.salaryRange}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-slate-400 italic">No active job postings</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Candidate Pipeline */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
                                            <Users size={12} />
                                            Candidate Pipeline ({employerCandidates.length})
                                        </p>
                                        <div className="space-y-2">
                                            {employerCandidates.length > 0 ? employerCandidates.slice(0, 5).map(candidate => (
                                                <Link
                                                    key={candidate.id}
                                                    to={`/candidates/${candidate.id}`}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs group-hover:bg-blue-100">
                                                            {candidate.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 leading-tight">{candidate.name}</p>
                                                            <p className="text-[10px] text-slate-400">{candidate.stage}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                                                </Link>
                                            )) : (
                                                <p className="text-xs text-slate-400 italic">No candidates in pipeline</p>
                                            )}
                                            {employerCandidates.length > 5 && (
                                                <Link
                                                    to="/candidates"
                                                    className="text-[10px] text-blue-600 hover:underline font-bold block text-center pt-2"
                                                >
                                                    View all {employerCandidates.length} candidates
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Legal Documents</h4>
                                    <div className="space-y-2">
                                        {selectedEmployer.documents.map(doc => (
                                            <div key={doc.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-100 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={16} className="text-slate-400 group-hover:text-blue-600" />
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-800">{doc.title}</p>
                                                        <p className="text-[10px] text-slate-400">Exp: {doc.expiryDate}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${doc.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button
                                    onClick={() => navigate(`/jobs?employer=${selectedEmployer.id}`)}
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                                >
                                    Manage Jobs
                                </button>
                                <a
                                    href={`mailto:${selectedEmployer.email}`}
                                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center"
                                >
                                    <Mail size={18} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center h-[600px] flex flex-col items-center justify-center">
                            <div className="p-4 bg-white rounded-full text-slate-300 mb-4 shadow-sm">
                                <Building2 size={48} />
                            </div>
                            <h4 className="font-bold text-slate-400">No Partner Selected</h4>
                            <p className="text-xs text-slate-400 mt-2 max-w-xs">Select a company from the list to view their full profile, documents, and recruitment activity.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerManager;
