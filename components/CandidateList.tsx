import React, { useState } from 'react';
import { MOCK_CANDIDATES } from '../services/mockData';
import { Candidate, WorkflowStage, StageStatus, DocumentType, DocumentCategory, DocumentStatus, CandidateDocument } from '../types';
import { Search, Filter, MoreHorizontal, Eye, Star, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import CandidateForm from './CandidateForm';

// Helper function to generate default empty documents for new candidates
const generateRequiredDocs = (): CandidateDocument[] => {
  const docs: CandidateDocument[] = [];
  let idCounter = Date.now();

  const addDoc = (type: DocumentType, category: DocumentCategory) => {
    docs.push({
      id: `doc-${idCounter++}`,
      type,
      category,
      status: DocumentStatus.MISSING,
      version: 0,
      logs: []
    });
  };

  // Mandatory
  addDoc(DocumentType.PASSPORT, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.CV, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.PASSPORT_PHOTOS, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.FULL_PHOTO, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_OL, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_AL, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_LEARNING, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_PROFESSIONAL, DocumentCategory.MANDATORY_REGISTRATION);

  // Later Process
  addDoc(DocumentType.MEDICAL_REPORT, DocumentCategory.LATER_PROCESS);
  addDoc(DocumentType.POLICE_CLEARANCE, DocumentCategory.LATER_PROCESS);
  addDoc(DocumentType.VISA_COPY, DocumentCategory.LATER_PROCESS);
  addDoc(DocumentType.AIR_TICKET, DocumentCategory.LATER_PROCESS);

  return docs;
};

const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [filter, setFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.role.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddCandidate = (formData: any) => {
    let docs = generateRequiredDocs();
    
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

    setCandidates([newCandidate, ...candidates]);
    setIsAddModalOpen(false);
  };

  const getStageColor = (stage: WorkflowStage) => {
    switch (stage) {
      case WorkflowStage.REGISTRATION: return 'bg-blue-100 text-blue-700';
      case WorkflowStage.VERIFICATION: return 'bg-purple-100 text-purple-700';
      case WorkflowStage.JOB_MATCHING: return 'bg-yellow-100 text-yellow-700';
      case WorkflowStage.MEDICAL: return 'bg-orange-100 text-orange-700';
      case WorkflowStage.POLICE: return 'bg-red-100 text-red-700';
      case WorkflowStage.VISA: return 'bg-indigo-100 text-indigo-700';
      case WorkflowStage.TICKET: return 'bg-teal-100 text-teal-700';
      case WorkflowStage.DEPARTURE: return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidates</h2>
          <p className="text-slate-500">Manage and track candidate applications.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 text-sm font-medium transition-all"
          >
            <Plus size={18} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={candidate.avatarUrl} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-slate-800">{candidate.name}</p>
                        <p className="text-xs text-slate-500">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700 font-medium">{candidate.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageColor(candidate.stage)}`}>
                      {candidate.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {candidate.location}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {candidate.experienceYears} Years
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/candidates/${candidate.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={18} />
                      </Link>
                      <button className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                         <Star size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                         <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No candidates found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Mock */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>Showing 1 to {filteredCandidates.length} of {filteredCandidates.length} entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
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
    </div>
  );
};

export default CandidateList;