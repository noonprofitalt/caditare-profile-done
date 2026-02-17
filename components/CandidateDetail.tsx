import React, { useState, useEffect } from 'react';
import { useCandidates } from '../context/CandidateContext';
import { useParams, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { CandidateReportPDF } from '../src/components/reports/CandidateReportPDF';
import { CandidateService } from '../services/candidateService';
import { Candidate, WorkflowStage, CandidateDocument, PassportData, PCCData, TimelineEventType, PassportStatus } from '../types';
import { User, FileText, History, Bot, AlertCircle, Plus, Trash2, ShieldCheck, ShieldAlert, Edit2, CheckCircle, X, Mail, Globe, MapPin, Calendar, Briefcase, Phone, Award, Clock, RefreshCw } from 'lucide-react';

// New Components
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

// Existing Components
import DocumentManager from './DocumentManager';
import TimelineView from './TimelineView';
import { ComplianceService } from '../services/complianceService';
import { ProfileCompletionService } from '../services/profileCompletionService';
import WorkflowEngine, { WORKFLOW_STAGES } from '../services/workflowEngine';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Use global state
  const { candidates, updateCandidateInState, removeCandidateFromState, refreshCandidates } = useCandidates();

  // Derive candidate from global state
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const startEditing = () => {
    if (!candidate) return;

    // Ensure personalInfo has all components populated from top-level fallbacks if missing
    const initialPersonalInfo = {
      ...(candidate.personalInfo || {}),
      firstName: candidate.personalInfo?.firstName || candidate.firstName || '',
      middleName: candidate.personalInfo?.middleName || candidate.middleName || '',
      fullName: candidate.personalInfo?.fullName || candidate.name || ''
    };

    setEditedProfile({
      ...candidate,
      personalInfo: initialPersonalInfo
    });
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    if (!candidate || !editedProfile) return;

    // Construct the full name from components to ensure it stays in sync
    const personal = editedProfile.personalInfo || candidate.personalInfo || {};
    const firstName = (personal as any).firstName || '';
    const middleName = (personal as any).middleName || '';
    const existingFullName = (personal as any).fullName;

    const fullName = existingFullName || `${firstName} ${middleName ? middleName + ' ' : ''}`.trim();

    const updatedCandidate: Candidate = {
      ...candidate,
      ...editedProfile,
      personalInfo: {
        ...(candidate.personalInfo || {}),
        ...(editedProfile.personalInfo || {}),
        fullName: (fullName || '') as string,
        children: editedProfile.personalInfo?.children || candidate.personalInfo?.children || []
      },
      contactInfo: {
        ...(candidate.contactInfo || {}),
        ...(editedProfile.contactInfo || {})
      },
      professionalProfile: {
        ...(candidate.professionalProfile || {}),
        ...(editedProfile.professionalProfile || {})
      },
      medicalData: {
        ...(candidate.medicalData || {}),
        ...(editedProfile.medicalData || {})
      },
      slbfeData: {
        biometricStatus: 'Pending',
        medicalStatus: 'Pending',
        ...(candidate.slbfeData || {}),
        ...(editedProfile.slbfeData || {})
      } as any
    };

    // Recalculate completion
    const finalCandidate = ProfileCompletionService.updateCompletionData(updatedCandidate);

    CandidateService.updateCandidate(finalCandidate);
    CandidateService.addTimelineEvent(candidate.id, {
      type: 'SYSTEM',
      title: 'Profile Updated',
      description: 'Candidate profile information was updated',
      actor: 'System'
    });

    updateCandidateInState(finalCandidate);
    setCandidate(finalCandidate);
    setIsEditingProfile(false);
  };

  // Handle compliance update
  const handleComplianceUpdate = (data: {
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

    CandidateService.updateCandidate(updatedCandidate);
    CandidateService.addTimelineEvent(candidate.id, {
      type: 'SYSTEM',
      title: 'Compliance Data Updated',
      description: 'Passport and PCC information has been updated',
      actor: 'System'
    });

    updateCandidateInState(updatedCandidate);
    setCandidate(updatedCandidate);
  };

  // Handle document update
  const handleDocumentUpdate = (updatedDocs: CandidateDocument[]) => {
    if (!candidate) return;

    const updatedCandidate: Candidate = {
      ...candidate,
      documents: updatedDocs
    };

    CandidateService.updateCandidate(updatedCandidate);
    CandidateService.addTimelineEvent(candidate.id, {
      type: 'DOCUMENT',
      title: 'Documents Updated',
      description: 'Candidate documents have been modified',
      actor: 'System'
    });

    updateCandidateInState(updatedCandidate);
    setCandidate(updatedCandidate);
  };

  // Strict Workflow Actions
  // Strict Workflow Actions
  const handleAdvanceStage = async () => {
    if (!candidate) return;

    const nextStage = WorkflowEngine.getNextStage(candidate.stage);
    if (!nextStage) return;

    // Use WorkflowEngine to perform transition logic
    const transitionResult = await WorkflowEngine.performTransition(candidate, nextStage, 'Current User');

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
        actor: 'Current User'
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
      actor: 'Current User'
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
      navigate('/candidates');
    }
  };

  const handleGenerateReport = async () => {
    if (!candidate) return;

    try {
      // Generate system report first for strategic assessment and risk scoring
      const { ReportService } = await import('../services/reportService');
      const systemReport = await ReportService.generateReport(candidate);

      const blob = await pdf(
        <CandidateReportPDF
          candidate={candidate}
          reportId={`REP-${Date.now()}`}
          generatedBy="System Administrator"
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
        actor: 'Current User'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate report. Please try again.');
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
              Return to Registry
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
      <div className="max-w-7xl mx-auto px-6 py-6">
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

                {/* SECTION 1.1: PERSONAL DETAILS (NAME) */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-blue-500 rounded-full"></span>
                    1.1 Personal Details (Name)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.firstName || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, firstName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.firstName || candidate?.firstName || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Middle Name</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.middleName || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, middleName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-900 border border-slate-200/50">
                          {candidate?.personalInfo?.middleName || candidate?.middleName || '-'}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.fullName || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, fullName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30"
                          placeholder="Full Name as per Passport"
                        />
                      ) : (
                        <div className="p-2.5 bg-blue-50/50 rounded-lg text-sm font-bold text-slate-900 border border-blue-100">
                          {candidate?.personalInfo?.fullName || candidate?.name || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECTION 1.2: PASSPORT DETAILS */}
                <section className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-1 bg-purple-500 rounded-full"></span>
                      1.2 Passport Details
                    </h3>
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-4">
                      {(editedProfile.passports || []).map((passport, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                          {idx > 0 && (
                            <button
                              onClick={() => {
                                const passports = [...(editedProfile.passports || [])];
                                const updated = passports.filter((_, i) => i !== idx);
                                setEditedProfile({ ...editedProfile, passports: updated });
                              }}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Passport Number</label>
                              <input
                                type="text"
                                value={passport.passportNumber}
                                onChange={(e) => {
                                  const passports = [...(editedProfile.passports || [])];
                                  passports[idx] = { ...passport, passportNumber: e.target.value };
                                  setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g. N1234567"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                              <input
                                type="text"
                                value={passport.country}
                                onChange={(e) => {
                                  const passports = [...(editedProfile.passports || [])];
                                  passports[idx] = { ...passport, country: e.target.value };
                                  setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Issued Date</label>
                              <input
                                type="date"
                                value={passport.issuedDate ? new Date(passport.issuedDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const passports = [...(editedProfile.passports || [])];
                                  passports[idx] = { ...passport, issuedDate: e.target.value };
                                  setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                              <input
                                type="date"
                                value={passport.expiryDate ? new Date(passport.expiryDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const passports = [...(editedProfile.passports || [])];
                                  const expiryDate = e.target.value;
                                  // Auto-evaluate status
                                  const evaluation = ComplianceService.evaluatePassport(
                                    expiryDate,
                                    passport.passportNumber,
                                    passport.country,
                                    passport.issuedDate
                                  );
                                  passports[idx] = {
                                    ...passport,
                                    expiryDate,
                                    status: evaluation.status,
                                    validityDays: evaluation.validityDays
                                  };
                                  setEditedProfile({ ...editedProfile, passports });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const passports = [...(editedProfile.passports || [])];
                          passports.push({
                            passportNumber: '',
                            country: 'Sri Lanka',
                            issuedDate: '',
                            expiryDate: '',
                            status: PassportStatus.VALID,
                            validityDays: 0
                          });
                          setEditedProfile({ ...editedProfile, passports });
                        }}
                        className="w-full py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-bold flex items-center justify-center gap-2 border border-purple-200 border-dashed text-sm"
                      >
                        <Plus size={16} /> Add Another Passport
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(candidate.passports && candidate.passports.length > 0) ? (
                        candidate.passports.map((passport, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Passport Number</label>
                                <div className="text-sm font-bold text-slate-800">{passport.passportNumber || '-'}</div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Country</label>
                                <div className="text-sm text-slate-800">{passport.country || '-'}</div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Issued Date</label>
                                <div className="text-sm text-slate-800">{passport.issuedDate || '-'}</div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                                <div className="text-sm text-slate-800 mb-1">{passport.expiryDate || '-'}</div>
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
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 italic text-center border border-slate-200 border-dashed">
                          No passport details available
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* SECTION 1.3: ADMINISTRATIVE DETAILS */}
                <section className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-indigo-500 rounded-full"></span>
                    1.3 Administrative Details
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
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-green-500 rounded-full"></span>
                    1.4 Personal & Physical Attributes
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
                        <input
                          type="text"
                          value={editedProfile.personalInfo?.religion || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            personalInfo: { ...editedProfile.personalInfo!, religion: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
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
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-6 h-1 bg-orange-500 rounded-full"></span>
                    1.5 Contact Information
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

                {/* Family Information */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-rose-500 rounded" />
                    Family & Dependents
                  </h3>
                  {isEditingProfile ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          {/* Marital Status moved to Personal Section */}
                        </div>
                      </div>

                      {/* Parent & Spouse Names (Edit Mode) */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Father's Name</label>
                          <input
                            type="text"
                            value={editedProfile.personalInfo?.fatherName || ''}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              personalInfo: { ...editedProfile.personalInfo!, fatherName: e.target.value }
                            })}
                            className="w-full mt-1 p-1.5 text-sm border rounded"
                            placeholder="Father's Full Name"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Mother's Name</label>
                          <input
                            type="text"
                            value={editedProfile.personalInfo?.motherName || ''}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              personalInfo: { ...editedProfile.personalInfo!, motherName: e.target.value }
                            })}
                            className="w-full mt-1 p-1.5 text-sm border rounded"
                            placeholder="Mother's Full Name"
                          />
                        </div>
                        {editedProfile.personalInfo?.maritalStatus === 'Married' && (
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Spouse's Name</label>
                            <input
                              type="text"
                              value={editedProfile.personalInfo?.spouseName || ''}
                              onChange={(e) => setEditedProfile({
                                ...editedProfile,
                                personalInfo: { ...editedProfile.personalInfo!, spouseName: e.target.value }
                              })}
                              className="w-full mt-1 p-1.5 text-sm border rounded"
                              placeholder="Spouse's Full Name"
                            />
                          </div>
                        )}
                      </div>

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
                            <input
                              placeholder="Name"
                              value={child.name || ''}
                              onChange={(e) => {
                                const children = [...(editedProfile.personalInfo?.children || [])];
                                children[idx] = { ...child, name: e.target.value };
                                setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } });
                              }}
                              className="text-sm p-1 border rounded"
                            />
                            <select
                              value={child.gender || 'M'}
                              onChange={(e) => {
                                const children = [...(editedProfile.personalInfo?.children || [])];
                                children[idx] = { ...child, gender: e.target.value };
                                setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } });
                              }}
                              className="text-sm p-1 border rounded"
                            >
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Age"
                                value={child.age || 0}
                                onChange={(e) => {
                                  const children = [...(editedProfile.personalInfo?.children || [])];
                                  children[idx] = { ...child, age: parseInt(e.target.value) || 0 };
                                  setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } });
                                }}
                                className="text-sm p-1 border rounded w-full"
                              />
                              <button
                                onClick={() => {
                                  const children = (editedProfile.personalInfo?.children || []).filter((_: any, i: number) => i !== idx);
                                  setEditedProfile({ ...editedProfile, personalInfo: { ...editedProfile.personalInfo!, children } });
                                }}
                                className="text-red-500 p-1"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          {/* Marital Status moved to Personal Section */}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Children Count</label>
                          <div className="text-sm text-slate-900 mt-1">{candidate.personalInfo?.children?.length || (candidate as any).numberOfChildren || 0}</div>
                        </div>
                      </div>

                      {/* Parent & Spouse Names (View Mode) */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Father's Name</label>
                          <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.personalInfo?.fatherName || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Mother's Name</label>
                          <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.personalInfo?.motherName || '-'}</div>
                        </div>
                        {candidate?.personalInfo?.maritalStatus === 'Married' && (
                          <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Spouse's Name</label>
                            <div className="text-sm font-medium text-slate-900 mt-1">{candidate?.personalInfo?.spouseName || '-'}</div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-3">Children Details</label>
                        <div className="space-y-2">
                          {(candidate?.personalInfo?.children || []).length > 0 ? (
                            (candidate?.personalInfo?.children || []).map((child: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs shadow-sm">
                                <div className="flex gap-4">
                                  <span className="font-bold text-slate-700">{child.gender || 'Child'}</span>
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
                <div className="bg-white rounded-xl border border-slate-200 p-6">
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
            />
            <ComplianceWidget
              candidate={candidate}
              onUpdate={handleComplianceUpdate}
              onRefresh={refreshCandidates}
            />
            <SLBFEStatusWidget candidate={candidate} />
            <WorkflowProgressWidget
              candidate={candidate}
              onAdvance={handleAdvanceStage}
              onRollback={handleRollback}
            />
            <RecentActivityWidget candidate={candidate} onViewAll={() => setActiveTab('timeline')} />
          </div >
        </div >
      </div >
    </div >
  );
};

export default CandidateDetail;