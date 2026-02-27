import React, { useState, useEffect } from 'react';
import { useCandidates } from '../context/CandidateContext';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { JobService } from '../services/jobService';
import { PartnerService } from '../services/partnerService';
import {
  Candidate,
  WorkflowStage,
  CandidateDocument,
  PassportData,
  PCCData,
  TimelineEvent,
  TimelineEventType,
  PassportStatus,
  Job,
  Employer
} from '../types';
import {
  User,
  FileText,
  History,
  Bot,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  CheckCircle,
  X,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  Phone,
  Award,
  Clock,
  RefreshCw,
  Save,
  Printer,
  ChevronRight,
  ArrowLeft,
  Settings,
  Download,
  Terminal,
  AlertTriangle
} from 'lucide-react';

// Components
import CandidateHero from './CandidateHero';
import TabNavigation, { Tab } from './TabNavigation';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import ComplianceWidget from './ComplianceWidget';
import WorkflowProgressWidget from './widgets/WorkflowProgressWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import SLBFEStatusWidget from './widgets/SLBFEStatusWidget';

import MultiPhoneInput from './ui/MultiPhoneInput';
import MultiEducationSelector from './ui/MultiEducationSelector';
import MedicalStatusInput from './ui/MedicalStatusInput';
import JobRoleEntry from './JobRoleEntry';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import EmploymentHistoryEntry from './ui/EmploymentHistoryEntry';
import CandidateReport from './CandidateReport';
import DocumentManager from './DocumentManager';
import TimelineView from './TimelineView';

// Services
import { ComplianceService } from '../services/complianceService';
import { ProfileCompletionService } from '../services/profileCompletionService';
import WorkflowEngine, { WORKFLOW_STAGES } from '../services/workflowEngine';
import { DataSyncService } from '../services/dataSyncService';



