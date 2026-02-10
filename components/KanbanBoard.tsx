import React from 'react';
import { MOCK_CANDIDATES } from '../services/mockData';
import { WorkflowStage, StageStatus, Candidate } from '../types';
import { STAGE_ORDER, getSLAStatus } from '../services/workflowEngine';
import { AlertTriangle, Clock, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

const KanbanBoard: React.FC = () => {
  const getCandidatesByStage = (stage: WorkflowStage) => {
    return MOCK_CANDIDATES.filter(c => c.stage === stage);
  };

  const renderCard = (candidate: Candidate) => {
    const sla = getSLAStatus(candidate);
    
    return (
      <div key={candidate.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={candidate.avatarUrl} alt={candidate.name} className="w-8 h-8 rounded-full object-cover" />
            <div>
              <Link to={`/candidates/${candidate.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600">{candidate.name}</Link>
              <p className="text-xs text-slate-500">{candidate.role}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={16} />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
           <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
             candidate.stageStatus === StageStatus.ON_HOLD ? 'bg-orange-100 text-orange-700' :
             candidate.stageStatus === StageStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700' :
             'bg-slate-100 text-slate-600'
           }`}>
             {candidate.stageStatus}
           </span>
           
           {sla.overdue && (
             <div className="flex items-center gap-1 text-red-600" title={`Overdue: ${sla.daysInStage} days (Limit: ${sla.slaLimit})`}>
               <AlertTriangle size={12} />
               <span className="text-[10px] font-bold">{sla.daysInStage}d</span>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pipeline Board</h2>
          <p className="text-slate-500">Drag and drop candidates to move them through the workflow.</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
           <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Critical Delay</div>
           <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-full"></span> Warning</div>
           <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> On Track</div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-4 min-w-[1600px]">
          {STAGE_ORDER.map(stage => (
            <div key={stage} className="flex-1 min-w-[280px] flex flex-col bg-slate-100 rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between items-center sticky top-0">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{stage}</h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {getCandidatesByStage(stage).length}
                </span>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {getCandidatesByStage(stage).map(candidate => renderCard(candidate))}
                {getCandidatesByStage(stage).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                    No Candidates
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;