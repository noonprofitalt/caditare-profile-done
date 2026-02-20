import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PartnerService } from '../services/partnerService';
import { CandidateService } from '../services/candidateService';
import { JobService } from '../services/jobService';
import { DemandOrderService } from '../services/demandOrderService';
import { SelectionService } from '../services/selectionService';
import {
    Employer, EmployerStatus, Candidate, DemandOrder,
    DemandOrderStatus, SelectionStage, Job
} from '../types';
import {
    Building2, Users, MapPin, Mail,
    ShieldCheck, AlertTriangle, Clock, Search, Plus,
    ChevronRight, FileText, Star,
    Briefcase, Package, LayoutDashboard, Kanban
} from 'lucide-react';
import DemandOrderList from './employer/DemandOrderList';
import DemandOrderForm from './employer/DemandOrderForm';
import SelectionBoard from './employer/SelectionBoard';
import CandidateMatchModal from './employer/CandidateMatchModal';
import AddPartnerModal from './employer/AddPartnerModal';

type DetailTab = 'overview' | 'demands' | 'selection';

const PartnerManager: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [employers, setEmployers] = useState<Employer[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [allOrders, setAllOrders] = useState<DemandOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Filtered Data State
    const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
    const [employerDemandOrders, setEmployerDemandOrders] = useState<DemandOrder[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');

    // Modal State
    const [showAddPartner, setShowAddPartner] = useState(false);
    const [showDemandForm, setShowDemandForm] = useState(false);
    const [editingOrder, setEditingOrder] = useState<DemandOrder | undefined>();
    const [selectedOrder, setSelectedOrder] = useState<DemandOrder | null>(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [employersData, candidatesData, ordersData] = await Promise.all([
                    PartnerService.getEmployers(),
                    CandidateService.getCandidates(),
                    DemandOrderService.getAll()
                ]);

                setEmployers(employersData || []);
                setCandidates(candidatesData || []);
                setAllOrders(ordersData || []);

                if (id) {
                    const emp = employersData.find(e => e.id === id);
                    if (emp) {
                        setSelectedEmployer(emp);
                        // Deep-link: auto-switch to demands tab and select order
                        const tabParam = searchParams.get('tab');
                        if (tabParam === 'demands' || tabParam === 'selection') {
                            setActiveTab(tabParam as DetailTab);
                        }
                        const orderParam = searchParams.get('order');
                        if (orderParam) {
                            // Since we fetched all orders, we can find it here
                            const order = ordersData.find(o => o.id === orderParam);
                            if (order) {
                                setSelectedOrder(order);
                                setActiveTab('demands');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load partner data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [id, refreshKey]);

    // Load employer-specific data when selectedEmployer changes
    useEffect(() => {
        const loadEmployerData = async () => {
            if (!selectedEmployer) {
                setEmployerJobs([]);
                setEmployerDemandOrders([]);
                return;
            }

            try {
                const [jobs, orders] = await Promise.all([
                    JobService.getJobsByEmployerId(selectedEmployer.id),
                    DemandOrderService.getByEmployerId(selectedEmployer.id)
                ]);
                setEmployerJobs(jobs || []);
                setEmployerDemandOrders(orders || []);
            } catch (error) {
                console.error("Failed to load employer specific data", error);
            }
        };

        loadEmployerData();
    }, [selectedEmployer, refreshKey]);

    // Sync selectedOrder with latest data from allOrders
    useEffect(() => {
        if (selectedOrder) {
            const updated = allOrders.find(o => o.id === selectedOrder.id);
            if (updated && updated !== selectedOrder) {
                setSelectedOrder(updated);
            }
        }
    }, [allOrders, selectedOrder]);

    const employerCandidates = useMemo(() => {
        if (!selectedEmployer) return [];
        // We rely on employerJobs having been fetched
        const jobIds = employerJobs.map(j => j.id);
        return candidates.filter(c => c.jobId && jobIds.includes(c.jobId));
    }, [selectedEmployer, candidates, employerJobs]);

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

    const triggerRefresh = () => setRefreshKey(k => k + 1);

    const handleSelectEmployer = (emp: Employer) => {
        setSelectedEmployer(emp);
        setActiveTab('overview');
        setSelectedOrder(null);
    };

    if (isLoading) return (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-96 gap-4">
            <Building2 size={48} className="text-blue-600 animate-pulse" />
            <p className="font-bold">Loading Employer Dashboard...</p>
        </div>
    );

    // Compute global stats using state data
    const globalStats = {
        totalPartners: employers.length,
        activeAgreements: employers.filter(e => e.status === EmployerStatus.ACTIVE).length,
        openDemands: allOrders.filter(o => o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED).length,
        pendingDocs: employers.filter(e => e.status === EmployerStatus.PENDING_APPROVAL).length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Employer CRM</h2>
                    <p className="text-slate-500 mt-1">Manage global partners, demand orders, and candidate selections.</p>
                </div>
                <button
                    onClick={() => setShowAddPartner(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >
                    <Plus size={18} /> Add New Partner
                </button>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partners', value: globalStats.totalPartners, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Agreements', value: globalStats.activeAgreements, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Open Demands', value: globalStats.openDemands, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Pending Approval', value: globalStats.pendingDocs, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
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

            <div className="flex flex-col lg:flex-row gap-8">
                {/* PARTNER LIST */}
                <div className="w-full lg:w-[380px] shrink-0 space-y-4">
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

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-h-[calc(100vh-360px)] overflow-y-auto">
                        {filteredEmployers.map(employer => {
                            const quotaPercent = employer.quotaTotal ? Math.round((employer.quotaUsed || 0) / employer.quotaTotal * 100) : 0;
                            // Need to count orders from allOrders since we can't fetch per employer in list efficiently without N+1
                            // Or we filter appropriately
                            const demandCount = allOrders.filter(o => o.employerId === employer.id).length;
                            const isSelected = selectedEmployer?.id === employer.id;

                            return (
                                <div
                                    key={employer.id}
                                    onClick={() => handleSelectEmployer(employer)}
                                    className={`px-5 py-4 hover:bg-blue-50/30 transition-colors cursor-pointer group border-b border-slate-50 last:border-b-0 ${isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                                            }`}>
                                            {employer.companyName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{employer.companyName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                    <MapPin size={9} /> {employer.country}
                                                </span>
                                                {demandCount > 0 && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                                                        {demandCount} orders
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(employer.status)}`}>
                                                {employer.status}
                                            </span>
                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ${quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 70 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${quotaPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredEmployers.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400 font-bold">No partners found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* DETAIL AREA */}
                <div className="flex-1 min-w-0">
                    {selectedEmployer ? (
                        <div className="space-y-6">
                            {/* Employer Header */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                                            {selectedEmployer.companyName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{selectedEmployer.companyName}</h3>
                                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                                                <MapPin size={12} /> {selectedEmployer.country}
                                                <span className="text-slate-300">•</span>
                                                {selectedEmployer.regNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedEmployer.status)}`}>
                                            {selectedEmployer.status}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                                            <Star size={12} fill="currentColor" /> {selectedEmployer.selectionRatio ? (selectedEmployer.selectionRatio * 10).toFixed(1) : '8.5'}
                                        </span>
                                        <Link
                                            to={`/jobs?employer=${selectedEmployer.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all"
                                        >
                                            <Briefcase size={12} /> View Jobs ({employerJobs.length})
                                        </Link>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-3 mt-5">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Comms / Hire</p>
                                        <p className="text-lg font-black text-slate-800">${selectedEmployer.commissionPerHire || '450'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pay Cycle</p>
                                        <p className="text-lg font-black text-slate-800">{selectedEmployer.paymentTermDays || '30'} Days</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Quota Used</p>
                                        <p className="text-lg font-black text-slate-800">{selectedEmployer.quotaUsed || 0}/{selectedEmployer.quotaTotal || 50}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Jobs Posted</p>
                                        <p className="text-lg font-black text-blue-600">{employerJobs.length}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Demand Orders</p>
                                        <p className="text-lg font-black text-purple-600">{employerDemandOrders.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                {([
                                    { key: 'overview' as DetailTab, label: 'Overview', icon: <LayoutDashboard size={14} /> },
                                    { key: 'demands' as DetailTab, label: 'Demand Orders', icon: <Package size={14} /> },
                                    { key: 'selection' as DetailTab, label: 'Selection Board', icon: <Kanban size={14} /> },
                                ]).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                            if (tab.key !== 'selection') setSelectedOrder(null);
                                        }}
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.key
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Activity Log */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                            Recent Activity
                                            <button className="text-blue-600 hover:underline">View All</button>
                                        </h4>
                                        <div className="space-y-4">
                                            {(selectedEmployer.activityLog || []).slice(0, 5).map(act => (
                                                <div key={act.id} className="flex gap-3 relative before:absolute before:left-2.5 before:top-8 before:bottom-0 before:w-px before:bg-slate-100 last:before:hidden">
                                                    <div className="w-5 h-5 bg-white border-2 border-slate-100 rounded-full flex-shrink-0 z-10"></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-tight">{act.type}: {act.content}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(act.timestamp).toLocaleDateString()} • {act.actor}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedEmployer.activityLog || selectedEmployer.activityLog.length === 0) && (
                                                <p className="text-xs text-slate-400 italic">No activity recorded</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Jobs + Pipeline */}
                                    <div className="space-y-6">
                                        {/* Active Jobs */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Briefcase size={12} /> Active Jobs ({employerJobs.length})
                                            </h4>
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
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Users size={12} /> Candidate Pipeline ({employerCandidates.length})
                                            </h4>
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
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legal Documents - Full Width */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Legal Documents</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedEmployer.documents.map(doc => (
                                                <div key={doc.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-100 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={16} className="text-slate-400 group-hover:text-blue-600" />
                                                        <div>
                                                            <p className="text-[11px] font-bold text-slate-800">{doc.title}</p>
                                                            <p className="text-[10px] text-slate-400">Exp: {doc.expiryDate || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${doc.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="lg:col-span-2 flex gap-3">
                                        <button
                                            onClick={() => navigate(`/jobs?employer=${selectedEmployer.id}`)}
                                            className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                                        >
                                            Manage Jobs
                                        </button>
                                        <button
                                            onClick={() => { setActiveTab('demands'); setShowDemandForm(true); }}
                                            className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all"
                                        >
                                            Create Demand Order
                                        </button>
                                        <a
                                            href={`mailto:${selectedEmployer.email}`}
                                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center"
                                        >
                                            <Mail size={18} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'demands' && (
                                <DemandOrderList
                                    key={refreshKey}
                                    employerId={selectedEmployer.id}
                                    onSelectOrder={(order) => {
                                        setSelectedOrder(order);
                                        setActiveTab('selection');
                                    }}
                                    selectedOrderId={selectedOrder?.id}
                                    onCreateNew={() => {
                                        setEditingOrder(undefined);
                                        setShowDemandForm(true);
                                    }}
                                />
                            )}

                            {activeTab === 'selection' && (
                                selectedOrder ? (
                                    <SelectionBoard
                                        key={refreshKey}
                                        demandOrder={selectedOrder}
                                        onBack={() => {
                                            setSelectedOrder(null);
                                            setActiveTab('demands');
                                        }}
                                        onMatchCandidates={() => setShowMatchModal(true)}
                                        onRefresh={triggerRefresh}
                                    />
                                ) : (
                                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                                        <Kanban size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h4 className="text-sm font-bold text-slate-500">No Demand Order Selected</h4>
                                        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                                            Go to the <button onClick={() => setActiveTab('demands')} className="text-blue-600 hover:underline font-bold">Demand Orders</button> tab and select an order to view its selection board.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center h-[600px] flex flex-col items-center justify-center">
                            <div className="p-4 bg-white rounded-full text-slate-300 mb-4 shadow-sm">
                                <Building2 size={48} />
                            </div>
                            <h4 className="font-bold text-slate-400">No Partner Selected</h4>
                            <p className="text-xs text-slate-400 mt-2 max-w-xs">Select a company from the list to view their full profile, demand orders, and candidate selection board.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {showAddPartner && (
                <AddPartnerModal
                    onClose={() => setShowAddPartner(false)}
                    onSaved={(emp) => {
                        setShowAddPartner(false);
                        setSelectedEmployer(emp);
                        triggerRefresh();
                    }}
                />
            )}

            {showDemandForm && selectedEmployer && (
                <DemandOrderForm
                    employerId={selectedEmployer.id}
                    existingOrder={editingOrder}
                    onClose={() => { setShowDemandForm(false); setEditingOrder(undefined); }}
                    onSaved={() => {
                        setShowDemandForm(false);
                        setEditingOrder(undefined);
                        triggerRefresh();
                    }}
                />
            )}

            {showMatchModal && selectedOrder && (
                <CandidateMatchModal
                    demandOrder={selectedOrder}
                    onClose={() => setShowMatchModal(false)}
                    onMatched={() => {
                        setShowMatchModal(false);
                        triggerRefresh();
                    }}
                />
            )}
        </div>
    );
};

export default PartnerManager;
