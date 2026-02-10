import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CANDIDATES } from '../services/mockData';
import { ReportingService } from '../services/reportingService';
import { ArrowLeft, MapPin, Phone, Mail, Briefcase, FileText, Layout, PlayCircle, AlertCircle, History, ShieldAlert, ChevronDown, Unlock, Edit3, MessageCircle, Calendar, User, FileBadge, Printer } from 'lucide-react';
import DocumentManager from './DocumentManager';
import WorkflowTracker from './WorkflowTracker';
import TimelineView from './TimelineView';
import CandidateForm from './CandidateForm';
import { CandidateDocument, WorkflowStage, TimelineEvent } from '../types';
import { validateTransition, getNextStage, STAGE_ORDER } from '../services/workflowEngine';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState(MOCK_CANDIDATES.find(c => c.id === id));
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'timeline'>('timeline');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  
  // Admin Override & Edit State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!candidate) return <div className="p-8">Candidate not found</div>;

  const handleDocumentUpdate = (updatedDocs: CandidateDocument[]) => {
    setCandidate({ ...candidate, documents: updatedDocs });
  };

  const handleProfileUpdate = (updatedData: any) => {
    // Merge new data with existing candidate data
    const updatedCandidate = {
      ...candidate,
      ...updatedData,
      stageData: {
          ...candidate.stageData,
          ...updatedData.stageData
      }
    };
    setCandidate(updatedCandidate);
    setIsEditModalOpen(false);
  };

  const handleDownloadReport = () => {
     if (!candidate) return;
     const csvContent = ReportingService.generateCandidateCSV(candidate);
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     link.setAttribute("download", `360_Report_${candidate.name.replace(' ', '_')}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // Smart Transition Handler
  const handleStageTransition = (targetStage: WorkflowStage) => {
    // 1. ADMIN OVERRIDE: Bypass validation if admin mode is active
    if (isAdminMode) {
      setTransitionError(null);
      performTransition(targetStage, 'Manual Admin Override', true);
      return;
    }

    // 2. STANDARD FLOW: Run validation rules
    const result = validateTransition(candidate, targetStage);
    
    if (result.allowed) {
      setTransitionError(null);
      performTransition(targetStage, 'System Standard Flow');
    } else {
      // 3. INTERFERENCE: Show validation error
      setTransitionError(result.reason || "Transition not allowed.");
    }
  };

  // Dropdown Forced Transition
  const handleForceTransition = (targetStage: WorkflowStage) => {
    setTransitionError(null);
    setShowStageSelector(false);
    performTransition(targetStage, 'Manual Admin Override', true);
  };

  const performTransition = (targetStage: WorkflowStage, reason: string, isOverride: boolean = false) => {
     const newEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        type: isOverride ? 'MANUAL_OVERRIDE' : 'STAGE_TRANSITION',
        title: isOverride ? `Forced Move to ${targetStage}` : `Moved to ${targetStage}`,
        description: isOverride ? `Admin bypassed validation rules. Reason: ${reason}` : 'Standard workflow progression.',
        timestamp: new Date().toISOString(),
        actor: 'Admin User',
        stage: candidate.stage,
        metadata: {
          oldStatus: candidate.stage,
          newStatus: targetStage,
          isCritical: isOverride
        }
     };

     setCandidate({
        ...candidate,
        stage: targetStage,
        stageEnteredAt: new Date().toISOString(),
        timelineEvents: [newEvent, ...candidate.timelineEvents]
      });
  };

  const nextStage = getNextStage(candidate.stage);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Link to="/candidates" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to List
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
           <img 
              src={candidate.avatarUrl} 
              alt={candidate.name} 
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
            />
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-2xl font-bold text-slate-800">{candidate.name}</h1>
                 <button onClick={() => setIsEditModalOpen(true)} className="text-slate-400 hover:text-blue-600 transition-colors">
                   <Edit3 size={16} />
                 </button>
                 <button 
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                 >
                    <Printer size={12} /> 360° Report
                 </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                 <span className="flex items-center gap-1"><Briefcase size={14} /> {candidate.role}</span>
                 <span className="flex items-center gap-1"><MapPin size={14} /> {candidate.location}</span>
                 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                   candidate.stage === 'Registration' ? 'bg-blue-100 text-blue-700' : 
                   'bg-green-100 text-green-700'
                 }`}>
                  {candidate.stage}
                </span>
              </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
             {/* Main Action Button */}
             {nextStage && (
               <button 
                  onClick={() => handleStageTransition(nextStage)}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white font-medium rounded-lg transition-all shadow-sm active:scale-95 ${
                    isAdminMode 
                      ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-100' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
               >
                 {isAdminMode ? <ShieldAlert size={18} /> : <PlayCircle size={18} />}
                 {isAdminMode ? `Force: ${nextStage}` : `Move to ${nextStage}`}
               </button>
             )}

             {/* Admin Override Toggle */}
             <button 
               onClick={() => {
                 setIsAdminMode(!isAdminMode);
                 setTransitionError(null); // Clear error on toggle
               }}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                 isAdminMode 
                   ? 'bg-slate-800 text-white border-slate-800' 
                   : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
               }`}
             >
               {isAdminMode ? <Unlock size={16} /> : <ShieldAlert size={16} />}
               {isAdminMode ? 'Admin Active' : 'Admin Override'}
             </button>

             {/* Advanced Jump (Only visible in Admin Mode) */}
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
      </div>

      {activeTab === 'timeline' ? (
        <TimelineView events={candidate.timelineEvents} />
      ) : activeTab === 'documents' ? (
        <DocumentManager candidate={candidate} onUpdate={handleDocumentUpdate} />
      ) : (
        /* Profile Tab Content */
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
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400 shrink-0" /> {candidate.phone}
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
               <div className="flex flex-wrap gap-2">
                 {candidate.preferredCountries.map(c => (
                   <span key={c} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium">{c}</span>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">Sub-Stage Statuses</h3>
                  <button onClick={() => setIsEditModalOpen(true)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg transition-colors">
                     <Edit3 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Employer Status</p>
                      <p className={`font-semibold ${candidate.stageData.employerStatus === 'Selected' ? 'text-green-600' : 'text-slate-800'}`}>
                        {candidate.stageData.employerStatus || 'N/A'}
                      </p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Medical Status</p>
                       <p className={`font-semibold ${candidate.stageData.medicalStatus === 'Cleared' ? 'text-green-600' : 'text-slate-800'}`}>
                        {candidate.stageData.medicalStatus || 'N/A'}
                      </p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Police Status</p>
                       <p className={`font-semibold ${candidate.stageData.policeStatus === 'Issued' ? 'text-green-600' : 'text-slate-800'}`}>
                        {candidate.stageData.policeStatus || 'N/A'}
                      </p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">Visa Status</p>
                       <p className={`font-semibold ${candidate.stageData.visaStatus === 'Approved' ? 'text-green-600' : 'text-slate-800'}`}>
                        {candidate.stageData.visaStatus || 'N/A'}
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
                    <p className="text-slate-800 font-medium">{candidate.education || 'Not Specified'}</p>
                </div>
                <p className="text-sm text-slate-500 mb-4">{candidate.experienceYears} Years of Experience</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {candidate.skills.map(s => (
                    <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{s}</span>
                  ))}
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