const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Use global state
  const { candidates, updateCandidateInState, removeCandidateFromState, refreshCandidates } = useCandidates();
  const { user } = useAuth();

  // Derive candidate from global state
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isExportingReport, setIsExportingReport] = useState(false);

  useEffect(() => {
    const loadCandidate = async () => {
      if (!id) return;

      setIsLocalLoading(true);
      setFetchError(null);

      try {
        // First try to find in context if available
        if (candidates.length > 0) {
          const found = candidates.find(c => c.id === id);
          if (found) {
            setCandidate(found);
            setIsLocalLoading(false);
            return;
          }
        }

        // If not found in context or context is empty, fetch directly from service
        const directCandidate = await CandidateService.getCandidate(id);
        if (directCandidate) {
          setCandidate(directCandidate);
        } else {
          setFetchError('Personnel records not found for this identifier.');
        }
      } catch (err) {
        console.error('Error in direct candidate fetch:', err);
        setFetchError('Failed to establish connection to workforce registry.');
      } finally {
        setIsLocalLoading(false);
      }
    };

    loadCandidate();
  }, [id, candidates]);

  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'timeline' | 'audit'>('profile');

  // Handles profile fields editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Candidate>>({});

  // Matched Jobs & Employers State
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [employersMap, setEmployersMap] = useState<Record<string, Employer>>({});

  useEffect(() => {
    const loadLinkedData = async () => {
      if (!candidate) return;
      try {
        const allJobs = await JobService.getJobs();
        const allEmployers = await PartnerService.getEmployers();

        const matches = allJobs.filter(j => j.matchedCandidateIds?.includes(candidate.id));
        setMatchedJobs(matches);

        const map: Record<string, Employer> = {};
        allEmployers.forEach(e => { map[e.id] = e; });
        setEmployersMap(map);
      } catch (error) {
        console.error("Error loading linked data", error);
      }
    };
    loadLinkedData();
  }, [candidate]);

  const startEditing = () => {
    if (!candidate) return;

    // Ensure data is synchronized before editing
    const syncedCandidate = DataSyncService.fullSync(candidate);

    setEditedProfile(syncedCandidate);
    setIsEditingProfile(true);
  };
  const saveProfile = async () => {
    if (!candidate || !editedProfile) return;

    try {
      // Use DataSyncService to ensure bidirectional parity
      const updatedCandidate = DataSyncService.fullSync({
        ...candidate,
        ...editedProfile,
        // Special handling for slbfeData specific to this component's logic
        slbfeData: {
          biometricStatus: 'Pending',
          medicalStatus: 'Pending',
          ...(candidate.slbfeData || {}),
          ...(editedProfile.slbfeData || {})
        } as any,
        // Ensure complex arrays are preserved if missing in editedProfile
        advancePayments: (editedProfile as any).advancePayments || candidate.advancePayments || [],
        workflowMilestones: {
          ...(candidate.workflowMilestones || {}),
          ...((editedProfile as any).workflowMilestones || {}),
        },
        remarkLog: (editedProfile as any).remarkLog || (candidate as any).remarkLog || [],
      });

      // Recalculate completion
      const finalCandidate = ProfileCompletionService.updateCompletionData(updatedCandidate);

      await CandidateService.updateCandidate(finalCandidate);

      updateCandidateInState(finalCandidate);
      setCandidate(finalCandidate);
      setIsEditingProfile(false);

      await CandidateService.addTimelineEvent(candidate.id, {
        type: 'SYSTEM',
        title: 'Profile Updated',
        description: 'Candidate profile information was updated',
        actor: user?.name || 'Internal Staff',
        userId: user?.id
      });
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  };

  // Handle compliance update
  const handleComplianceUpdate = async (data: {
    passport: Partial<PassportData>;
    pcc: Partial<PCCData>
  }) => {
    if (!candidate) return;

    let updatedCandidate = { ...candidate };

    // Process Passport
    if (data.passport.passportNumber) {
      const passportData = ComplianceService.evaluatePassport(
        data.passport.expiryDate || '',
        data.passport.passportNumber || '',
        data.passport.country || '',
        data.passport.issuedDate || ''
      );
      updatedCandidate.passportData = passportData;
    }

    // Process PCC
    if (data.pcc.issuedDate) {
      const pccData = ComplianceService.evaluatePCC(
        data.pcc.issuedDate || '',
        data.pcc.lastInspectionDate || ''
      );
      updatedCandidate.pccData = pccData;
    }

    // Recalculate profile completion
    updatedCandidate = ProfileCompletionService.updateCompletionData(updatedCandidate);

    updateCandidateInState(updatedCandidate);
    setCandidate(updatedCandidate);

    try {
      await CandidateService.updateCandidate(updatedCandidate);
      await CandidateService.addTimelineEvent(candidate.id, {
        type: 'SYSTEM',
        title: 'Compliance Data Updated',
        description: 'Passport and PCC information has been updated',
        actor: user?.name || 'Internal Staff',
        userId: user?.id
      });
    } catch (err) {
      console.error('Failed to update compliance data', err);
    }
  };

  // Handle document update
  const handleDocumentUpdate = async (updatedDocs: CandidateDocument[]) => {
    if (!candidate) return;

    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'DOCUMENT',
      title: 'Documents Updated',
      description: 'Candidate documents have been modified',
      actor: user?.name || 'Internal Staff',
      userId: user?.id,
      stage: candidate.stage
    };

    const updatedCandidate: Candidate = {
      ...candidate,
      documents: updatedDocs,
      timelineEvents: [newEvent, ...(candidate.timelineEvents || [])]
    };

    updateCandidateInState(updatedCandidate);
    setCandidate(updatedCandidate);

    try {
      await CandidateService.updateCandidate(updatedCandidate);
    } catch (err) {
      console.error('Failed to update documents', err);
    }
  };

  // Strict Workflow Actions
  // Strict Workflow Actions
  const handleAdvanceStage = async () => {
    if (!candidate) return;

    const nextStage = WorkflowEngine.getNextStage(candidate.stage);
    if (!nextStage) return;

    // Use WorkflowEngine to perform transition logic
    const transitionResult = await WorkflowEngine.performTransition(candidate, nextStage, user?.name || 'System Admin');

    if (transitionResult.success) {
      const updatedCandidate = { ...candidate, stage: nextStage };

      // Update Backend
      await CandidateService.updateCandidate(updatedCandidate);

      // Update Context
      updateCandidateInState(updatedCandidate);

      // Update Local State
      setCandidate(updatedCandidate);

      // Log Event
      await CandidateService.addTimelineEvent(candidate.id, {
        type: 'WORKFLOW',
        title: `Advanced to ${nextStage}`,
        description: `Candidate advanced from ${candidate.stage} to ${nextStage}`,
        actor: user?.name || 'Internal Staff',
        userId: user?.id
      });

    } else {
      alert(`Cannot advance stage: ${transitionResult.error}`);
    }
  };

  const handleRollback = async (targetStage: WorkflowStage, reason: string) => {
    if (!candidate) return;

    // Direct rollback logic since WorkflowEngine.performTransition checks strictly for forward movement or specific rules
    // For rollback, we generally allow it with a reason, but we should validate if needed.
    // Assuming implicit allow for admin overrides or generic rollbacks for now.

    // Check if target stage is valid? 
    // Simplified: Just update.

    const updatedCandidate = { ...candidate, stage: targetStage };

    await CandidateService.updateCandidate(updatedCandidate);
    updateCandidateInState(updatedCandidate);
    setCandidate(updatedCandidate);

    await CandidateService.addTimelineEvent(candidate.id, {
      type: 'WORKFLOW',
      title: `Rolled back to ${targetStage}`,
      description: `Rollback Reason: ${reason}`,
      actor: user?.name || 'Internal Staff',
      userId: user?.id
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!candidate) return;

    const policy = WorkflowEngine.canPerformAction(candidate, 'DELETE');
    if (!policy.allowed) {
      alert(`Policy Block: ${policy.reason}`);
      return;
    }

    if (confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      await CandidateService.deleteCandidate(candidate.id);
      removeCandidateFromState(candidate.id);
      if (candidate) {
        await CandidateService.addTimelineEvent(candidate.id, {
          type: 'STATUS_CHANGE',
          title: 'Candidate Profile Deleted',
          description: `Profile permanently removed from system`,
          actor: user?.name || 'System Admin',
          userId: user?.id
        });
      }
      navigate('/candidates');
    }
  };

  const handleGenerateReport = async () => {
    if (!candidate) return;

    setIsExportingReport(true);
    try {
      // Dynamically import react-pdf components
      const { pdf } = await import('@react-pdf/renderer');
      const { CandidateReportPDF } = await import('../src/components/reports/CandidateReportPDF');

      // Generate system report first for strategic assessment and risk scoring
      const { ReportService } = await import('../services/reportService');
      const systemReport = await ReportService.generateReport(candidate);

      const blob = await pdf(
        <CandidateReportPDF
          candidate={candidate}
          reportId={`REP-${Date.now()}`}
          generatedBy={user?.name || 'Internal Staff'}
          systemReport={systemReport}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Candidate_Audit_Report_${candidate.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      CandidateService.addTimelineEvent(candidate.id, {
        type: 'SYSTEM',
        title: 'Report Generated',
        description: 'Candidate Strategic Assessment Report was generated',
        actor: user?.name || 'Internal Staff',
        userId: user?.id
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsExportingReport(false);
    }
  };

  // Define tabs
  const tabs: Tab[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText, count: candidate?.documents?.length || 0 },
    { id: 'timeline', label: 'Timeline', icon: History, count: candidate?.timelineEvents?.length || 0 },
    { id: 'audit', label: 'System Audit', icon: ShieldCheck }
  ];

  // Loading state
  if (isLocalLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-lg shadow-blue-50/50">
            <RefreshCw size={32} className="animate-spin" />
          </div>
          <p className="text-slate-800 font-bold text-lg mb-1 tracking-tight">Syncing Workforce Data</p>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Enterprise Registry Integration</p>
        </div>
      </div>
    );
  }

  // Error/Not Found state
  if (fetchError || !candidate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-10 text-center relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-amber-400" />

          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-8">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Alert</h2>
          <p className="text-slate-500 mb-8 font-medium">
            {fetchError || "The personnel record you are attempting to access is either restricted or does not exist in the current registry."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/candidates')}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              Back to Candidates
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Retry Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <CandidateHero candidate={candidate} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} tabs={tabs} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6" id="main-content-tabs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
                  {!isEditingProfile ? (
                    <button
                      onClick={startEditing}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {/* === REG NO BADGE — PRIMARY IDENTIFIER (Red ink on paper forms) === */}
                <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-md shadow-sm">REG NO</div>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editedProfile.regNo || candidate.regNo || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, regNo: e.target.value })}
                        placeholder="e.g. SPA 19-260225"
                        className="text-2xl font-black text-red-700 bg-white border-2 border-red-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-red-500 outline-none tracking-wide"
                        style={{ minWidth: '220px' }}
                      />
                    ) : (
                      <span className="text-2xl font-black text-red-700 tracking-wide">{candidate.regNo || candidate.candidateCode || '-'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div>
                      <span className="font-bold uppercase">Reg Date: </span>
                      {isEditingProfile ? (
                        <input
                          type="date"
                          value={editedProfile.regDate ? editedProfile.regDate.split('T')[0] : candidate.regDate ? candidate.regDate.split('T')[0] : ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, regDate: e.target.value })}
                          className="text-sm border border-slate-300 rounded px-2 py-0.5 ml-1"
                        />
                      ) : (
                        <span className="font-medium text-slate-700 ml-1">{candidate.regDate ? new Date(candidate.regDate).toLocaleDateString() : '-'}</span>
                      )}
                    </div>
                    {isEditingProfile ? (
                      <div className="flex flex-wrap gap-3">
                        <div>
                          <span className="font-bold uppercase">Agent: </span>
                          <input type="text" value={editedProfile.foreignAgent || candidate.foreignAgent || ''} onChange={(e) => setEditedProfile({ ...editedProfile, foreignAgent: e.target.value })} placeholder="Foreign Agent" className="text-sm border border-slate-300 rounded px-2 py-0.5 ml-1 w-28" />
                        </div>
                        <div>
                          <span className="font-bold uppercase">Coordinator: </span>
                          <input type="text" value={editedProfile.coordinatorName || candidate.coordinatorName || ''} onChange={(e) => setEditedProfile({ ...editedProfile, coordinatorName: e.target.value })} placeholder="Name" className="text-sm border border-slate-300 rounded px-2 py-0.5 ml-1 w-28" />
                        </div>
                        <div>
                          <span className="font-bold uppercase">Company: </span>
                          <input type="text" value={(editedProfile as any).companyName || (candidate as any).companyName || ''} onChange={(e) => setEditedProfile({ ...editedProfile, companyName: e.target.value } as any)} placeholder="Company" className="text-sm border border-slate-300 rounded px-2 py-0.5 ml-1 w-28" />
                        </div>
                        <div>
                          <span className="font-bold uppercase">D/H Officer: </span>
                          <input type="text" value={editedProfile.dhOfficer || candidate.dhOfficer || ''} onChange={(e) => setEditedProfile({ ...editedProfile, dhOfficer: e.target.value })} placeholder="Officer" className="text-sm border border-slate-300 rounded px-2 py-0.5 ml-1 w-28" />
                        </div>
                      </div>
                    ) : (
                      <>
                        {candidate.foreignAgent && <div><span className="font-bold uppercase">Agent: </span><span className="font-medium text-slate-700">{candidate.foreignAgent}</span></div>}
                        {candidate.coordinatorName && <div><span className="font-bold uppercase">Coordinator: </span><span className="font-medium text-slate-700">{candidate.coordinatorName}</span></div>}
                        {(candidate as any).companyName && <div><span className="font-bold uppercase">Company: </span><span className="font-medium text-slate-700">{(candidate as any).companyName}</span></div>}
                        {candidate.dhOfficer && <div><span className="font-bold uppercase">D/H Officer: </span><span className="font-medium text-slate-700">{candidate.dhOfficer}</span></div>}
                      </>
                    )}
                  </div>
                </div>

                {/* SECTION 1.1: PASSPORT DATA (Sri Lankan Passport Bio Page Structure) */}
                <section>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-500" />
                    Passport Data
                  </h3>

                  {isEditingProfile ? (
                    <div className="bg-gradient-to-br from-amber-50/40 to-slate-50 p-5 rounded-xl border border-amber-200/80 space-y-4">
                      {/* Row 1: Type, Country Code, Passport No */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Type</label>
                          <input type="text" value="PB" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Country Code</label>
                          <input type="text" value="LKA" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Passport No.</label>
                          <input
                            type="text"
                            value={(editedProfile.passports || [])[0]?.passportNumber || ''}
                            onChange={(e) => {
                              const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                              passports[0] = { ...passports[0], passportNumber: e.target.value.toUpperCase() };
                              setEditedProfile({ ...editedProfile, passports });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                            placeholder="e.g. N11296133"
                          />
                        </div>
                      </div>

                      {/* Row 2: Surname */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Surname</label>
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.surname || editedProfile.personalInfo?.firstName || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, surname: e.target.value.toUpperCase(), firstName: e.target.value.toUpperCase() }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                          placeholder="e.g. BOGAHAWATHTHA"
                        />
                      </div>

                      {/* Row 3: Other Names */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Other Names</label>
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.otherNames || editedProfile.personalInfo?.middleName || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, otherNames: e.target.value.toUpperCase(), middleName: e.target.value.toUpperCase(), fullName: e.target.value.toUpperCase() }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                          placeholder="e.g. LAHIRU SHIWANTHA SRI"
                        />
                      </div>

                      {/* Row 4: National Status + Profession */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">National Status</label>
                          <input type="text" value="SRI LANKAN" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Profession</label>
                          <input
                            type="text"
                            value={(editedProfile as any).passportProfession || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, passportProfession: e.target.value } as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="As per passport"
                          />
                        </div>
                      </div>

                      {/* Row 5: DOB + ID No. */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Date of Birth</label>
                          <input
                            type="date"
                            value={editedProfile.personalInfo?.dob || ''}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              personalInfo: { ...editedProfile.personalInfo!, dob: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">ID No. (NIC)</label>
                          <input
                            type="text"
                            value={editedProfile.personalInfo?.nic || ''}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              personalInfo: { ...editedProfile.personalInfo!, nic: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                            placeholder="e.g. 840631346V"
                          />
                        </div>
                      </div>

                      {/* Row 6: Sex + Place of Birth */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Sex</label>
                          <select
                            value={editedProfile.personalInfo?.gender || ''}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              personalInfo: { ...editedProfile.personalInfo!, gender: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Place of Birth</label>
                          <input
                            type="text"
                            value={(editedProfile as any).placeOfBirth || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, placeOfBirth: e.target.value.toUpperCase() } as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase"
                            placeholder="e.g. POLONNARUWA"
                          />
                        </div>
                      </div>

                      {/* Row 7: Date of Issue + Date of Expiry */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Date of Issue</label>
                          <input
                            type="date"
                            value={(editedProfile.passports || [])[0]?.issuedDate ? new Date((editedProfile.passports || [])[0].issuedDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                              passports[0] = { ...passports[0], issuedDate: e.target.value };
                              setEditedProfile({ ...editedProfile, passports });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Date of Expiry</label>
                          <input
                            type="date"
                            value={(editedProfile.passports || [])[0]?.expiryDate ? new Date((editedProfile.passports || [])[0].expiryDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const passports = [...(editedProfile.passports || [{ passportNumber: '', country: 'Sri Lanka', issuedDate: '', expiryDate: '', status: PassportStatus.VALID, validityDays: 0 }])];
                              const evaluation = ComplianceService.evaluatePassport(e.target.value, passports[0].passportNumber, passports[0].country, passports[0].issuedDate);
                              passports[0] = { ...passports[0], expiryDate: e.target.value, status: evaluation.status, validityDays: evaluation.validityDays };
                              setEditedProfile({ ...editedProfile, passports });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 8: Authority */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Authority</label>
                        <input type="text" value="AUTHORITY COLOMBO" disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500" />
                      </div>

                      {/* Row 9: Passport Remark */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Passport Remark</label>
                        <textarea
                          value={(editedProfile as any).passportRemark || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, passportRemark: e.target.value } as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="e.g. unmarried, no foreign job experience, govt register no..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(candidate.passports && candidate.passports.length > 0) ? (
                        candidate.passports.map((passport, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-amber-50/30 to-slate-50/80 rounded-xl border border-amber-200/60 overflow-hidden shadow-sm">
                            {/* Passport Header */}
                            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-5 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-amber-300 text-lg">🇱🇰</div>
                                <div>
                                  <div className="text-[9px] text-blue-200 uppercase tracking-widest">Democratic Socialist Republic of</div>
                                  <div className="text-xs font-bold text-white tracking-wide">SRI LANKA</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-blue-200 uppercase">Passport No.</div>
                                <div className="text-sm font-bold text-amber-300 font-mono tracking-wider">{passport.passportNumber || '-'}</div>
                              </div>
                            </div>

                            {/* Passport Body */}
                            <div className="px-5 py-4 space-y-3">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Type</label>
                                  <div className="text-sm font-bold text-slate-800 font-mono">PB</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Country Code</label>
                                  <div className="text-sm font-bold text-slate-800 font-mono">LKA</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Passport No.</label>
                                  <div className="text-sm font-bold text-slate-900 font-mono">{passport.passportNumber || '-'}</div>
                                </div>
                              </div>

                              <div className="pt-1 border-t border-amber-100">
                                <label className="text-[9px] font-medium text-slate-400 uppercase">Surname</label>
                                <div className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                                  {candidate?.personalInfo?.surname || candidate?.personalInfo?.firstName || candidate?.firstName || '-'}
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] font-medium text-slate-400 uppercase">Other Names</label>
                                <div className="text-base font-bold text-slate-800 uppercase">
                                  {candidate?.personalInfo?.otherNames || candidate?.personalInfo?.middleName || candidate?.middleName || '-'}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-amber-100">
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">National Status</label>
                                  <div className="text-sm font-bold text-slate-800">SRI LANKAN</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Profession</label>
                                  <div className="text-sm font-medium text-slate-700">{(candidate as any)?.passportProfession || '-'}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Date of Birth</label>
                                  <div className="text-sm font-bold text-slate-800">{candidate?.personalInfo?.dob || candidate?.dob || '-'}</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">ID No.</label>
                                  <div className="text-sm font-bold text-slate-800 font-mono">{candidate?.personalInfo?.nic || candidate?.nic || '-'}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Sex</label>
                                  <div className="text-sm font-bold text-slate-800">{candidate?.personalInfo?.gender || candidate?.gender || '-'}</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Place of Birth</label>
                                  <div className="text-sm font-bold text-slate-800 uppercase">{(candidate as any)?.placeOfBirth || '-'}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-amber-100">
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Date of Issue</label>
                                  <div className="text-sm font-medium text-slate-800">{passport.issuedDate || '-'}</div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Date of Expiry</label>
                                  <div className="text-sm font-medium text-slate-800 mb-1">{passport.expiryDate || '-'}</div>
                                  {passport.expiryDate && (
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${passport.status === PassportStatus.VALID ? 'bg-green-50 text-green-700 border-green-200' :
                                      passport.status === PassportStatus.EXPIRING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                      }`}>
                                      {passport.status === PassportStatus.VALID ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                      {passport.status} • {passport.validityDays} Days Left
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-1 border-t border-amber-100">
                                <label className="text-[9px] font-medium text-slate-400 uppercase">Authority</label>
                                <div className="text-sm font-medium text-slate-600">AUTHORITY COLOMBO</div>
                              </div>

                              {(candidate as any)?.passportRemark && (
                                <div className="pt-1 border-t border-amber-100">
                                  <label className="text-[9px] font-medium text-slate-400 uppercase">Remark</label>
                                  <div className="text-xs text-slate-600 italic leading-relaxed">{(candidate as any).passportRemark}</div>
                                </div>
                              )}
                            </div>

                            {/* MRZ Zone */}
                            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 font-mono text-[11px] tracking-[0.15em] text-slate-500 leading-relaxed overflow-x-auto">
                              <div>PB{passport.country === 'Sri Lanka' ? 'LKA' : ''}{(candidate?.personalInfo?.surname || candidate?.personalInfo?.firstName || '').replace(/\s/g, '')}&lt;&lt;{(candidate?.personalInfo?.otherNames || candidate?.personalInfo?.middleName || '').replace(/\s/g, '&lt;')}&lt;&lt;&lt;&lt;</div>
                              <div>{passport.passportNumber || '?????????'}LKA{(candidate?.personalInfo?.dob || '').replace(/-/g, '').slice(2)}{candidate?.personalInfo?.gender || '?'}{(passport.expiryDate || '').replace(/-/g, '').slice(2)}{(candidate?.personalInfo?.nic || '').replace(/[^0-9V]/gi, '')}&lt;&lt;&lt;&lt;</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 bg-slate-50 rounded-lg text-sm text-slate-500 italic text-center border border-slate-200 border-dashed">
                          No passport data available — Click "Edit Profile" to add passport details
                        </div>
                      )}
                    </div>
                  )}
                </section>


                {/* SECTION 1.3: ADMINISTRATIVE DETAILS */}
                <section className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-500" />
                    Administrative Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.address || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, address: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.address || candidate?.address || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Province</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.province || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, province: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.province || candidate?.province || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">District</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.district || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, district: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.district || candidate?.district || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Divisional Secretariat</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.divisionalSecretariat || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, divisionalSecretariat: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.divisionalSecretariat || (candidate as any)?.divisionalSecretariat || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GS Division</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.gsDivision || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, gsDivision: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.gsDivision || (candidate as any)?.gsDivision || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECTION 1.4: PERSONAL & PHYSICAL ATTRIBUTES */}
                <section className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                    <User size={18} className="text-green-500" />
                    Personal & Physical Attributes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIC No</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.nic || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, nic: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.nic || candidate?.nic || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driving License</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.drivingLicenseNo || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, drivingLicenseNo: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.drivingLicenseNo || (candidate as any)?.drivingLicenseNo || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                      {isEditingProfile ? (
                        <input
                          type="date"
                          value={editedProfile.personalInfo?.dob || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, dob: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.dob || candidate?.dob || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                    <div>
                      <label htmlFor="height-ft" className="block text-xs font-bold text-slate-500 uppercase mb-1">Height (FT)</label>
                      {isEditingProfile ? (
                        <input
                          id="height-ft"
                          type="number"
                          value={editedProfile.personalInfo?.height?.feet || 0}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: {
                              ...editedProfile.personalInfo!,
                              height: { ...(editedProfile.personalInfo?.height || { feet: 0, inches: 0 }), feet: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.height?.feet || (candidate as any)?.height?.feet || 0} FT
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="height-in" className="block text-xs font-bold text-slate-500 uppercase mb-1">Height (IN)</label>
                      {isEditingProfile ? (
                        <input
                          id="height-in"
                          type="number"
                          value={editedProfile.personalInfo?.height?.inches || 0}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: {
                              ...editedProfile.personalInfo!,
                              height: { ...(editedProfile.personalInfo?.height || { feet: 0, inches: 0 }), inches: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.height?.inches || (candidate as any)?.height?.inches || 0} IN
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="weight-kg" className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (KG)</label>
                      {isEditingProfile ? (
                        <input
                          id="weight-kg"
                          type="number"
                          value={editedProfile.personalInfo?.weight || 0}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...(candidate.personalInfo || { fullName: '' }), ...(editedProfile.personalInfo || {}), weight: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.weight || (candidate as any)?.weight || 0} KG
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Religion</label>
                      {isEditingProfile ? (
                        <select
                          value={editedProfile.personalInfo?.religion || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, religion: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Religion</option>
                          <option value="Sinhala">Sinhala</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Christian">Christian</option>
                        </select>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.religion || (candidate as any)?.religion || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marital Status</label>
                      {isEditingProfile ? (
                        <select
                          value={editedProfile.personalInfo?.maritalStatus || 'Single'}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, maritalStatus: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate.personalInfo?.maritalStatus || 'Single'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="school" className="block text-xs font-bold text-slate-500 uppercase mb-1">School</label>
                      {isEditingProfile ? (
                        <input
                          id="school"
                          type="text"
                          value={editedProfile.professionalProfile?.school || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            professionalProfile: { ...editedProfile.professionalProfile!, school: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate.professionalProfile?.school || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECTION 1.5: CONTACT INFORMATION */}
                <section className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                    <Phone size={18} className="text-orange-500" />
                    Contact Information
                  </h3>

                  <div className="mb-4">
                    {isEditingProfile ? (
                      <MultiPhoneInput
                        primaryPhone={editedProfile.contactInfo?.primaryPhone || editedProfile.phone || ''}
                        whatsappPhone={editedProfile.contactInfo?.whatsappPhone || (editedProfile as any).whatsapp || ''}
                        additionalPhones={editedProfile.contactInfo?.additionalPhones || (editedProfile as any).additionalContactNumbers || []}
                        onPrimaryPhoneChange={(v) => setEditedProfile({
                          ...editedProfile,
                          contactInfo: { ...(editedProfile.contactInfo || { email: '', primaryPhone: '' }), primaryPhone: v }
                        })}
                        onWhatsappPhoneChange={(v) => setEditedProfile({
                          ...editedProfile,
                          contactInfo: { ...(editedProfile.contactInfo || { email: '', primaryPhone: '' }), whatsappPhone: v }
                        })}
                        onAdditionalPhonesChange={(v) => setEditedProfile({
                          ...editedProfile,
                          contactInfo: { ...(editedProfile.contactInfo || { email: '', primaryPhone: '' }), additionalPhones: v }
                        })}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone</label>
                          <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50 flex items-center gap-2">
                            {candidate.contactInfo?.primaryPhone || candidate.phone || '-'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                          <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-emerald-700 border border-emerald-100 bg-emerald-50 flex items-center gap-2">
                            {candidate.contactInfo?.whatsappPhone || (candidate as any).whatsapp || '-'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={editedProfile.contactInfo?.email || editedProfile.email || ''}
                        onChange={(e) => setEditedProfile({
                          ...editedProfile,
                          contactInfo: { ...(editedProfile.contactInfo || { primaryPhone: '', email: '' }), email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                        {candidate?.contactInfo?.email || candidate?.email || '-'}
                      </div>
                    )}
                  </div>
                </section>

                {/* Professional Details Section Expansion */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded" />
                    Professional & Skills
                  </h3>
                  {isEditingProfile ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Experience (Years)</label>
                          <input
                            type="number"
                            value={editedProfile.professionalProfile?.experienceYears || editedProfile.experienceYears || 0}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              professionalProfile: { ...editedProfile.professionalProfile!, experienceYears: parseInt(e.target.value) }
                            })}
                            className="w-full mt-1 p-2 border border-slate-200 rounded text-sm"
                          />
                        </div>
                      </div>

                      <JobRoleEntry
                        jobRoles={(editedProfile.professionalProfile?.jobRoles as any[]) || []}
                        onChange={(roles) => setEditedProfile({
                          ...editedProfile,
                          professionalProfile: { ...(editedProfile.professionalProfile || { experienceYears: 0, skills: [], education: [] }), jobRoles: roles }
                        })}
                      />

                      <PreferredCountriesSelector
                        selectedCountries={editedProfile.preferredCountries || []}
                        onChange={(countries) => setEditedProfile({ ...editedProfile, preferredCountries: countries })}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="col-span-2">
                          {/* School moved to Personal Section */}
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">GCE O/L Year</label>
                            <input
                              type="text"
                              value={editedProfile.professionalProfile?.gceOL?.year || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                professionalProfile: { ...(candidate.professionalProfile || { jobRoles: [], experienceYears: 0, skills: [], education: [] }), ...(editedProfile.professionalProfile || {}), gceOL: { year: e.target.value } }
                              })}
                              className="w-full mt-1 p-2 border border-slate-200 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">GCE A/L Year</label>
                            <input
                              type="text"
                              value={editedProfile.professionalProfile?.gceAL?.year || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                professionalProfile: { ...(candidate.professionalProfile || { jobRoles: [], experienceYears: 0, skills: [], education: [] }), ...(editedProfile.professionalProfile || {}), gceAL: { year: e.target.value } }
                              })}
                              className="w-full mt-1 p-2 border border-slate-200 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Primary Role</label>
                        <div className="text-sm text-slate-900 mt-1">
                          {candidate.professionalProfile?.jobRoles?.[0] && typeof candidate.professionalProfile.jobRoles[0] === 'string'
                            ? candidate.professionalProfile.jobRoles[0]
                            : (candidate.professionalProfile?.jobRoles?.[0] as any)?.title || candidate.role || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Experience</label>
                        <div className="text-sm text-slate-900 mt-1">{candidate.professionalProfile?.experienceYears || candidate.experienceYears || 0} years</div>
                      </div>
                      {candidate.preferredCountries && candidate.preferredCountries.length > 0 && (
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preferred Countries</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {candidate.preferredCountries.map((country: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-200">
                                {country}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        {/* School moved to Personal Section */}
                        <div className="flex gap-4">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">GCE O/L</label>
                            <div className="text-sm text-slate-900 mt-1">{candidate.professionalProfile?.gceOL?.year || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">GCE A/L</label>
                            <div className="text-sm text-slate-900 mt-1">{candidate.professionalProfile?.gceAL?.year || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Achievements & Training Details */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-600 rounded" />
                    Achievements & Special Training
                  </h3>
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Training Details</label>
                        <textarea
                          rows={2}
                          value={editedProfile.professionalProfile?.trainingDetails || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            professionalProfile: { ...editedProfile.professionalProfile!, trainingDetails: e.target.value }
                          })}
                          className="w-full mt-1 p-2 border border-slate-200 rounded text-sm"
                          placeholder="Relevant training courses..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Special Achievements</label>
                        <textarea
                          rows={2}
                          value={editedProfile.professionalProfile?.specialAchievements || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            professionalProfile: { ...editedProfile.professionalProfile!, specialAchievements: e.target.value }
                          })}
                          className="w-full mt-1 p-2 border border-slate-200 rounded text-sm"
                          placeholder="Awards, recognitions, special skills..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                        <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Training Details</label>
                        <p className="text-sm text-slate-700 mt-1">{candidate.professionalProfile?.trainingDetails || 'No training details provided'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Special Achievements</label>
                        <p className="text-sm text-slate-700 mt-1">{candidate.professionalProfile?.specialAchievements || 'No special achievements recorded'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Employment History */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  {isEditingProfile ? (
                    <EmploymentHistoryEntry
                      records={editedProfile.professionalProfile?.employmentHistory || []}
                      onChange={(records) => setEditedProfile({
                        ...editedProfile,
                        professionalProfile: { ...(editedProfile.professionalProfile || { jobRoles: [], experienceYears: 0, skills: [], education: [] }), employmentHistory: records }
                      })}
                    />
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded" />
                        Employment History
                      </h3>
                      <div className="space-y-3">
                        {candidate.professionalProfile?.employmentHistory?.length ? (
                          candidate.professionalProfile.employmentHistory.map((h, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${h.type === 'Foreign' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{h.position}</p>
                                  <p className="text-xs text-slate-600">{h.companyName} {h.country ? `• ${h.country}` : ''}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{h.type}</span>
                                  <span className="text-sm font-semibold text-blue-600">{h.years} Years</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 italic">No employment history records found</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Medical Information */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-600 rounded" />
                    Medical Information
                  </h3>
                  {isEditingProfile ? (
                    <div className="space-y-6">
                      <MedicalStatusInput
                        status={editedProfile.medicalData?.status || (editedProfile.stageData?.medicalStatus as any)}
                        scheduledDate={editedProfile.medicalData?.scheduledDate || editedProfile.stageData?.medicalScheduledDate}
                        completedDate={editedProfile.medicalData?.completedDate || editedProfile.stageData?.medicalCompletedDate}
                        bloodGroup={editedProfile.medicalData?.bloodGroup}
                        allergies={editedProfile.medicalData?.allergies}
                        notes={editedProfile.medicalData?.notes || editedProfile.stageData?.medicalNotes}
                        onStatusChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, status: v } })}
                        onScheduledDateChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, scheduledDate: v } })}
                        onCompletedDateChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, completedDate: v } })}
                        onBloodGroupChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, bloodGroup: v } })}
                        onAllergiesChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, allergies: v } })}
                        onNotesChange={(v) => setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, notes: v } })}
                      />

                      <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Medical History / Past Reports</label>
                        <div className="space-y-3">
                          {(editedProfile.medicalData?.medicalRecords || []).map((record, idx) => (
                            <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <input
                                type="date"
                                value={record.date}
                                onChange={(e) => {
                                  const records = [...(editedProfile.medicalData?.medicalRecords || [])];
                                  records[idx] = { ...record, date: e.target.value };
                                  setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, medicalRecords: records } });
                                }}
                                className="text-xs p-2 border rounded"
                              />
                              <input
                                placeholder="Test Type (e.g. ECG)"
                                value={record.type}
                                onChange={(e) => {
                                  const records = [...(editedProfile.medicalData?.medicalRecords || [])];
                                  records[idx] = { ...record, type: e.target.value };
                                  setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, medicalRecords: records } });
                                }}
                                className="text-xs p-2 border rounded"
                              />
                              <div className="flex gap-2">
                                <input
                                  placeholder="Result"
                                  value={record.result}
                                  onChange={(e) => {
                                    const records = [...(editedProfile.medicalData?.medicalRecords || [])];
                                    records[idx] = { ...record, result: e.target.value };
                                    setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, medicalRecords: records } });
                                  }}
                                  className="text-xs p-2 border rounded w-full"
                                />
                                <button
                                  onClick={() => {
                                    const records = (editedProfile.medicalData?.medicalRecords || []).filter((_, i) => i !== idx);
                                    setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, medicalRecords: records } });
                                  }}
                                  className="text-red-500"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const records = [...(editedProfile.medicalData?.medicalRecords || [])];
                              records.push({ date: new Date().toISOString().split('T')[0], type: '', result: '' });
                              setEditedProfile({ ...editedProfile, medicalData: { ...editedProfile.medicalData!, medicalRecords: records } });
                            }}
                            className="text-xs text-blue-600 font-bold hover:underline"
                          >
                            + Add Medical Record
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500">Status</label>
                          <div className="text-sm font-bold text-slate-800 uppercase">{candidate.medicalData?.status || 'NOT STARTED'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500">Blood Group</label>
                          <div className="text-sm text-red-600 font-bold">{candidate.medicalData?.bloodGroup || '-'}</div>
                        </div>
                        {candidate.medicalData?.scheduledDate && (
                          <div>
                            <label className="text-xs font-medium text-slate-500">Scheduled</label>
                            <div className="text-sm text-slate-600">{candidate.medicalData.scheduledDate}</div>
                          </div>
                        )}
                        {candidate.medicalData?.completedDate && (
                          <div>
                            <label className="text-xs font-medium text-slate-500">Completed</label>
                            <div className="text-sm text-slate-600">{candidate.medicalData.completedDate}</div>
                          </div>
                        )}
                      </div>

                      {candidate.medicalData?.medicalRecords && candidate.medicalData.medicalRecords.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Past Medical History</label>
                          <div className="grid grid-cols-1 gap-2">
                            {candidate.medicalData.medicalRecords.map((m, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
                                <span className="font-mono">{m.date}</span>
                                <span className="font-bold text-slate-800">{m.type}</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${m.result.toLowerCase() === 'fit' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                  {m.result}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Family Information - MATCHED TO PAPER FORM */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded" />
                    Family Details
                    <span className="text-[10px] font-normal text-slate-400 ml-2">CIVIL STATUS: {isEditingProfile ? '' : (candidate?.personalInfo?.maritalStatus || candidate?.personalInfo?.civilStatus || '-')}</span>
                  </h3>
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      {/* Family Members Table (matching paper form: Name, AGE, ID) */}
                      <div className="bg-slate-50/80 rounded-lg border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-3 py-2 border-b border-slate-200">
                          <div>Relation</div>
                          <div>Full Name</div>
                          <div>Age</div>
                          <div>ID No.</div>
                        </div>
                        {/* Father */}
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2 border-b border-slate-100 items-center">
                          <div className="text-xs font-bold text-slate-600">Father's Name</div>
                          <input type="text" value={editedProfile.personalInfo?.fatherName || ''} onChange={(e) => setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, fatherName: e.target.value } })} className="text-sm p-1.5 border border-slate-200 rounded mr-2" placeholder="Full Name" />
                          <input type="number" value={(editedProfile as any).fatherAge || ''} onChange={(e) => setEditedProfile({ ...editedProfile, fatherAge: parseInt(e.target.value) || undefined } as any)} className="text-sm p-1.5 border border-slate-200 rounded mr-2 w-16" placeholder="Age" />
                          <input type="text" value={(editedProfile as any).fatherNic || ''} onChange={(e) => setEditedProfile({ ...editedProfile, fatherNic: e.target.value } as any)} className="text-sm p-1.5 border border-slate-200 rounded font-mono" placeholder="NIC" />
                        </div>
                        {/* Mother */}
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2 border-b border-slate-100 items-center">
                          <div className="text-xs font-bold text-slate-600">Mother's Name</div>
                          <input type="text" value={editedProfile.personalInfo?.motherName || ''} onChange={(e) => setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, motherName: e.target.value } })} className="text-sm p-1.5 border border-slate-200 rounded mr-2" placeholder="Full Name" />
                          <input type="number" value={(editedProfile as any).motherAge || ''} onChange={(e) => setEditedProfile({ ...editedProfile, motherAge: parseInt(e.target.value) || undefined } as any)} className="text-sm p-1.5 border border-slate-200 rounded mr-2 w-16" placeholder="Age" />
                          <input type="text" value={(editedProfile as any).motherNic || ''} onChange={(e) => setEditedProfile({ ...editedProfile, motherNic: e.target.value } as any)} className="text-sm p-1.5 border border-slate-200 rounded font-mono" placeholder="NIC" />
                        </div>
                        {/* Spouse */}
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2 items-center">
                          <div className="text-xs font-bold text-slate-600">Spouse's Name</div>
                          <input type="text" value={editedProfile.personalInfo?.spouseName || ''} onChange={(e) => setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, spouseName: e.target.value } })} className="text-sm p-1.5 border border-slate-200 rounded mr-2" placeholder="Full Name" />
                          <input type="number" value={(editedProfile as any).spouseAge || ''} onChange={(e) => setEditedProfile({ ...editedProfile, spouseAge: parseInt(e.target.value) || undefined } as any)} className="text-sm p-1.5 border border-slate-200 rounded mr-2 w-16" placeholder="Age" />
                          <input type="text" value={(editedProfile as any).spouseNic || ''} onChange={(e) => setEditedProfile({ ...editedProfile, spouseNic: e.target.value } as any)} className="text-sm p-1.5 border border-slate-200 rounded font-mono" placeholder="NIC" />
                        </div>
                      </div>

                      {/* Children Details */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Children Details</label>
                          <button
                            onClick={() => {
                              const children = [...(editedProfile.personalInfo?.children || [])];
                              children.push({ name: '', gender: 'M', age: 0 });
                              setEditedProfile({
                                ...editedProfile,
                                personalInfo: { ...(editedProfile.personalInfo || { fullName: '' }), children }
                              });
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            + Add Child
                          </button>
                        </div>
                        {(editedProfile.personalInfo?.children || []).map((child: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                            <input placeholder="Name" value={child.name || ''} onChange={(e) => { const children = [...(editedProfile.personalInfo?.children || [])]; children[idx] = { ...child, name: e.target.value }; setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } }); }} className="text-sm p-1 border rounded" />
                            <select value={child.gender || 'M'} onChange={(e) => { const children = [...(editedProfile.personalInfo?.children || [])]; children[idx] = { ...child, gender: e.target.value }; setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } }); }} className="text-sm p-1 border rounded">
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                            <div className="flex gap-2">
                              <input type="number" placeholder="Age" value={child.age || 0} onChange={(e) => { const children = [...(editedProfile.personalInfo?.children || [])]; children[idx] = { ...child, age: parseInt(e.target.value) || 0 }; setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } }); }} className="text-sm p-1 border rounded w-full" />
                              <button onClick={() => { const children = (editedProfile.personalInfo?.children || []).filter((_: any, i: number) => i !== idx); setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } }); }} className="text-red-500 p-1">&times;</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Family Members Table (read-only, matching paper form) */}
                      <div className="bg-slate-50/80 rounded-lg border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-3 py-2 border-b border-slate-200">
                          <div>Relation</div>
                          <div>Full Name</div>
                          <div>Age</div>
                          <div>ID No.</div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2.5 border-b border-slate-100 items-center">
                          <div className="text-xs font-bold text-slate-600">Father's Name</div>
                          <div className="text-sm font-medium text-slate-900">{candidate?.personalInfo?.fatherName || '-'}</div>
                          <div className="text-sm text-slate-700">{(candidate as any)?.fatherAge || '-'}</div>
                          <div className="text-sm text-slate-700 font-mono">{(candidate as any)?.fatherNic || '-'}</div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2.5 border-b border-slate-100 items-center">
                          <div className="text-xs font-bold text-slate-600">Mother's Name</div>
                          <div className="text-sm font-medium text-slate-900">{candidate?.personalInfo?.motherName || '-'}</div>
                          <div className="text-sm text-slate-700">{(candidate as any)?.motherAge || '-'}</div>
                          <div className="text-sm text-slate-700 font-mono">{(candidate as any)?.motherNic || '-'}</div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr_70px_120px] gap-0 px-3 py-2.5 items-center">
                          <div className="text-xs font-bold text-slate-600">Spouse's Name</div>
                          <div className="text-sm font-medium text-slate-900">{candidate?.personalInfo?.spouseName || '-'}</div>
                          <div className="text-sm text-slate-700">{(candidate as any)?.spouseAge || '-'}</div>
                          <div className="text-sm text-slate-700 font-mono">{(candidate as any)?.spouseNic || '-'}</div>
                        </div>
                      </div>

                      {/* Children Details (read-only) */}
                      <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-3">Children Details ({candidate?.personalInfo?.children?.length || 0})</label>
                        <div className="space-y-2">
                          {(candidate?.personalInfo?.children || []).length > 0 ? (
                            (candidate?.personalInfo?.children || []).map((child: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs shadow-sm">
                                <div className="flex gap-4">
                                  <span className="font-bold text-slate-700">{child.name || child.gender || 'Child'}</span>
                                  <span className="text-slate-500">DOB: {child.dob || '-'}</span>
                                </div>
                                <span className="text-blue-600 font-bold">{child.age || 0} Years</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No children details recorded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 1.55: PHASE 4-6 SYSTEM DATA */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-cyan-500 rounded-full"></span>
                    Phase 4-6 System Data
                  </h3>

                  {isEditingProfile ? (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed space-y-6">
                      {/* WP & Selection Editable */}
                      <div>
                        <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-3">Work Permit & Selection</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WP Reference Number</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.wpReferenceNumber || candidate.stageData?.wpReferenceNumber || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, wpReferenceNumber: e.target.value } as any
                              })}
                              placeholder="e.g. WP/2026/PL-1234"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Working Video Link</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.workingVideoLink || candidate.stageData?.workingVideoLink || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, workingVideoLink: e.target.value } as any
                              })}
                              placeholder="https://drive.google.com/..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Self Intro Video Link</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.selfIntroductionVideoLink || candidate.stageData?.selfIntroductionVideoLink || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, selfIntroductionVideoLink: e.target.value } as any
                              })}
                              placeholder="https://drive.google.com/..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Video Links Editable */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Additional Video Links</h5>
                          <button
                            onClick={() => {
                              const currentLinks = editedProfile.stageData?.additionalVideoLinks || candidate.stageData?.additionalVideoLinks || [];
                              setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, additionalVideoLinks: [...currentLinks, ''] } as any
                              });
                            }}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors"
                          >
                            <Plus size={12} /> Add Link
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(editedProfile.stageData?.additionalVideoLinks || candidate.stageData?.additionalVideoLinks || []).map((link, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const currentLinks = [...(editedProfile.stageData?.additionalVideoLinks || candidate.stageData?.additionalVideoLinks || [])];
                                  currentLinks[index] = e.target.value;
                                  setEditedProfile({
                                    ...editedProfile,
                                    stageData: { ...candidate.stageData, ...editedProfile.stageData, additionalVideoLinks: currentLinks } as any
                                  });
                                }}
                                placeholder="https://drive.google.com/..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                              />
                              <button
                                onClick={() => {
                                  const currentLinks = [...(editedProfile.stageData?.additionalVideoLinks || candidate.stageData?.additionalVideoLinks || [])];
                                  currentLinks.splice(index, 1);
                                  setEditedProfile({
                                    ...editedProfile,
                                    stageData: { ...candidate.stageData, ...editedProfile.stageData, additionalVideoLinks: currentLinks } as any
                                  });
                                }}
                                className="px-3 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          {(editedProfile.stageData?.additionalVideoLinks || candidate.stageData?.additionalVideoLinks || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No additional video links added.</p>
                          )}
                        </div>
                      </div>

                      {/* Embassy & Visa Editable */}
                      <div className="pt-4 border-t border-slate-200">
                        <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Embassy & Visa Processing</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Travel Insurance Policy</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.travelInsurancePolicyNumber || candidate.stageData?.travelInsurancePolicyNumber || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, travelInsurancePolicyNumber: e.target.value } as any
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coverage End Date</label>
                            <input
                              type="date"
                              value={editedProfile.stageData?.travelInsuranceCoverageEndDate || candidate.stageData?.travelInsuranceCoverageEndDate || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, travelInsuranceCoverageEndDate: e.target.value } as any
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Flight & Departure Editable */}
                      <div className="pt-4 border-t border-slate-200">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Flight & Departure</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Flight Number</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.flightNumber || candidate.stageData?.flightNumber || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, flightNumber: e.target.value } as any
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PNR</label>
                            <input
                              type="text"
                              value={editedProfile.stageData?.flightPNR || candidate.stageData?.flightPNR || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, flightPNR: e.target.value } as any
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departure Time</label>
                            <input
                              type="datetime-local"
                              value={editedProfile.stageData?.flightDepartureTime ? new Date(editedProfile.stageData.flightDepartureTime).toISOString().slice(0, 16) : candidate.stageData?.flightDepartureTime ? new Date(candidate.stageData.flightDepartureTime).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                stageData: { ...candidate.stageData, ...editedProfile.stageData, flightDepartureTime: e.target.value ? new Date(e.target.value).toISOString() : undefined } as any
                              })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                      {/* WP & Selection Read Only */}
                      <div>
                        <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Work Permit & Selection</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">WP Reference Number</label>
                            <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{candidate.stageData?.wpReferenceNumber || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Working Video</label>
                            <div className="text-sm mt-1">
                              {candidate.stageData?.workingVideoLink ? (
                                <a href={candidate.stageData.workingVideoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                                  <Globe size={14} /> Open Link
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Self Intro Video</label>
                            <div className="text-sm mt-1">
                              {candidate.stageData?.selfIntroductionVideoLink ? (
                                <a href={candidate.stageData.selfIntroductionVideoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                                  <Globe size={14} /> Open Link
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Video Links Read Only */}
                      {(candidate.stageData?.additionalVideoLinks && candidate.stageData.additionalVideoLinks.length > 0) && (
                        <div className="pt-3 border-t border-slate-200">
                          <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Additional Video Links</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {candidate.stageData.additionalVideoLinks.map((link, index) => (
                              <div key={index}>
                                <label className="text-xs font-medium text-slate-500 uppercase">Additional Video {index + 1}</label>
                                <div className="text-sm mt-1">
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                                    <Globe size={14} /> Open Link
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Embassy & Visa Read Only */}
                      <div className="pt-3 border-t border-slate-200">
                        <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Embassy & Visa Processing</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Travel Insurance Policy</label>
                            <div className="text-sm font-bold text-slate-900 mt-1">{candidate.stageData?.travelInsurancePolicyNumber || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Coverage End Date</label>
                            <div className="text-sm font-medium text-slate-900 mt-1">{candidate.stageData?.travelInsuranceCoverageEndDate || '-'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Flight & Departure Read Only */}
                      <div className="pt-3 border-t border-slate-200">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Flight & Departure</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Flight Number</label>
                            <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{candidate.stageData?.flightNumber || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">PNR</label>
                            <div className="text-sm font-bold text-blue-700 mt-1 font-mono">{candidate.stageData?.flightPNR || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Departure</label>
                            <div className="text-sm font-bold text-emerald-700 mt-1">
                              {candidate.stageData?.flightDepartureTime ? new Date(candidate.stageData.flightDepartureTime).toLocaleString() : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* SECTION 1.56: EMBASSY APPLIED DETAILS */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-amber-500 rounded-full"></span>
                    Embassy Applied Details
                  </h3>

                  {isEditingProfile ? (
                    <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-200 border-dashed space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E NO (Embassy Number)</label>
                          <input type="text" value={(editedProfile as any).embassyDetails?.eNo || candidate.embassyDetails?.eNo || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, eNo: e.target.value } } as any)} placeholder="e.g. E2812909804914" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SE NO</label>
                          <input type="text" value={(editedProfile as any).embassyDetails?.seNo || candidate.embassyDetails?.seNo || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, seNo: e.target.value } } as any)} placeholder="e.g. SE 0286531" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Applied Date</label>
                          <input type="date" value={(editedProfile as any).embassyDetails?.appliedDate || candidate.embassyDetails?.appliedDate || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, appliedDate: e.target.value } } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Appointment Date</label>
                          <input type="datetime-local" value={(editedProfile as any).embassyDetails?.appointmentDate || candidate.embassyDetails?.appointmentDate || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, appointmentDate: e.target.value } } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stamp Date</label>
                          <input type="date" value={(editedProfile as any).embassyDetails?.stampDate || candidate.embassyDetails?.stampDate || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, stampDate: e.target.value } } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stamp Result</label>
                          <select value={(editedProfile as any).embassyDetails?.stampResult || candidate.embassyDetails?.stampResult || 'Pending'} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, stampResult: e.target.value } } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500">
                            <option value="Pending">Pending</option>
                            <option value="Stamped">Stamped</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Awareness Program Date</label>
                          <input type="date" value={(editedProfile as any).embassyDetails?.awarenessProgramDate || candidate.embassyDetails?.awarenessProgramDate || ''} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, awarenessProgramDate: e.target.value } } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={(editedProfile as any).embassyDetails?.awarenessProgramSigned || candidate.embassyDetails?.awarenessProgramSigned || false} onChange={(e) => setEditedProfile({ ...editedProfile, embassyDetails: { ...candidate.embassyDetails, ...(editedProfile as any).embassyDetails, awarenessProgramSigned: e.target.checked } } as any)} className="w-4 h-4 rounded border-slate-300 text-amber-600" />
                            <span className="text-xs font-bold text-slate-600 uppercase">Awareness Program Signed</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/30 p-5 rounded-xl border border-amber-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">E NO</label>
                          <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{candidate.embassyDetails?.eNo || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">SE NO</label>
                          <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{candidate.embassyDetails?.seNo || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">Applied Date</label>
                          <div className="text-sm font-medium text-slate-900 mt-1">{candidate.embassyDetails?.appliedDate || '-'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-amber-100">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">Appointment Date</label>
                          <div className="text-sm font-bold text-amber-700 mt-1">{candidate.embassyDetails?.appointmentDate ? new Date(candidate.embassyDetails.appointmentDate).toLocaleString() : '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">Stamp Date</label>
                          <div className="text-sm font-medium text-slate-900 mt-1">{candidate.embassyDetails?.stampDate || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">Stamp Result</label>
                          <div className="mt-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${candidate.embassyDetails?.stampResult === 'Stamped' ? 'bg-green-100 text-green-700' : candidate.embassyDetails?.stampResult === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              {candidate.embassyDetails?.stampResult || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {(candidate.embassyDetails?.awarenessProgramDate || candidate.embassyDetails?.awarenessProgramSigned) && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-100">
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Awareness Program</label>
                            <div className="text-sm font-medium text-slate-900 mt-1">{candidate.embassyDetails?.awarenessProgramDate || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 uppercase">Signed</label>
                            <div className="text-sm font-bold mt-1">{candidate.embassyDetails?.awarenessProgramSigned ? '✅ Yes' : '❌ No'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SECTION 1.57: ADVANCE PAYMENT TRACKING */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-green-500 rounded-full"></span>
                    Advance Payment Tracking
                  </h3>

                  {isEditingProfile ? (
                    <div className="bg-green-50/50 p-6 rounded-xl border border-green-200 border-dashed">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-green-200">
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">#</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Payment Type</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Informed</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Sign Date</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Invoice No</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Amount (Rs)</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['Register Fee', 'Offer', 'Work Permit', 'Embassy USD', 'Balance Pay', 'Ticket', 'Deposit', 'Other'].map((type, idx) => {
                              const payments = (editedProfile as any).advancePayments || candidate.advancePayments || [];
                              const payment = payments.find((p: any) => p.type === type) || { type, id: `adv-${idx}` };
                              return (
                                <tr key={type} className="border-b border-green-100 hover:bg-green-50/50">
                                  <td className="py-2 px-2 font-bold text-slate-500">{idx + 1}</td>
                                  <td className="py-2 px-2 font-bold text-slate-700">{type}</td>
                                  <td className="py-2 px-2">
                                    <input type="date" value={payment.informedDate || ''} onChange={(e) => {
                                      const all = [...((editedProfile as any).advancePayments || candidate.advancePayments || [])];
                                      const existIdx = all.findIndex((p: any) => p.type === type);
                                      const updated = { ...payment, informedDate: e.target.value, informed: !!e.target.value };
                                      if (existIdx >= 0) all[existIdx] = updated; else all.push(updated);
                                      setEditedProfile({ ...editedProfile, advancePayments: all } as any);
                                    }} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs" />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input type="date" value={payment.signDate || ''} onChange={(e) => {
                                      const all = [...((editedProfile as any).advancePayments || candidate.advancePayments || [])];
                                      const existIdx = all.findIndex((p: any) => p.type === type);
                                      const updated = { ...payment, signDate: e.target.value };
                                      if (existIdx >= 0) all[existIdx] = updated; else all.push(updated);
                                      setEditedProfile({ ...editedProfile, advancePayments: all } as any);
                                    }} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs" />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input type="text" value={payment.invoiceNo || ''} onChange={(e) => {
                                      const all = [...((editedProfile as any).advancePayments || candidate.advancePayments || [])];
                                      const existIdx = all.findIndex((p: any) => p.type === type);
                                      const updated = { ...payment, invoiceNo: e.target.value };
                                      if (existIdx >= 0) all[existIdx] = updated; else all.push(updated);
                                      setEditedProfile({ ...editedProfile, advancePayments: all } as any);
                                    }} placeholder="Inv#" className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs" />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input type="number" value={payment.amount || ''} onChange={(e) => {
                                      const all = [...((editedProfile as any).advancePayments || candidate.advancePayments || [])];
                                      const existIdx = all.findIndex((p: any) => p.type === type);
                                      const updated = { ...payment, amount: parseFloat(e.target.value) || 0 };
                                      if (existIdx >= 0) all[existIdx] = updated; else all.push(updated);
                                      setEditedProfile({ ...editedProfile, advancePayments: all } as any);
                                    }} placeholder="0" className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs" />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input type="text" value={payment.remarks || ''} onChange={(e) => {
                                      const all = [...((editedProfile as any).advancePayments || candidate.advancePayments || [])];
                                      const existIdx = all.findIndex((p: any) => p.type === type);
                                      const updated = { ...payment, remarks: e.target.value };
                                      if (existIdx >= 0) all[existIdx] = updated; else all.push(updated);
                                      setEditedProfile({ ...editedProfile, advancePayments: all } as any);
                                    }} placeholder="Notes..." className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USD Rate EMB</label>
                          <input type="number" step="0.01" value={(editedProfile as any).usdRateEmb || candidate.usdRateEmb || ''} onChange={(e) => setEditedProfile({ ...editedProfile, usdRateEmb: parseFloat(e.target.value) || 0 } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USD Rate F/A</label>
                          <input type="number" step="0.01" value={(editedProfile as any).usdRateFA || candidate.usdRateFA || ''} onChange={(e) => setEditedProfile({ ...editedProfile, usdRateFA: parseFloat(e.target.value) || 0 } as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50/30 p-5 rounded-xl border border-green-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-green-200">
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">#</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Type</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Informed</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Sign Date</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Invoice</th>
                              <th className="text-right py-2 px-2 font-bold text-slate-600 uppercase">Amount</th>
                              <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['Register Fee', 'Offer', 'Work Permit', 'Embassy USD', 'Balance Pay', 'Ticket', 'Deposit', 'Other'].map((type, idx) => {
                              const payment = (candidate.advancePayments || []).find((p) => p.type === type);
                              const hasData = payment && (payment.amount || payment.invoiceNo || payment.informedDate);
                              return (
                                <tr key={type} className={`border-b border-green-100 ${hasData ? 'bg-green-50/50' : ''}`}>
                                  <td className="py-2 px-2 font-bold text-slate-400">{idx + 1}</td>
                                  <td className="py-2 px-2 font-bold text-slate-700">{type}</td>
                                  <td className="py-2 px-2 text-slate-600">{payment?.informedDate || '-'}</td>
                                  <td className="py-2 px-2 text-slate-600">{payment?.signDate || '-'}</td>
                                  <td className="py-2 px-2 font-mono text-slate-600">{payment?.invoiceNo || '-'}</td>
                                  <td className="py-2 px-2 text-right font-bold text-green-700">{payment?.amount ? `Rs. ${payment.amount.toLocaleString()}` : '-'}</td>
                                  <td className="py-2 px-2 text-slate-500 italic">{payment?.remarks || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {(candidate.usdRateEmb || candidate.usdRateFA) && (
                        <div className="mt-3 pt-3 border-t border-green-100 flex gap-6 text-xs">
                          <div><span className="font-bold text-slate-500 uppercase">USD Rate EMB:</span> <span className="font-bold text-slate-800">{candidate.usdRateEmb || '-'}</span></div>
                          <div><span className="font-bold text-slate-500 uppercase">USD Rate F/A:</span> <span className="font-bold text-slate-800">{candidate.usdRateFA || '-'}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SECTION 1.575: DATE/REMARK LOG (handwritten notes section on paper forms) */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-orange-500 rounded-full"></span>
                    Date / Remark Log
                  </h3>
                  <div className="bg-orange-50/30 rounded-xl border border-orange-200/60 overflow-hidden">
                    {/* Existing remarks */}
                    <div className="px-5 py-3">
                      {((candidate as any).remarkLog && (candidate as any).remarkLog.length > 0) ? (
                        <div className="space-y-2">
                          {(candidate as any).remarkLog.map((entry: any, idx: number) => (
                            <div key={idx} className="flex gap-3 py-2 border-b border-orange-100/50 last:border-0">
                              <div className="text-[11px] font-bold text-orange-600 whitespace-nowrap min-w-[80px]">{entry.date}</div>
                              <div className="text-xs text-slate-700 leading-relaxed">{entry.remark}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center py-3">
                          No remarks recorded yet
                        </div>
                      )}
                    </div>

                    {/* Add new remark */}
                    {isEditingProfile && (
                      <div className="px-5 py-3 bg-orange-100/30 border-t border-orange-200/50">
                        <div className="flex gap-3 items-end">
                          <div className="flex-shrink-0">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input
                              type="date"
                              id="new-remark-date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remark</label>
                            <input
                              type="text"
                              id="new-remark-text"
                              placeholder="Enter remark / note..."
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const dateInput = document.getElementById('new-remark-date') as HTMLInputElement;
                              const textInput = document.getElementById('new-remark-text') as HTMLInputElement;
                              if (dateInput?.value && textInput?.value) {
                                const existing = (editedProfile as any).remarkLog || (candidate as any).remarkLog || [];
                                setEditedProfile({ ...editedProfile, remarkLog: [...existing, { date: dateInput.value, remark: textInput.value }] } as any);
                                textInput.value = '';
                              }
                            }}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 flex-shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* SECTION 1.58: CERTIFICATE CHECKLIST (matches paper form 14-item list) */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-purple-500 rounded-full"></span>
                    Certificates Checklist
                  </h3>
                  <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                      {/* Left column: Items 1-7 */}
                      <div>
                        {[
                          { num: 1, label: 'PP Size Photo (6)', docType: 'Passport Size Photos (6)' },
                          { num: 2, label: 'Full Photo', docType: 'Full Photo (1)' },
                          { num: 3, label: 'Edu: Certificates (O/L, A/L)', docType: 'GCE O/L Results' },
                          { num: 4, label: 'Course Certificates', docType: 'Course Certificates' },
                          { num: 5, label: 'NVQ/Trade Test Certificates', docType: 'NVQ/Trade Test Certificates' },
                          { num: 6, label: 'Self Introduction Video', docType: 'Self Introduction Video' },
                          { num: 7, label: 'Working Video', docType: 'Working Video' },
                        ].map(item => {
                          const hasDoc = candidate.documents?.some(d => d.type === item.docType && d.status !== 'Rejected');
                          return (
                            <div key={item.num} className={`flex items-center gap-3 py-2.5 border-b border-purple-100/50 ${hasDoc ? 'opacity-100' : 'opacity-60'}`}>
                              <span className="text-[11px] font-bold text-slate-400 w-5 text-right">{item.num}</span>
                              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${hasDoc ? 'bg-green-500 text-white' : 'border-2 border-slate-300 bg-white'}`}>
                                {hasDoc && <span className="text-xs">✓</span>}
                              </div>
                              <span className={`text-xs font-semibold ${hasDoc ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Right column: Items 8-14 */}
                      <div>
                        {[
                          { num: 8, label: 'Police Report (A) Local', docType: 'Police Report (Local)' },
                          { num: 9, label: 'Police Report (B) HQ/FM', docType: 'Police Report (HQ/FM)' },
                          { num: 10, label: 'Birth Certificate', docType: 'Birth Certificate' },
                          { num: 11, label: 'Experience Letters', docType: 'Experience Letters' },
                          { num: 12, label: 'Medical Report Date', docType: 'Medical Report' },
                          { num: 13, label: 'Re-Check', docType: null },
                          { num: 14, label: 'Family Background Report', docType: 'Family Background Report' },
                        ].map(item => {
                          const hasDoc = item.docType ? candidate.documents?.some(d => d.type === item.docType && d.status !== 'Rejected') : false;
                          return (
                            <div key={item.num} className={`flex items-center gap-3 py-2.5 border-b border-purple-100/50 ${hasDoc ? 'opacity-100' : 'opacity-60'}`}>
                              <span className="text-[11px] font-bold text-slate-400 w-5 text-right">{item.num}</span>
                              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${hasDoc ? 'bg-green-500 text-white' : 'border-2 border-slate-300 bg-white'}`}>
                                {hasDoc && <span className="text-xs">✓</span>}
                              </div>
                              <span className={`text-xs font-semibold ${hasDoc ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-200 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-green-500 flex items-center justify-center text-white text-[8px]">✓</div>
                        <span className="font-semibold">Submitted</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded border-2 border-slate-300"></div>
                        <span className="font-semibold">Pending</span>
                      </div>
                      <div className="ml-auto font-bold text-purple-600">
                        {candidate.documents?.filter(d => d.status !== 'Rejected').length || 0} / 14 Collected
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 1.59: WORKFLOW MILESTONES (bottom tracking row on paper form) */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-cyan-500 rounded-full"></span>
                    Workflow Milestone Dates
                  </h3>

                  {isEditingProfile ? (
                    <div className="bg-cyan-50/50 p-6 rounded-xl border border-cyan-200 border-dashed">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { key: 'offerAppliedDate', label: 'Offer Applied' },
                          { key: 'offerReceivedDate', label: 'Offer Received' },
                          { key: 'wpAppliedDate', label: 'WP Applied' },
                          { key: 'wpReceivedDate', label: 'WP Received' },
                          { key: 'embAppliedDate', label: 'EMB Applied' },
                          { key: 'embAppointmentDate', label: 'EMB Appointment' },
                          { key: 'stampRejectDate', label: 'Stamp/Reject' },
                          { key: 'slbfeTrainingDate', label: 'SLBFE Training' },
                          { key: 'slbfeRegistrationDate', label: 'SLBFE Registration' },
                          { key: 'departureDate', label: 'Departure' },
                        ].map(milestone => (
                          <div key={milestone.key}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{milestone.label}</label>
                            <input
                              type="date"
                              value={((editedProfile as any).workflowMilestones || candidate.workflowMilestones || {} as any)[milestone.key] || ''}
                              onChange={(e) => {
                                const existing = (editedProfile as any).workflowMilestones || candidate.workflowMilestones || {};
                                setEditedProfile({ ...editedProfile, workflowMilestones: { ...existing, [milestone.key]: e.target.value } } as any);
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-cyan-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stamp Result Notes</label>
                          <input
                            type="text"
                            value={((editedProfile as any).workflowMilestones || candidate.workflowMilestones || {} as any).stampResult || ''}
                            onChange={(e) => {
                              const existing = (editedProfile as any).workflowMilestones || candidate.workflowMilestones || {};
                              setEditedProfile({ ...editedProfile, workflowMilestones: { ...existing, stampResult: e.target.value } } as any);
                            }}
                            placeholder="e.g. Stamped / Rejected - reason"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-cyan-50/30 p-5 rounded-xl border border-cyan-100">
                      {/* Progress bar visualization */}
                      <div className="flex items-center gap-0 overflow-x-auto pb-3">
                        {[
                          { key: 'offerAppliedDate', label: 'Offer\nApplied', icon: '📋' },
                          { key: 'offerReceivedDate', label: 'Offer\nReceived', icon: '📩' },
                          { key: 'wpAppliedDate', label: 'WP\nApplied', icon: '📝' },
                          { key: 'wpReceivedDate', label: 'WP\nReceived', icon: '✅' },
                          { key: 'embAppliedDate', label: 'EMB\nApplied', icon: '🏛️' },
                          { key: 'embAppointmentDate', label: 'EMB\nAppoint.', icon: '📅' },
                          { key: 'stampRejectDate', label: 'Stamp/\nReject', icon: '🔖' },
                          { key: 'slbfeTrainingDate', label: 'SLBFE\nTraining', icon: '🎓' },
                          { key: 'slbfeRegistrationDate', label: 'SLBFE\nReg.', icon: '📑' },
                          { key: 'departureDate', label: 'Departure', icon: '✈️' },
                        ].map((milestone, idx, arr) => {
                          const milestones = candidate.workflowMilestones || {} as any;
                          const date = (milestones as any)[milestone.key];
                          const isCompleted = !!date;
                          const isLast = idx === arr.length - 1;
                          return (
                            <div key={milestone.key} className="flex items-center flex-shrink-0">
                              <div className="flex flex-col items-center" style={{ minWidth: '72px' }}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isCompleted ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                  {isCompleted ? '✓' : milestone.icon}
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 mt-1.5 text-center whitespace-pre-line leading-tight">{milestone.label}</span>
                                <span className="text-[8px] font-medium text-cyan-700 mt-0.5">{date || '-'}</span>
                              </div>
                              {!isLast && (
                                <div className={`w-6 h-0.5 flex-shrink-0 ${isCompleted ? 'bg-cyan-400' : 'bg-slate-200'}`}></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {(candidate.workflowMilestones as any)?.stampResult && (
                        <div className="mt-2 pt-2 border-t border-cyan-100 text-xs">
                          <span className="font-bold text-slate-500 uppercase">Stamp Result: </span>
                          <span className="font-medium text-slate-700">{(candidate.workflowMilestones as any).stampResult}</span>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SECTION 1.6: OFFICE USE ONLY */}
                <section className="mt-8 pt-8 border-t border-slate-100 mb-6">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                    <Briefcase size={18} className="text-violet-500" />
                    Office Use Only
                  </h3>

                  {isEditingProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Customer Care Officer</label>
                        <input
                          type="text"
                          value={editedProfile.officeUseOnly?.customerCareOfficer || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            officeUseOnly: { ...(editedProfile.officeUseOnly || { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' }), customerCareOfficer: e.target.value }
                          })}
                          className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">File Handling Officer</label>
                        <input
                          type="text"
                          value={editedProfile.officeUseOnly?.fileHandlingOfficer || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            officeUseOnly: { ...(editedProfile.officeUseOnly || { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' }), fileHandlingOfficer: e.target.value }
                          })}
                          className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                        <input
                          type="date"
                          value={editedProfile.officeUseOnly?.date || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            officeUseOnly: { ...(editedProfile.officeUseOnly || { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' }), date: e.target.value }
                          })}
                          className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Charges</label>
                        <input
                          type="text"
                          value={editedProfile.officeUseOnly?.charges || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            officeUseOnly: { ...(editedProfile.officeUseOnly || { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' }), charges: e.target.value }
                          })}
                          placeholder="e.g. 1350000 + Ticket + Medical"
                          className="w-full mt-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Customer Care Officer</label>
                        <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.officeUseOnly?.customerCareOfficer || '-'}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">File Handling Officer</label>
                        <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.officeUseOnly?.fileHandlingOfficer || '-'}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                        <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.officeUseOnly?.date || '-'}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Charges</label>
                        <div className="text-sm font-bold text-indigo-600 mt-1">{candidate?.officeUseOnly?.charges || '-'}</div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )
            }

            {/* Documents Tab */}
            {
              activeTab === 'documents' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <DocumentManager
                    candidate={candidate}
                    onUpdate={handleDocumentUpdate}
                  />
                </div>
              )
            }


            {/* Timeline Tab */}
            {
              activeTab === 'timeline' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <TimelineView events={candidate.timelineEvents || []} />
                </div>
              )
            }

            {/* System Audit Tab */}
            {
              activeTab === 'audit' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <CandidateReport candidate={candidate} />
                </div>
              )
            }

          </div >

          {/* Sidebar (30%) */}
          < div className="space-y-4" >
            <QuickActionsWidget
              candidate={candidate}
              onDelete={handleDelete}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isExportingReport}
            />
            <ComplianceWidget
              candidate={candidate}
              onUpdate={handleComplianceUpdate}
              onRefresh={refreshCandidates}
            />
            <SLBFEStatusWidget candidate={candidate} />

            {/* Matched Jobs Widget */}
            {/* Matched Jobs Widget */}
            {matchedJobs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Briefcase size={14} className="text-blue-500" />
                  Matched Jobs ({matchedJobs.length})
                </h4>
                <div className="space-y-2.5">
                  {matchedJobs.map(job => {
                    const employer = job.employerId ? employersMap[job.employerId] : null;
                    return (
                      <div key={job.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-all">
                        <Link to={`/jobs?highlight=${job.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {employer && (
                            <Link to={`/partners/${employer.id}`} className="text-[10px] text-blue-500 hover:underline font-semibold">
                              {employer.companyName}
                            </Link>
                          )}
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] text-slate-500">{job.location}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-green-600 font-bold">{job.salaryRange}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${job.status === 'Open' ? 'bg-green-50 text-green-600' :
                            job.status === 'Filled' ? 'bg-blue-50 text-blue-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>{job.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <WorkflowProgressWidget
              candidate={candidate}
              onAdvance={handleAdvanceStage}
              onRollback={handleRollback}
            />
            <RecentActivityWidget
              candidate={candidate}
              onViewAll={() => {
                setActiveTab('timeline');
                document.getElementById('main-content-tabs')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div >
        </div >
      </div >
    </div >
  );
};

export default CandidateDetail;