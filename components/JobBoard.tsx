import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { JobService } from '../services/jobService';
import { PartnerService } from '../services/partnerService';
import { DemandOrderService } from '../services/demandOrderService';
import { Job, JobStatus, Candidate, Employer, DemandOrder } from '../types';
import {
  MapPin, DollarSign, Clock, Plus, Briefcase, Users, Target,
  ChevronRight, Search, X, Edit3, Trash2, Building2,
  Calendar, Award, Package, Filter, ArrowLeft, CheckCircle2,
  AlertCircle, Heart, Link2
} from 'lucide-react';

type FilterTab = 'all' | 'open' | 'filled' | 'closed';

const JOB_CATEGORIES = [
  'Construction', 'Hospitality', 'Healthcare', 'Manufacturing',
  'IT & Technology', 'Agriculture', 'Retail', 'Logistics',
  'Domestic Work', 'Security', 'Other'
];

const BENEFIT_OPTIONS = [
  'Housing', 'Transport', 'Medical Insurance', 'Annual Flight',
  'Meals', 'Overtime Pay', 'Uniform Provided', 'Continuing Education',
  'Housing Allowance', 'End of Service Gratuity'
];

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterEmployerId = searchParams.get('employer');

  // Load data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const jobsData = await JobService.getJobs();
        const employersData = await PartnerService.getEmployers();
        const candidatesData = await CandidateService.getCandidates() || [];
        setJobs(jobsData);
        setEmployers(employersData);
        setCandidates(candidatesData);
      } catch (e) {
        console.error('Failed to load job data', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Derived
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // employer filter from URL
    if (filterEmployerId) {
      result = result.filter(j => j.employerId === filterEmployerId);
    }

    // status filter
    if (activeFilter === 'open') result = result.filter(j => j.status === JobStatus.OPEN);
    else if (activeFilter === 'filled') result = result.filter(j => j.status === JobStatus.FILLED);
    else if (activeFilter === 'closed') result = result.filter(j => j.status === JobStatus.CLOSED);

    // search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.category || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [jobs, activeFilter, searchQuery, filterEmployerId]);

  const stats = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter(j => j.status === JobStatus.OPEN).length,
    filled: jobs.filter(j => j.status === JobStatus.FILLED).length,
    closed: jobs.filter(j => j.status === JobStatus.CLOSED).length,
    totalPositions: jobs.reduce((s, j) => s + (j.positions || 1), 0),
    filledPositions: jobs.reduce((s, j) => s + (j.filledPositions || 0), 0),
  }), [jobs]);

  const getEmployerName = (empId?: string) => {
    if (!empId) return 'Unassigned';
    return employers.find(e => e.id === empId)?.companyName || 'Unknown';
  };

  const getMatchedCandidates = (job: Job) => {
    if (!job.matchedCandidateIds?.length) return [];
    return candidates.filter(c => job.matchedCandidateIds!.includes(c.id));
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case JobStatus.FILLED: return 'bg-blue-50 text-blue-700 border-blue-100';
      case JobStatus.CLOSED: return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    await JobService.deleteJob(jobId);
    if (selectedJob?.id === jobId) setSelectedJob(null);
    setShowDeleteConfirm(null);
    triggerRefresh();
  };

  const fillPercent = (job: Job) => {
    const pos = job.positions || 1;
    const filled = job.filledPositions || 0;
    return Math.min(Math.round((filled / pos) * 100), 100);
  };

  const isDeadlineSoon = (deadline?: string) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 14;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Board</h1>
          <p className="text-slate-500 text-sm mt-1">Manage job postings, track positions, and match candidates.</p>
        </div>
        <button
          onClick={() => { setEditingJob(null); setShowForm(true); }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
        >
          <Plus size={18} /> Post New Job
        </button>
      </div>

      {/* Employer filter banner */}
      {filterEmployerId && (
        <div className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={16} />
            <span className="text-sm font-bold">
              Showing jobs for: {getEmployerName(filterEmployerId)}
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Open', value: stats.open, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Filled', value: stats.filled, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Positions', value: stats.totalPositions, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Fill Rate', value: `${stats.totalPositions > 0 ? Math.round((stats.filledPositions / stats.totalPositions) * 100) : 0}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${s.bg} ${s.color} rounded-xl`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-black text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by job title, company, location, or category..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-none snap-x">
          {([
            { key: 'all' as FilterTab, label: 'All', count: stats.total },
            { key: 'open' as FilterTab, label: 'Open', count: stats.open },
            { key: 'filled' as FilterTab, label: 'Filled', count: stats.filled },
            { key: 'closed' as FilterTab, label: 'Closed', count: stats.closed },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex shrink-0 snap-start px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-1.5 ${activeFilter === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeFilter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Job Cards Grid */}
        <div className={`${selectedJob ? 'w-full lg:w-[55%]' : 'w-full'} transition-all duration-300`}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-52 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="w-16 h-5 bg-slate-100 rounded-full" />
                  </div>
                  <div className="w-3/4 h-5 bg-slate-100 rounded-lg mb-2" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded-lg mb-6" />
                  <div className="w-full h-2 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-sm font-bold text-slate-400">No jobs found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Click "Post New Job" to get started'}
              </p>
            </div>
          ) : (
            <div className={`grid ${selectedJob ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
              {filteredJobs.map(job => {
                const fp = fillPercent(job);
                const isSelected = selectedJob?.id === job.id;
                const deadlineSoon = isDeadlineSoon(job.deadline);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all group hover:shadow-md ${isSelected
                      ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
                      : 'border-slate-200 hover:border-blue-200'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                          } transition-all`}>
                          <Briefcase size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{job.title}</h3>
                          <p className="text-[10px] text-slate-400 font-bold">{job.company}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={10} /> {job.salaryRange}</span>
                      {job.category && (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{job.category}</span>
                      )}
                    </div>

                    {/* Positions Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[9px] mb-1">
                        <span className="font-bold text-slate-400">{job.filledPositions || 0}/{job.positions || '?'} Positions Filled</span>
                        <span className="font-bold text-slate-500">{fp}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${fp >= 100 ? 'bg-blue-500' : fp >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          style={{ width: `${fp}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400">
                        Posted {new Date(job.postedDate).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {deadlineSoon && (
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <AlertCircle size={8} /> Soon
                          </span>
                        )}
                        {(job.matchedCandidateIds?.length || 0) > 0 && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {job.matchedCandidateIds!.length} matched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedJob && (
          <div className="w-full lg:w-[45%] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            {/* Detail Header */}
            <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full" />
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
              <div className="relative z-10">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase mb-3 ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
                <h3 className="text-xl font-bold leading-tight mb-1">{selectedJob.title}</h3>
                <p className="text-sm text-slate-400">{selectedJob.company} • {selectedJob.location}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-lg font-black text-slate-800">{selectedJob.positions || '—'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Positions</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-lg font-black text-emerald-600">{selectedJob.filledPositions || 0}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Filled</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-lg font-black text-blue-600">{selectedJob.matchedCandidateIds?.length || 0}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Matched</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign size={14} className="text-blue-500 shrink-0" />
                  <span className="text-slate-700 font-bold">{selectedJob.salaryRange}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-blue-500 shrink-0" />
                  <span className="text-slate-700">{selectedJob.type}</span>
                </div>
                {selectedJob.category && (
                  <div className="flex items-center gap-3 text-sm">
                    <Package size={14} className="text-blue-500 shrink-0" />
                    <span className="text-slate-700">{selectedJob.category}</span>
                  </div>
                )}
                {selectedJob.contactPerson && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={14} className="text-blue-500 shrink-0" />
                    <span className="text-slate-700">Contact: {selectedJob.contactPerson}</span>
                  </div>
                )}
                {selectedJob.deadline && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={14} className={isDeadlineSoon(selectedJob.deadline) ? 'text-amber-500' : 'text-blue-500'} />
                    <span className={isDeadlineSoon(selectedJob.deadline) ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                      Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}
                      {isDeadlineSoon(selectedJob.deadline) && ' ⚠️'}
                    </span>
                  </div>
                )}
                {selectedJob.employerId && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={14} className="text-blue-500 shrink-0" />
                    <Link to={`/partners/${selectedJob.employerId}`} className="text-blue-600 hover:underline font-bold">
                      {getEmployerName(selectedJob.employerId)}
                    </Link>
                  </div>
                )}
                {selectedJob.demandOrderId && (
                  <div className="flex items-center gap-3 text-sm">
                    <Link2 size={14} className="text-purple-500 shrink-0" />
                    <Link
                      to={`/partners/${selectedJob.employerId || ''}?tab=demands&order=${selectedJob.demandOrderId}`}
                      className="text-purple-600 hover:underline font-bold text-xs"
                    >
                      View Demand Order →
                    </Link>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requirements.map((req, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Benefits</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.benefits.map((b, i) => (
                      <span key={i} className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <Heart size={8} fill="currentColor" /> {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Candidates */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Matched Candidates ({selectedJob.matchedCandidateIds?.length || 0})
                </h4>
                {getMatchedCandidates(selectedJob).length > 0 ? (
                  <div className="space-y-2">
                    {getMatchedCandidates(selectedJob).map(c => (
                      <Link
                        key={c.id}
                        to={`/candidates/${c.id}`}
                        className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.stage}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No candidates matched yet</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setEditingJob(selectedJob); setShowForm(true); }}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(selectedJob.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm === selectedJob.id && (
              <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-bold text-red-700 mb-3">Delete "{selectedJob.title}"? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteJob(selectedJob.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <JobFormModal
          job={editingJob}
          employers={employers}
          onClose={() => { setShowForm(false); setEditingJob(null); }}
          onSaved={(savedJob) => {
            setShowForm(false);
            setEditingJob(null);
            setSelectedJob(savedJob);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
};

/* ─────────── Job Form Modal ─────────── */

interface JobFormModalProps {
  job: Job | null;
  employers: Employer[];
  onClose: () => void;
  onSaved: (job: Job) => void;
}

const JobFormModal: React.FC<JobFormModalProps> = ({ job, employers, onClose, onSaved }) => {
  const isEdit = !!job;
  const [form, setForm] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    salaryRange: job?.salaryRange || '',
    type: job?.type || 'Full-time' as 'Full-time' | 'Contract' | 'Seasonal',
    description: job?.description || '',
    category: job?.category || '',
    positions: job?.positions?.toString() || '1',
    deadline: job?.deadline || '',
    employerId: job?.employerId || '',
    contactPerson: job?.contactPerson || '',
    requirements: job?.requirements?.join(', ') || '',
    benefits: new Set<string>(job?.benefits || []),
    demandOrderId: job?.demandOrderId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get demand orders for selected employer
  const [availableDemandOrders, setAvailableDemandOrders] = useState<DemandOrder[]>([]);
  useEffect(() => {
    if (form.employerId) {
      DemandOrderService.getByEmployerId(form.employerId).then(setAvailableDemandOrders);
    } else {
      setAvailableDemandOrders([]);
    }
  }, [form.employerId]);

  const handleDemandOrderSelect = async (doId: string) => {
    if (!doId) {
      setForm(prev => ({ ...prev, demandOrderId: doId }));
      return;
    }

    // Check if we need to await this. Assuming getById is now async or we assume clean refactor.
    // Actually DemandOrderService.getById might be async now.
    const order = await DemandOrderService.getById(doId);

    setForm(prev => {
      const updated = { ...prev, demandOrderId: doId };
      if (order) {
        updated.location = `${order.location}, ${order.country}`;
        updated.salaryRange = order.salaryRange;
        updated.category = order.jobCategory || '';
        updated.positions = order.positionsRequired.toString();
        updated.deadline = order.deadline || '';
        updated.requirements = order.requirements?.join(', ') || '';
        updated.benefits = new Set(order.benefits || []);
      }
      return updated;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Job title is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.salaryRange.trim()) errs.salaryRange = 'Salary range is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Resolve company name from employer if selected
    let company = form.company.trim();
    if (form.employerId) {
      const emp = employers.find(e => e.id === form.employerId);
      if (emp) company = emp.companyName;
    }

    const savedJob: Job = {
      id: job?.id || `job-${Date.now()}`,
      title: form.title.trim(),
      company,
      location: form.location.trim(),
      salaryRange: form.salaryRange.trim(),
      type: form.type as 'Full-time' | 'Contract' | 'Seasonal',
      description: form.description.trim(),
      status: job?.status || JobStatus.OPEN,
      postedDate: job?.postedDate || new Date().toISOString().split('T')[0],
      requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
      matchedCandidateIds: job?.matchedCandidateIds || [],
      employerId: form.employerId || undefined,
      demandOrderId: form.demandOrderId || undefined,
      category: form.category || undefined,
      positions: parseInt(form.positions) || 1,
      filledPositions: job?.filledPositions || 0,
      deadline: form.deadline || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      benefits: Array.from(form.benefits),
    };

    const savePromise = isEdit ? JobService.updateJob(savedJob) : JobService.addJob(savedJob);
    savePromise.then(() => onSaved(savedJob));
  };

  const toggleBenefit = (b: string) => {
    setForm(prev => {
      const next = new Set(prev.benefits);
      if (next.has(b)) next.delete(b); else next.add(b);
      return { ...prev, benefits: next };
    });
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
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{isEdit ? 'Edit Job' : 'Post New Job'}</h3>
              <p className="text-xs text-slate-500">{isEdit ? 'Update job listing details' : 'Create a new job posting'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Job Title *</label>
              <input
                type="text"
                placeholder="e.g., Construction Worker, Hotel Staff"
                className={inputClasses('title')}
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Location *</label>
                <input
                  type="text"
                  placeholder="e.g., Dubai, UAE"
                  className={inputClasses('location')}
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Category</label>
                <select
                  className={inputClasses('category')}
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="">Select category...</option>
                  {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Salary Range *</label>
                <input
                  type="text"
                  placeholder="$1,200 - $1,800/mo"
                  className={inputClasses('salaryRange')}
                  value={form.salaryRange}
                  onChange={e => setForm(p => ({ ...p, salaryRange: e.target.value }))}
                />
                {errors.salaryRange && <p className="text-xs text-red-500 mt-1">{errors.salaryRange}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Type</label>
                <select
                  className={inputClasses('type')}
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Positions</label>
                <input
                  type="number"
                  min={1}
                  className={inputClasses('positions')}
                  value={form.positions}
                  onChange={e => setForm(p => ({ ...p, positions: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Employer</label>
                <select
                  className={inputClasses('employerId')}
                  value={form.employerId}
                  onChange={e => setForm(p => ({ ...p, employerId: e.target.value }))}
                >
                  <option value="">Select employer...</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.companyName} ({emp.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Deadline</label>
                <input
                  type="date"
                  className={inputClasses('deadline')}
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
            </div>

            {/* Demand Order Selector */}
            {form.employerId && availableDemandOrders.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Link2 size={12} className="text-purple-500" /> Link to Demand Order
                </label>
                <select
                  className={inputClasses('demandOrderId')}
                  value={form.demandOrderId}
                  onChange={e => handleDemandOrderSelect(e.target.value)}
                >
                  <option value="">None — standalone job</option>
                  {availableDemandOrders.map(od => (
                    <option key={od.id} value={od.id}>{od.title} ({od.positionsRequired} pos, {od.status})</option>
                  ))}
                </select>
                {form.demandOrderId && (
                  <p className="text-[10px] text-purple-500 mt-1">Fields auto-filled from demand order. You can still edit them.</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Contact Person</label>
              <input
                type="text"
                placeholder="Point of contact for this role"
                className={inputClasses('contactPerson')}
                value={form.contactPerson}
                onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))}
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Description + Requirements */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                placeholder="Describe the role, responsibilities, and working conditions..."
                className={inputClasses('description') + ' resize-none'}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Requirements</label>
              <input
                type="text"
                placeholder="Comma-separated: 3+ years experience, English, Safety cert..."
                className={inputClasses('requirements')}
                value={form.requirements}
                onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              />
              <p className="text-[10px] text-slate-400 mt-1">Separate with commas</p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Benefits */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-3 block">Benefits Package</label>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map(b => {
                const active = form.benefits.has(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenefit(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${active
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-green-200 hover:text-green-600'
                      }`}
                  >
                    {active && <Heart size={10} className="inline mr-1" fill="currentColor" />}
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
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
              {isEdit ? 'Save Changes' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobBoard;