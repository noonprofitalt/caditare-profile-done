import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { Candidate, WorkflowStage, CandidateDocument, PassportData, PCCData, TimelineEventType } from '../types';
import { User, FileText, History, Bot, AlertCircle } from 'lucide-react';

// New Components
import CandidateHero from './CandidateHero';
import TabNavigation, { Tab } from './TabNavigation';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import ComplianceWidget from './ComplianceWidget';
import WorkflowProgressWidget from './widgets/WorkflowProgressWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';

// Existing Components
import DocumentManager from './DocumentManager';
import TimelineView from './TimelineView';
import { ComplianceService } from '../services/complianceService';
import { ProfileCompletionService } from '../services/profileCompletionService';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'timeline' | 'ai'>('timeline');

  const refreshCandidate = React.useCallback(() => {
    if (id) {
      setCandidate(CandidateService.getCandidateById(id));
    }
  }, [id]);

  useEffect(() => {
    refreshCandidate();
  }, [refreshCandidate]);

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

    // Log Event
    if (!updatedCandidate.timelineEvents) {
      updatedCandidate.timelineEvents = [];
    }
    updatedCandidate.timelineEvents.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'SYSTEM' as TimelineEventType,
      title: 'Compliance Data Updated',
      description: 'Passport and PCC information has been updated',
      actor: 'System',
      stage: candidate.stage
    });

    // Recalculate profile completion
    updatedCandidate = ProfileCompletionService.updateCompletionData(updatedCandidate);

    CandidateService.updateCandidate(updatedCandidate);
    setCandidate(updatedCandidate);
  };

  // Handle document update
  const handleDocumentUpdate = (updatedDocs: CandidateDocument[]) => {
    if (!candidate) return;

    const updatedCandidate: Candidate = {
      ...candidate,
      documents: updatedDocs,
      timelineEvents: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'DOCUMENT' as TimelineEventType,
          title: 'Documents Updated',
          description: 'Candidate documents have been modified',
          actor: 'System',
          stage: candidate.stage
        },
        ...(candidate.timelineEvents || [])
      ]
    };

    CandidateService.updateCandidate(updatedCandidate);
    setCandidate(updatedCandidate);
  };

  // Handle delete
  const handleDelete = () => {
    if (!candidate) return;
    if (confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      CandidateService.deleteCandidate(candidate.id);
      window.location.href = '/#/candidates';
    }
  };

  // Define tabs
  const tabs: Tab[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText, count: candidate?.documents?.length || 0 },
    { id: 'timeline', label: 'Timeline', icon: History, count: candidate?.timelineEvents?.length || 0 },
    { id: 'ai', label: 'AI Analysis', icon: Bot }
  ];

  // Loading state
  if (!candidate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Loading candidate...</p>
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
                <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>

                {/* Personal Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.name}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIC</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.nic || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date of Birth</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.dob || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gender</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.gender || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.phone}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.email || 'N/A'}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.address || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.location || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="mb-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded" />
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.role || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Experience</label>
                      <div className="text-sm text-slate-900 mt-1">{candidate.experienceYears ? `${candidate.experienceYears} years` : 'N/A'}</div>
                    </div>
                    {candidate.jobRoles && candidate.jobRoles.length > 0 && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Applied Roles</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {candidate.jobRoles.map((role, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                              {role.title} ({role.experienceYears}y)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Family Information */}
                {(candidate.maritalStatus || candidate.numberOfChildren !== undefined) && (
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-600 rounded" />
                      Family Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Marital Status</label>
                        <div className="text-sm text-slate-900 mt-1">{candidate.maritalStatus || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Children</label>
                        <div className="text-sm text-slate-900 mt-1">{candidate.numberOfChildren ?? 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <DocumentManager
                  candidate={candidate}
                  onUpdate={handleDocumentUpdate}
                />
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <TimelineView events={candidate.timelineEvents || []} />
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === 'ai' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">AI Analysis</h2>
                <div className="text-center py-12 text-slate-500">
                  <Bot size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>AI Analysis coming soon!</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (30%) */}
          <div className="space-y-4">
            <QuickActionsWidget candidate={candidate} onDelete={handleDelete} />
            <ComplianceWidget
              passport={candidate.passportData}
              pcc={candidate.pccData}
              stageData={candidate.stageData}
              onUpdate={handleComplianceUpdate}
            />
            <WorkflowProgressWidget candidate={candidate} />
            <RecentActivityWidget candidate={candidate} onViewAll={() => setActiveTab('timeline')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;