import { CandidateService } from '../services/candidateService';
import { WorkflowStage, StageStatus, Candidate } from '../types';
import { STAGE_ORDER, getSLAStatus } from '../services/workflowEngine';
import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const KanbanBoard: React.FC = () => {
  const [candidates] = useState<Candidate[]>(() => CandidateService.getCandidates());

  const getColumns = () => {
    return STAGE_ORDER.map(stage => {
      const stageCandidates = candidates.filter(c => c.stage === stage);
      return {
        id: stage,
        title: stage,
        candidates: stageCandidates,
        color: getStageColor(stage)
      };
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case WorkflowStage.REGISTRATION: return 'bg-blue-50 border-blue-200';
      case WorkflowStage.VERIFICATION: return 'bg-purple-50 border-purple-200';
      case WorkflowStage.APPLIED: return 'bg-yellow-50 border-yellow-200';
      case WorkflowStage.OFFER_RECEIVED: return 'bg-orange-50 border-orange-200';
      case WorkflowStage.WP_RECEIVED: return 'bg-pink-50 border-pink-200';
      case WorkflowStage.EMBASSY_APPLIED: return 'bg-indigo-50 border-indigo-200';
      case WorkflowStage.VISA_RECEIVED: return 'bg-violet-50 border-violet-200';
      case WorkflowStage.SLBFE_REGISTRATION: return 'bg-teal-50 border-teal-200';
      case WorkflowStage.TICKET: return 'bg-sky-50 border-sky-200';
      case WorkflowStage.DEPARTURE: return 'bg-green-50 border-green-200';
      default: return 'bg-slate-50 border-slate-200';
    }
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
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${candidate.stageStatus === StageStatus.ON_HOLD ? 'bg-orange-100 text-orange-700' :
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
          {getColumns().map(column => (
            <div key={column.id} className="flex-1 min-w-[280px] flex flex-col bg-slate-100 rounded-xl border border-slate-200">
              <div className={`p-3 border-b border-slate-200 rounded-t-xl flex justify-between items-center sticky top-0 ${column.color}`}>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{column.title}</h3>
                <span className="bg-white/50 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {column.candidates.length}
                </span>
              </div>

              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {column.candidates.map(candidate => renderCard(candidate))}
                {column.candidates.length === 0 && (
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