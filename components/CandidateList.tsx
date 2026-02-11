import React, { useState, useEffect } from 'react';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import { NotificationService } from '../services/notificationService';
import { TemplateService } from '../services/templateService';
import { ExcelService } from '../services/excelService';
import { Candidate, WorkflowStage, StageStatus, DocumentType, CandidateDocument, DocumentStatus } from '../types';
import { Search, Filter, MoreHorizontal, Eye, Star, Plus, Save, X, ChevronDown, Check, CheckSquare, Square, Mail, Phone as PhoneIcon, MapPin, Calendar, Clock, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import CandidateForm from './CandidateForm';
import BulkActionsToolbar from './BulkActionsToolbar';
import Skeleton from './ui/Skeleton';

// --- TYPES FOR FILTERS ---
interface FilterState {
  stage: string[];
  role: string[];
  location: string[];
  skills: string[];
  visaStatus: string[];
}

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

const INITIAL_FILTERS: FilterState = {
  stage: [],
  role: [],
  location: [],
  skills: [],
  visaStatus: []
};

// --- MOCK SAVED VIEWS ---
const MOCK_VIEWS: SavedView[] = [
  { id: 'v1', name: 'Ready for Deployment', filters: { ...INITIAL_FILTERS, stage: ['Departure', 'Ticket'] } },
  { id: 'v2', name: 'Urgent Medicals', filters: { ...INITIAL_FILTERS, stage: ['Medical'], visaStatus: ['Pending'] } },
  { id: 'v3', name: 'Electricians - Gulf', filters: { ...INITIAL_FILTERS, role: ['Electrician'], location: ['Dubai', 'Qatar'] } }
];

const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [commentCandidateId, setCommentCandidateId] = useState<string | null>(null);
  const [quickComment, setQuickComment] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>(MOCK_VIEWS);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);


  const [searchParams] = useSearchParams();

  // Initialize filters from URL
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      setFilters(prev => ({ ...prev, stage: [stageParam] }));
    }
  }, [searchParams]);

  // Bulk Actions State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);

  // Quick View Sidebar State
  const [quickViewCandidateId, setQuickViewCandidateId] = useState<string | null>(null);

  // Hover Preview State
  const [hoveredCandidateId, setHoveredCandidateId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleRowMouseEnter = (e: React.MouseEvent, id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverPosition({ x: rect.left + 50, y: rect.bottom });
    setHoveredCandidateId(id);
  };

  const handleRowMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCandidateId(null);
      setHoverPosition(null);
    }, 100);
  };

  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay for smooth UX
    setTimeout(() => {
      setCandidates(CandidateService.getCandidates());
      setIsLoading(false);
    }, 600);
  }, []);

  // --- DASHBOARD ACTIONS ---
  const handleDeleteCandidate = () => {
    if (deleteCandidateId) {
      CandidateService.deleteCandidate(deleteCandidateId);
      setCandidates(CandidateService.getCandidates());
      setDeleteCandidateId(null);
      NotificationService.addNotification({
        type: 'SUCCESS',
        title: 'Candidate Deleted',
        message: 'The candidate record has been permanently removed.'
      });
    }
  };

  const handleAddComment = () => {
    if (commentCandidateId && quickComment.trim()) {
      CandidateService.addComment(commentCandidateId, 'Admin User', quickComment);
      setCandidates(CandidateService.getCandidates());
      setCommentCandidateId(null);
      setQuickComment('');
      NotificationService.addNotification({
        type: 'SUCCESS',
        title: 'Remark Added',
        message: 'Quick remark has been saved to the candidate profile.'
      });
    }
  };

  const handleStageChange = (candidateId: string, newStage: WorkflowStage) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      const updated = { ...candidate, stage: newStage, stageEnteredAt: new Date().toISOString() };
      CandidateService.updateCandidate(updated);
      setCandidates(CandidateService.getCandidates());
      NotificationService.addNotification({
        type: 'SUCCESS',
        title: 'Stage Updated',
        message: `${candidate.name} moved to ${newStage}.`
      });
    }
  };

  // --- BULK OPERATION HANDLERS ---
  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidateIds.length === filteredCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map(c => c.id));
    }
  };

  const handleBulkStageChange = (newStage: WorkflowStage) => {
    selectedCandidateIds.forEach(id => {
      const candidate = candidates.find(c => c.id === id);
      if (candidate) {
        const updated = { ...candidate, stage: newStage, stageEnteredAt: new Date().toISOString() };
        CandidateService.updateCandidate(updated);
      }
    });
    setCandidates(CandidateService.getCandidates());
    NotificationService.addNotification({
      type: 'SUCCESS',
      title: 'Bulk Update Successful',
      message: `${selectedCandidateIds.length} candidates moved to ${newStage}.`
    });
    setSelectedCandidateIds([]);
  };

  const handleBulkAssign = () => {
    // For now, just show a placeholder modal
    setShowBulkAssignModal(true);
    NotificationService.addNotification({
      type: 'INFO',
      title: 'Bulk Assignment',
      message: 'Employer assignment modal coming soon!'
    });
  };

  const handleBulkExport = () => {
    const selectedCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));
    const filename = ExcelService.exportCandidates(selectedCandidates, 'selected_candidates');
    NotificationService.addNotification({
      type: 'SUCCESS',
      title: 'Export Complete',
      message: `${selectedCandidates.length} candidates exported to ${filename}`
    });
  };

  const handleBulkNotify = () => {
    // For now, just show a placeholder
    setShowBulkMessageModal(true);
    NotificationService.addNotification({
      type: 'INFO',
      title: 'Bulk Messaging',
      message: 'Batch notification feature coming soon!'
    });
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds([]);
  };

  // --- FILTER LOGIC ---
  const filteredCandidates = candidates.filter(c => {
    // 1. Text Search
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Advanced Filters
    if (filters.stage.length > 0 && !filters.stage.includes(c.stage)) return false;
    if (filters.role.length > 0 && !filters.role.includes(c.role)) return false;
    if (filters.location.length > 0 && !filters.location.includes(c.location)) return false;
    // For skills, check if candidate has ALL selected skills (strict) or ANY (loose). Using ANY for now.
    if (filters.skills.length > 0 && !c.skills.some(s => filters.skills.includes(s))) return false;
    // Visa status check (mocked lookup in stageData)
    if (filters.visaStatus.length > 0 && !filters.visaStatus.includes(c.stageData?.visaStatus || 'N/A')) return false;

    return true;
  });

  // --- HANDLERS ---
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setActiveViewId(null); // Custom filter active
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setActiveViewId(null);
  };

  const applyView = (view: SavedView) => {
    setFilters(view.filters);
    setActiveViewId(view.id);
    setIsFilterOpen(false); // Close panel on mobile/overlay if needed
  };

  const saveCurrentView = () => {
    const name = prompt('Enter a name for this view:');
    if (name) {
      const newView: SavedView = { id: `v-${Date.now()}`, name, filters };
      setSavedViews([...savedViews, newView]);
      setActiveViewId(newView.id);
      NotificationService.addNotification({ type: 'SUCCESS', title: 'View Saved', message: `Filter view "${name}" saved successfully.` });
    }
  };

  // --- DYNAMIC OPTIONS ---
  const uniqueStages = Array.from(new Set(candidates.map(c => c.stage)));
  const uniqueRoles = Array.from(new Set(candidates.map(c => c.role)));
  const uniqueLocations = Array.from(new Set(candidates.map(c => c.location)));
  const uniqueSkills = Array.from(new Set(candidates.flatMap(c => c.skills)));
  const uniqueVisaStatuses = ['Pending', 'Submitted', 'Approved', 'Rejected'];

  const handleAddCandidate = (formData: any) => {
    let docs = TemplateService.getRequiredDocumentsForCountry(formData.targetCountry);

    // Update photo statuses if provided from form
    if (formData.passportPhotosStatus || formData.fullPhotoStatus) {
      docs = docs.map(d => {
        if (d.type === DocumentType.PASSPORT_PHOTOS && formData.passportPhotosStatus) {
          return { ...d, status: formData.passportPhotosStatus };
        }
        if (d.type === DocumentType.FULL_PHOTO && formData.fullPhotoStatus) {
          return { ...d, status: formData.fullPhotoStatus };
        }
        return d;
      });
    }

    const newCandidate: Candidate = {
      id: `new-${Date.now()}`,
      ...formData,
      stage: WorkflowStage.REGISTRATION,
      stageStatus: StageStatus.PENDING,
      stageEnteredAt: new Date().toISOString(),
      stageData: {},
      workflowLogs: [],
      comments: [],
      timelineEvents: [{
        id: `evt-${Date.now()}`,
        type: 'SYSTEM',
        title: 'Profile Created',
        description: 'Candidate registered in system.',
        timestamp: new Date().toISOString(),
        actor: 'Admin User',
        stage: WorkflowStage.REGISTRATION
      }],
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
      documents: docs
    };

    CandidateService.addCandidate(newCandidate);
    setCandidates(CandidateService.getCandidates());
    setIsAddModalOpen(false);

    NotificationService.addNotification({
      type: 'SUCCESS',
      title: 'New Candidate Registered',
      message: `${newCandidate.name} has been added to the system under ${newCandidate.role}.`,
      link: `/candidates/${newCandidate.id}`,
      candidateId: newCandidate.id
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case WorkflowStage.REGISTRATION: return 'bg-blue-100 text-blue-700';
      case WorkflowStage.VERIFICATION: return 'bg-purple-100 text-purple-700';
      case WorkflowStage.APPLIED: return 'bg-yellow-100 text-yellow-700';
      case WorkflowStage.OFFER_RECEIVED: return 'bg-orange-100 text-orange-700';
      case WorkflowStage.WP_RECEIVED: return 'bg-pink-100 text-pink-700';
      case WorkflowStage.EMBASSY_APPLIED: return 'bg-indigo-100 text-indigo-700';
      case WorkflowStage.VISA_RECEIVED: return 'bg-violet-100 text-violet-700';
      case WorkflowStage.SLBFE_REGISTRATION: return 'bg-teal-100 text-teal-700';
      case WorkflowStage.TICKET: return 'bg-sky-100 text-sky-700';
      case WorkflowStage.DEPARTURE: return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidates</h2>
          <p className="text-slate-500">Manage and track candidate applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 text-sm font-medium transition-all"
          >
            <Plus size={18} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* FILTERS SIDEBAR */}
        <div className={`w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col shrink-0 ${isFilterOpen ? 'fixed inset-y-0 left-0 z-50 p-4 md:relative md:inset-auto md:p-0' : 'hidden md:flex'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" /> Filters
            </h3>
            {(Object.values(filters).some(f => f.length > 0) || searchQuery) && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">Clear All</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* SAVED VIEWS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Views</h4>
              </div>
              <div className="space-y-1">
                {savedViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => applyView(view)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between group transition-colors ${activeViewId === view.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{view.name}</span>
                    {activeViewId === view.id && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
                <button onClick={saveCurrentView} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2 mt-2 border border-dashed border-blue-200">
                  <Save size={14} /> Save Current View
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* DYNAMIC FILTERS */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Stage</h4>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.REGISTRATION)} onChange={() => toggleFilter('stage', WorkflowStage.REGISTRATION)} /> Registered
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.VERIFICATION)} onChange={() => toggleFilter('stage', WorkflowStage.VERIFICATION)} /> Verified
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.APPLIED)} onChange={() => toggleFilter('stage', WorkflowStage.APPLIED)} /> Applied
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.OFFER_RECEIVED)} onChange={() => toggleFilter('stage', WorkflowStage.OFFER_RECEIVED)} /> Offer Received
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.WP_RECEIVED)} onChange={() => toggleFilter('stage', WorkflowStage.WP_RECEIVED)} /> WP Received
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.EMBASSY_APPLIED)} onChange={() => toggleFilter('stage', WorkflowStage.EMBASSY_APPLIED)} /> Embassy Applied
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.VISA_RECEIVED)} onChange={() => toggleFilter('stage', WorkflowStage.VISA_RECEIVED)} /> Visa Received
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.stage.includes(WorkflowStage.SLBFE_REGISTRATION)} onChange={() => toggleFilter('stage', WorkflowStage.SLBFE_REGISTRATION)} /> SLBFE
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Role</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {uniqueRoles.map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input type="checkbox" checked={filters.role.includes(role)} onChange={() => toggleFilter('role', role)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Visa Status</h4>
                <div className="space-y-1">
                  {uniqueVisaStatuses.map(status => (
                    <label key={status} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input type="checkbox" checked={filters.visaStatus.includes(status)} onChange={() => toggleFilter('visaStatus', status)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Location</h4>
                <div className="space-y-1">
                  {uniqueLocations.map(loc => (
                    <label key={loc} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                      <input type="checkbox" checked={filters.location.includes(loc)} onChange={() => toggleFilter('location', loc)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      {loc}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN LIST */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Table Controls */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
              <Filter size={20} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search candidates, roles, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
              {filteredCandidates.length} Results
            </div>
          </div>

          {/* Quick Filters */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Quick Filters:</span>
            <button className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold whitespace-nowrap">All Candidates</button>
            <button className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-bold hover:border-blue-300 transition-colors whitespace-nowrap">Ready to Deploy</button>
            <button className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-bold hover:border-blue-300 transition-colors whitespace-nowrap">Documents Missing</button>
            <button className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-bold hover:border-blue-300 transition-colors whitespace-nowrap">Stuck {'>'} 7 Days</button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <tr className="text-slate-500 text-xs uppercase font-semibold">
                  <th className="px-6 py-4 w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-5 h-5 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0 ?
                        <CheckSquare size={18} className="text-blue-600" /> :
                        <Square size={18} />
                      }
                    </button>
                  </th>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Latest Remark</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><Skeleton className="h-5 w-5 rounded" /></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-11 h-11 rounded-xl" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-8 w-full rounded-full" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className={`hover:bg-blue-50/20 transition-all group border-b border-slate-50 last:border-none cursor-pointer ${quickViewCandidateId === candidate.id ? 'bg-blue-50/40 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => setQuickViewCandidateId(candidate.id)}
                      onMouseEnter={(e) => handleRowMouseEnter(e, candidate.id)}
                      onMouseLeave={handleRowMouseLeave}
                    >
                      <td className="px-6 py-4 w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCandidate(candidate.id);
                          }}
                          className="flex items-center justify-center w-5 h-5 text-slate-300 hover:text-blue-600 transition-colors"
                        >
                          {selectedCandidateIds.includes(candidate.id) ? (
                            <div className="bg-blue-600 rounded text-white p-0.5">
                              <CheckSquare size={14} />
                            </div>
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative group/avatar">
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.name}
                              className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm transition-transform group-hover/avatar:scale-105"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Link to={`/candidates/${candidate.id}`} className="font-extrabold text-slate-800 text-sm hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {candidate.name}
                              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" />
                            </Link>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1"><PhoneIcon size={10} /> {candidate.phone}</span>
                              <span className="flex items-center gap-1"><Mail size={10} /> {candidate.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wide inline-flex items-center gap-1.5">
                          <Briefcase size={10} className="text-slate-400" />
                          {candidate.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <div className="flex items-center justify-between">
                            <select
                              value={candidate.stage}
                              onChange={(e) => handleStageChange(candidate.id, e.target.value as WorkflowStage)}
                              className={`text-[10px] font-black py-1 px-3 rounded-full border-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none shadow-sm ${getStageColor(candidate.stage)}`}
                            >
                              {Object.values(WorkflowStage).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <span className="text-[9px] font-bold text-slate-400">{Math.floor(Math.random() * 100)}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col max-w-[200px]">
                          <p className="text-[11px] font-medium text-slate-600 line-clamp-1 italic">
                            "{candidate.comments && candidate.comments.length > 0
                              ? candidate.comments[candidate.comments.length - 1].text
                              : 'Initial registration processed...'}"
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 leading-none">
                            <Clock size={8} />
                            {candidate.stageEnteredAt ? new Date(candidate.stageEnteredAt).toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => setCommentCandidateId(candidate.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Add Remark"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => setDeleteCandidateId(candidate.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 bg-slate-50/50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <Search size={32} className="text-slate-300" />
                        </div>
                        <p className="font-semibold text-slate-600">No candidates found</p>
                        <p className="text-sm max-w-xs mx-auto">Try adjusting your filters or search query to see more results.</p>
                        <button onClick={clearFilters} className="text-blue-600 hover:text-blue-700 text-sm font-bold mt-2 hover:underline">Clear all filters</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Mock - Simplified */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
            <span>Showing {filteredCandidates.length} results</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white">Next</button>
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <CandidateForm
          title="Create New Candidate"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddCandidate}
        />
      )}

      {/* HOVER PREVIEW CARD */}
      {hoveredCandidateId && hoverPosition && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ top: hoverPosition.y + 10, left: hoverPosition.x }}
        >
          {(() => {
            const c = candidates.find(cand => cand.id === hoveredCandidateId);
            if (!c) return null;
            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img src={c.avatarUrl} className="w-10 h-10 rounded-full border border-slate-100" alt="" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-bold">Status</span>
                    <span className="font-semibold text-slate-700">{c.stage}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-bold">Docs</span>
                    <span className="font-semibold text-green-600">
                      {c.documents.filter(d => d.status === DocumentStatus.APPROVED).length}/{c.documents.length} Approved
                    </span>
                  </div>
                </div>

                {c.comments && c.comments.length > 0 && (
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-800 font-medium italic line-clamp-2">
                      "{c.comments[c.comments.length - 1].text}"
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* QUICK REMARK MODAL */}
      {commentCandidateId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MoreHorizontal className="text-blue-600" /> Add Quick Remark
            </h3>
            <textarea
              autoFocus
              className="w-full h-32 text-sm border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Type your notes here..."
              value={quickComment}
              onChange={(e) => setQuickComment(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCommentCandidateId(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleAddComment} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Remark</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Candidate?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone. All candidate history and documents will be lost.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteCandidateId(null)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Keep Record</button>
              <button
                onClick={handleDeleteCandidate}
                className="flex-1 px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-lg shadow-red-200"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTIONS TOOLBAR */}
      <BulkActionsToolbar
        selectedCount={selectedCandidateIds.length}
        onClearSelection={handleClearSelection}
        onBulkStageChange={handleBulkStageChange}
        onBulkAssign={handleBulkAssign}
        onBulkExport={handleBulkExport}
        onBulkNotify={handleBulkNotify}
      />

      {/* QUICK VIEW SIDEBAR */}
      {quickViewCandidateId && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-[70] border-l border-slate-200 animate-in slide-in-from-right duration-300">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <img
                  src={candidates.find(c => c.id === quickViewCandidateId)?.avatarUrl}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                  alt=""
                />
                <div>
                  <h3 className="font-extrabold text-slate-800">{candidates.find(c => c.id === quickViewCandidateId)?.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{candidates.find(c => c.id === quickViewCandidateId)?.role}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickViewCandidateId(null);
                }}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stage Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-bold text-slate-700">{candidates.find(c => c.id === quickViewCandidateId)?.stageStatus}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Days in Stage</span>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-700">4 Days</span>
                  </div>
                </div>
              </div>

              {/* Action Tabs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={14} className="text-blue-500" />
                  Quick Actions
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <button className="w-full p-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Save size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Update Stage Data</p>
                        <p className="text-[10px] text-slate-400">Add medical or police clearance info</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                  <button className="w-full p-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Plus size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Add Quick Remark</p>
                        <p className="text-[10px] text-slate-400">Internal note for the team</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-slate-300 group-hover:text-indigo-500" />
                  </button>
                </div>
              </div>

              {/* Document Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Save size={14} className="text-green-500" />
                    Compliance & Docs
                  </h4>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">80% Ready</span>
                </div>
                <div className="space-y-2">
                  {candidates.find(c => c.id === quickViewCandidateId)?.documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-xs font-bold text-slate-700">{doc.type}</p>
                      </div>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">View</span>
                    </div>
                  ))}
                  <button className="w-full py-2 text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors">
                    View All {candidates.find(c => c.id === quickViewCandidateId)?.documents.length} Documents
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <Link
                to={`/candidates/${quickViewCandidateId}`}
                className="flex-1 bg-blue-600 text-white font-extrabold py-3 rounded-2xl text-center text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                Go to Full Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateList;