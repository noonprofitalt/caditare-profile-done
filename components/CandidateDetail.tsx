import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import { JobService } from '../services/jobService';
import { NotificationService } from '../services/notificationService';
import { ReportingService } from '../services/reportingService';
import { ArrowLeft, MapPin, Phone, Mail, Briefcase, FileText, Layout, PlayCircle, AlertCircle, History, ShieldAlert, ChevronDown, Unlock, Edit3, MessageCircle, Calendar, User, FileBadge, Printer, BrainCircuit, Bot, RefreshCw, FileSearch, Building2, ExternalLink } from 'lucide-react';
import DocumentManager from './DocumentManager';
import WorkflowTracker from './WorkflowTracker';
import TimelineView from './TimelineView';
import CandidateForm from './CandidateForm';
import CandidateReport from './CandidateReport';
import ComplianceWidget from './ComplianceWidget';
import { ChatService } from '../services/chatService';
import { Candidate, CandidateDocument, WorkflowStage, TimelineEvent, Employer, Job } from '../types';
import { validateTransition, getNextStage, STAGE_ORDER } from '../services/workflowEngine';
import { GeminiService } from '../services/geminiService';
import { ComplianceService } from '../services/complianceService';
import { FinanceService } from '../services/financeService';
import { TransactionType, TransactionCategory } from '../types';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'timeline' | 'chat' | 'report'>('timeline');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);



  // Admin Override & Edit State
  const { user } = useAuth();
  const isAdminMode = user?.role === 'Admin';
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Context linking
  const [matchedEmployer, setMatchedEmployer] = useState<Employer | null>(null);
  const [matchedJob, setMatchedJob] = useState<Job | null>(null);

  const refreshCandidate = () => {
    if (id) {
      setCandidate(CandidateService.getCandidateById(id));
    }
  };

  useEffect(() => {
    refreshCandidate();
  }, [id]);

  // Load matched employer and job
  useEffect(() => {
    if (candidate?.jobId) {
      const job = JobService.getJobById(candidate.jobId);
      setMatchedJob(job || null);

      if (job?.employerId) {
        const employer = PartnerService.getEmployerById(job.employerId);
        setMatchedEmployer(employer || null);
      }
    }
  }, [candidate]);

  const handleComplianceUpdate = (data: any) => {
    if (!candidate) return;

    let updatedCandidate = { ...candidate };

    // 1. Process Passport
    if (data.passport.number) {
      const passportData = ComplianceService.evaluatePassport(
        data.passport.expiry,
        data.passport.number,
        data.passport.country,
        data.passport.issued
      );
      updatedCandidate.passportData = passportData;
    }

    // 2. Process PCC
    if (data.pcc.issued) {
      const pccData = ComplianceService.evaluatePCC(data.pcc.issued, data.pcc.lastInspection);
      updatedCandidate.pccData = pccData;
    }

    // 3. Log Event
    if (!updatedCandidate.timelineEvents) {
      updatedCandidate.timelineEvents = [];
    }
    updatedCandidate.timelineEvents.unshift({
      id: `evt-comp-${Date.now()}`,
      type: 'MANUAL_OVERRIDE',
      title: 'Compliance Data Updated',
      description: 'Staff manually updated Passport/PCC details.',
      timestamp: new Date().toISOString(),
      actor: user?.name || 'Staff User',
      stage: candidate.stage
    });

    // 4. Save & Refresh
    CandidateService.updateCandidate(updatedCandidate);
    setCandidate(updatedCandidate);
    NotificationService.addNotification({
      type: 'SUCCESS',
      title: 'Compliance Data Saved',
      message: 'Passport and PCC details have been updated.',
      candidateId: candidate.id
    });
  };

  if (!candidate) return <div className="p-8">Candidate not found</div>;

  const handleDocumentUpdate = (updatedDocs: CandidateDocument[]) => {
    if (candidate) {
      const updatedCandidate = { ...candidate, documents: updatedDocs };
      setCandidate(updatedCandidate);
      CandidateService.updateCandidate(updatedCandidate);

      NotificationService.addNotification({
        type: 'INFO',
        title: 'Document Updated',
        message: `A document was updated for ${candidate.name}.`,
        link: `/candidates/${candidate.id}?tab=documents`,
        candidateId: candidate.id
      });
    }
  };

  const handleProfileUpdate = (updatedData: any) => {
    const updatedCandidate = {
      ...candidate,
      ...updatedData,
      stageData: {
        ...(candidate.stageData || {}),
        ...(updatedData.stageData || {})
      }
    };
    setCandidate(updatedCandidate as Candidate);
    CandidateService.updateCandidate(updatedCandidate as Candidate);
    setIsEditModalOpen(false);
  };

  const handleStageTransition = (targetStage: WorkflowStage) => {
    setTransitionError(null);
    const result = validateTransition(candidate, targetStage);

    if (!result.allowed && !isAdminMode) {
      setTransitionError(result.reason || 'Transition not allowed.');
      return;
    }

    performTransition(targetStage, isAdminMode ? 'MANUAL_OVERRIDE' : 'SYSTEM');
  };

  const handleForceTransition = (targetStage: WorkflowStage) => {
    performTransition(targetStage, 'MANUAL_OVERRIDE');
    setShowStageSelector(false);
  };

  const performTransition = (targetStage: WorkflowStage, type: 'SYSTEM' | 'MANUAL_OVERRIDE') => {
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type,
      title: `Moved to ${targetStage}`,
      description: type === 'MANUAL_OVERRIDE' ? 'Manual stage override by administrator.' : `Candidate successfully transitioned to ${targetStage}.`,
      timestamp: new Date().toISOString(),
      actor: type === 'MANUAL_OVERRIDE' ? (user?.name || 'Admin User') : 'System Engine',
      stage: targetStage
    };

    if (candidate) {
      const updatedCandidate: Candidate = {
        ...candidate,
        stage: targetStage,
        stageEnteredAt: new Date().toISOString(),
        timelineEvents: [newEvent, ...(candidate.timelineEvents || [])]
      };
      setCandidate(updatedCandidate);
      CandidateService.updateCandidate(updatedCandidate);

      // --- NEW: Trigger System Chat Pulse ---
      // Post to 'Announcements' (c2) if critical stage, otherwise 'General' (c1)
      const isCritical = [WorkflowStage.VISA_RECEIVED, WorkflowStage.DEPARTURE, WorkflowStage.OFFER_RECEIVED].includes(targetStage);
      const channelId = isCritical ? 'c2' : 'c1';

      ChatService.systemPost(
        channelId,
        `Candidate ${candidate.name} has moved to stage: ${targetStage}`,
        isCritical ? 'SUCCESS' : 'INFO',
        {
          type: 'CANDIDATE',
          id: candidate.id,
          label: candidate.name
        }
      );
      // -------------------------------------

      NotificationService.addNotification({
        type: type === 'MANUAL_OVERRIDE' ? 'WARNING' : 'SUCCESS',
        title: `Stage Transition: ${targetStage}`,
        message: `${candidate.name} has been moved to ${targetStage}${type === 'MANUAL_OVERRIDE' ? ' (Admin Override)' : ''}.`,
        link: `/candidates/${candidate.id}`,
        candidateId: candidate.id
      });

      // --- AUTOMATION: Finance Commission Logging ---
      if (targetStage === WorkflowStage.VISA_RECEIVED) {
        // Determine Commission Amount
        let commission = 450; // Default
        let employerName = 'Unknown Employer';
        let employerId = '';

        // Try to determine employer
        if (matchedEmployer) {
          commission = matchedEmployer.commissionPerHire || 450;
          employerName = matchedEmployer.companyName;
          employerId = matchedEmployer.id;
        } else if (candidate.jobId) {
          // Fallback via Job
          const job = JobService.getJobById(candidate.jobId);
          if (job && job.employerId) {
            const emp = PartnerService.getEmployerById(job.employerId);
            if (emp) {
              commission = emp.commissionPerHire || 450;
              employerName = emp.companyName;
              employerId = emp.id;
            }
          }
        }

        FinanceService.addTransaction({
          type: TransactionType.REVENUE,
          amount: commission,
          description: `Recruitment Commission: ${candidate.name} (${candidate.role}) - ${employerName}`,
          category: TransactionCategory.COMMISSION,
          candidateId: candidate.id,
          employerId: employerId
        });

        NotificationService.addNotification({
          type: 'SUCCESS',
          title: '💰 Commission Logged',
          message: `Revenue of $${commission} has been automatically recorded in the Finance Ledger.`,
          link: '/finance',
          candidateId: candidate.id
        });
      }
      // ---------------------------------------------
    }
  };

  const nextStage = candidate ? getNextStage(candidate.stage) : null;

  // CRITICAL: Check if candidate exists before rendering
  if (!candidate) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <p>Loading candidate...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/candidates" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <img src={candidate.avatarUrl} alt={candidate.name} className="w-16 h-16 rounded-2xl shadow-md object-cover border-2 border-white" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-900">{candidate.name}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {candidate.stage}
                </span>
              </div>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <Briefcase size={14} /> {candidate.role} • <MapPin size={14} /> {candidate.location}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 no-print">
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white text-slate-500 rounded-lg hover:bg-slate-50 border border-slate-200"
              title="Print Profile"
            >
              <Printer size={20} />
            </button>

            {/* Invoice Generation Button */}
            {(candidate.stage === WorkflowStage.VISA_RECEIVED || candidate.stage === WorkflowStage.DEPARTURE) && (
              <button
                onClick={() => {
                  if (confirm('Generate Commission Invoice for this candidate?')) {
                    // Logic to find employer similar to commission logging
                    let emp = matchedEmployer;
                    if (!emp && candidate.employerId) {
                      emp = PartnerService.getEmployerById(candidate.employerId);
                    } else if (!emp && candidate.jobId) {
                      const job = JobService.getJobById(candidate.jobId);
                      if (job && job.employerId) emp = PartnerService.getEmployerById(job.employerId);
                    }

                    if (emp) {
                      FinanceService.generateInvoice(candidate, emp);
                      NotificationService.addNotification({
                        type: 'SUCCESS',
                        title: 'Invoice Generated',
                        message: `Invoice for ${emp.companyName} has been created.`,
                        link: '/finance',
                        candidateId: candidate.id
                      });
                    } else {
                      alert('No linked employer found to generate invoice.');
                    }
                  }
                }}
                className="p-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-200 no-print"
                title="Generate Commission Invoice"
              >
                <FileText size={20} />
              </button>
            )}


            {isAdminMode && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to rollback the last stage transition?')) {
                    CandidateService.rollbackTransition(candidate.id, user?.name || 'Admin User');
                    refreshCandidate();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-bold text-sm"
                title="Undo last transition"
              >
                <History size={18} /> Undo Last
              </button>
            )}

            {nextStage && (
              <button
                onClick={() => handleStageTransition(nextStage)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold text-sm active:scale-95"
              >
                Promote to {nextStage} <PlayCircle size={18} />
              </button>
            )}

            {isAdminMode && (
              <div className="relative">
                <button
                  onClick={() => setShowStageSelector(!showStageSelector)}
                  className="p-2.5 bg-white text-slate-500 rounded-lg hover:bg-slate-50 border border-slate-200"
                  title="Jump to any stage"
                >
                  <ChevronDown size={20} />
                </button>

                {showStageSelector && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-50 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Force Jump To Stage
                    </div>
                    {STAGE_ORDER.map((stage) => (
                      <button
                        key={stage}
                        disabled={stage === candidate.stage}
                        onClick={() => handleForceTransition(stage)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group transition-colors"
                      >
                        {stage}
                        {stage === candidate.stage && <span className="text-xs text-slate-400 font-medium">Current</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Validation Error Message */}
          {transitionError && !isAdminMode && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-pulse max-w-md text-right shadow-sm">
              <AlertCircle size={14} className="shrink-0" />
              {transitionError}
            </div>
          )}

          {/* Admin Mode Warning/Info */}
          {isAdminMode && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <ShieldAlert size={12} />
              Validation rules disabled. Actions will be logged.
            </div>
          )}
        </div>
      </div>

      <WorkflowTracker candidate={candidate} />

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><History size={16} /> Process Timeline</div>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><FileText size={16} /> Documents</div>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><Layout size={16} /> Profile</div>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'report' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <div className="flex items-center gap-2"><FileSearch size={16} /> System Report</div>
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <TimelineView events={candidate.timelineEvents || []} />
      ) : activeTab === 'documents' ? (
        <DocumentManager candidate={candidate} onUpdate={handleDocumentUpdate} />
      ) : activeTab === 'report' ? (
        <CandidateReport candidate={candidate} />
      ) : (
        <div className="space-y-6">
          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <BrainCircuit size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <BrainCircuit size={20} /> AI Candidate Insights
                </h3>
                <button
                  onClick={async () => {
                    setIsAnalyzing(true);
                    const analysis = await GeminiService.analyzeCandidate(candidate);
                    setAiAnalysis(analysis);
                    setIsAnalyzing(false);
                  }}
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold backdrop-blur-sm transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Bot size={16} />}
                  {aiAnalysis ? 'Regenerate Analysis' : 'Generate Analysis'}
                </button>
              </div>

              {aiAnalysis ? (
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-blue-100 text-sm italic">
                  Generate an AI-powered assessment of this candidate's fit, experience, and recommended next steps based on their profile data.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">Personal Details</h3>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail size={16} className="text-slate-400 shrink-0" /> <span className="truncate" title={candidate.email}>{candidate.email}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div>{candidate.phone}</div>
                      {candidate.secondaryPhone && (
                        <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                          <span className="sr-only">Secondary:</span>
                          {candidate.secondaryPhone}
                        </div>
                      )}
                    </div>
                  </div>
                  {candidate.whatsapp && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MessageCircle size={16} className="text-green-500 shrink-0" /> {candidate.whatsapp}
                    </div>
                  )}
                  {candidate.nic && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      <FileBadge size={16} className="text-slate-400 shrink-0" /> NIC: {candidate.nic}
                    </div>
                  )}
                  {candidate.dob && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Calendar size={16} className="text-slate-400 shrink-0" /> DOB: {candidate.dob}
                    </div>
                  )}
                  {candidate.gender && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <User size={16} className="text-slate-400 shrink-0" /> {candidate.gender}
                    </div>
                  )}
                  {candidate.address && (
                    <div className="flex items-start gap-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{candidate.address}, {candidate.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">Preferred Countries</h3>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">Preferred Countries</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.preferredCountries?.length > 0 ? (
                      (candidate.preferredCountries || []).map((c, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="font-medium text-slate-800">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* DYNAMIC JOB ROLES */}
              {candidate.jobRoles && candidate.jobRoles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in">
                  <h5 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2">
                    Additional Job Roles ({candidate.jobRoles.length})
                  </h5>
                  <div className="space-y-2">
                    {(candidate.jobRoles || []).map((role, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-blue-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{role.title}</div>
                            <div className="text-xs text-slate-500">{role.experienceYears} Years Experience</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${role.skillLevel === 'Expert' ? 'bg-purple-100 text-purple-700' :
                            role.skillLevel === 'Skilled' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                            {role.skillLevel}
                          </span>
                        </div>
                        {role.notes && (
                          <div className="mt-2 text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2">
                            "{role.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUICK REMARK SIDEBAR */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative no-print">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageCircle size={18} className="text-blue-600" />
                  Quick Remark
                </h3>
                <div className="space-y-3">
                  <textarea
                    placeholder="Type an internal note..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 placeholder:text-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const target = e.target as HTMLTextAreaElement;
                        if (target.value.trim()) {
                          CandidateService.addComment(candidate.id, 'Admin User', target.value.trim(), true);
                          target.value = '';
                          refreshCandidate();
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Press Enter to save instantly</p>
                </div>
              </div>

              {/* Matched Employer & Job Context */}
              {(matchedEmployer || matchedJob) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Building2 size={80} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-600" />
                      Matched Opportunity
                    </h3>

                    {matchedJob && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-xs text-slate-500 mb-1">Job Position</p>
                        <p className="font-bold text-slate-800">{matchedJob.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{matchedJob.location}</p>
                        <p className="text-sm text-green-600 font-semibold mt-1">{matchedJob.salaryRange}</p>
                      </div>
                    )}

                    {matchedEmployer && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-xs text-slate-500 mb-1">Employer</p>
                        <Link
                          to={`/partners/${matchedEmployer.id}`}
                          className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 group"
                        >
                          {matchedEmployer.companyName}
                          <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                          <MapPin size={12} />
                          {matchedEmployer.country}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                          <Mail size={12} />
                          {matchedEmployer.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Compliance Widget */}
              <ComplianceWidget
                passport={candidate.passportData}
                pcc={candidate.pccData}
                onUpdate={handleComplianceUpdate}
              />

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">Sub-Stage Statuses</h3>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors no-print">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">Employer Status</p>
                    <p className={`font-semibold ${candidate.stageData?.employerStatus === 'Selected' ? 'text-green-600' : 'text-slate-800'}`}>
                      {candidate.stageData?.employerStatus || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Medical</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1 w-fit ${candidate.stageData?.medicalStatus === 'Cleared' ? 'bg-green-100 text-green-700' :
                      candidate.stageData?.medicalStatus === 'Failed' ? 'bg-red-100 text-red-700' :
                        candidate.stageData?.medicalStatus === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {candidate.stageData?.medicalStatus || 'Pending'}
                    </span>
                    {candidate.stageData?.medicalStatus === 'Scheduled' && candidate.stageData?.medicalScheduledDate && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        <Calendar size={12} /> {candidate.stageData.medicalScheduledDate}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">Police Status</p>
                    <p className={`font-semibold ${candidate.stageData?.policeStatus === 'Issued' ? 'text-green-600' : 'text-slate-800'}`}>
                      {candidate.stageData?.policeStatus || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">Visa Status</p>
                    <p className={`font-semibold ${candidate.stageData?.visaStatus === 'Approved' ? 'text-green-600' : 'text-slate-800'}`}>
                      {candidate.stageData?.visaStatus || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">Experience & Skills</h3>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Education</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.education && candidate.education.length > 0 ? (
                      (candidate.education || []).map((edu, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100 font-medium">
                          {edu}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">Not Specified</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4">{candidate.experienceYears} Years of Experience</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(candidate.skills || []).map(s => (
                    <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <CandidateForm
          title="Edit Candidate Profile"
          initialData={candidate}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default CandidateDetail;