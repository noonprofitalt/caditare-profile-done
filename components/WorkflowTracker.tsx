import React from 'react';
import { Candidate, WorkflowStage, StageStatus } from '../types';
import { STAGE_ORDER, getSLAStatus, STAGE_REQUIREMENTS, getNextStage } from '../services/workflowEngine';
import { CheckCircle2, Circle, Clock, AlertTriangle, XCircle, ArrowRight, Lock, Unlock, CheckSquare } from 'lucide-react';

interface WorkflowTrackerProps {
  candidate: Candidate;
}

const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ candidate }) => {
  const currentStageIdx = STAGE_ORDER.indexOf(candidate.stage);
  const sla = getSLAStatus(candidate);
  const nextStage = getNextStage(candidate.stage);
  const nextStageRequirements = nextStage ? STAGE_REQUIREMENTS[nextStage] : [];

  const getStepIcon = (stageIdx: number) => {
    if (stageIdx < currentStageIdx) return <CheckCircle2 className="text-green-600" size={24} />;
    if (stageIdx === currentStageIdx) {
      if (candidate.stageStatus === StageStatus.REJECTED) return <XCircle className="text-red-600" size={24} />;
      return <div className="w-6 h-6 rounded-full border-4 border-blue-600 bg-white animate-pulse" />;
    }
    return <Circle className="text-slate-300" size={24} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Workflow Tracker</h3>
          <p className="text-sm text-slate-500">Current Stage: <span className="font-semibold text-blue-600">{candidate.stage}</span></p>
        </div>
        
        {/* SLA Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${sla.overdue ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          {sla.overdue ? <AlertTriangle size={16} /> : <Clock size={16} />}
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider">Time in Stage</p>
            <p className="text-sm font-semibold">{sla.daysInStage} Days <span className="text-xs font-normal opacity-75">/ {sla.slaLimit} Days SLA</span></p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative flex justify-between items-center w-full px-4 mb-10">
        {/* Connecting Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2" />

        {STAGE_ORDER.map((stage, index) => (
          <div key={stage} className="relative flex flex-col items-center group">
            {/* Connecting Line Colored */}
            {index > 0 && (
              <div 
                className={`absolute top-1/2 right-[50%] w-[200%] h-1 -z-10 transform -translate-y-1/2 ${index <= currentStageIdx ? 'bg-green-600' : 'bg-slate-200'}`} 
                style={{ width: '100vw', right: '50%', display: index === 0 ? 'none' : 'block' }} 
              /> 
            )}
            
            <div className={`relative z-10 bg-white p-1 rounded-full ${index === currentStageIdx && sla.overdue ? 'ring-4 ring-red-100' : ''}`}>
              {getStepIcon(index)}
            </div>
            
            <div className="absolute top-10 flex flex-col items-center w-32 text-center">
              <span className={`text-xs font-bold mb-1 ${index === currentStageIdx ? 'text-blue-700' : index < currentStageIdx ? 'text-green-700' : 'text-slate-400'}`}>
                {stage}
              </span>
              {index === currentStageIdx && (
                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    candidate.stageStatus === StageStatus.IN_PROGRESS ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    candidate.stageStatus === StageStatus.ON_HOLD ? 'bg-orange-50 border-orange-200 text-orange-600' :
                    'bg-slate-100 text-slate-600'
                 }`}>
                   {candidate.stageStatus}
                 </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Logic & Requirements Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Context */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-sm text-blue-600">
               <ArrowRight size={16} />
             </div>
             <h4 className="text-sm font-bold text-slate-800">Current Actions</h4>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
             {candidate.stage === WorkflowStage.REGISTRATION && "Verify that all mandatory documents are uploaded and clear."}
             {candidate.stage === WorkflowStage.VERIFICATION && "Review documents for authenticity. Approve or request corrections."}
             {candidate.stage === WorkflowStage.JOB_MATCHING && "Match candidate with open job orders and submit to employers."}
             {candidate.stage === WorkflowStage.MEDICAL && "Schedule medical exam or record results."}
             {candidate.stage === WorkflowStage.POLICE && "Apply for police clearance certificate."}
             {candidate.stage === WorkflowStage.VISA && "Submit visa application to embassy/sponsor."}
             {candidate.stage === WorkflowStage.TICKET && "Collect final payments and book flight."}
             {candidate.stage === WorkflowStage.DEPARTURE && "Final briefing and airport dispatch."}
          </p>
        </div>

        {/* Next Stage Requirements (The "System Logic") */}
        {nextStage && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
             <div className="flex items-center gap-3 mb-3">
               <div className="bg-slate-100 p-1.5 rounded-md border border-slate-200 text-slate-600">
                 <Lock size={16} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-800">To Enter: {nextStage}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Requirements Checklist</p>
               </div>
             </div>
             
             <div className="space-y-2">
               {nextStageRequirements.length > 0 ? (
                 nextStageRequirements.map((req) => {
                   const isMet = req.check(candidate);
                   return (
                     <div key={req.id} className="flex items-center gap-2 text-sm">
                       {isMet ? (
                         <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                       ) : (
                         <Circle size={16} className="text-slate-300 shrink-0" />
                       )}
                       <span className={isMet ? 'text-slate-700 line-through decoration-slate-300' : 'text-slate-600 font-medium'}>
                         {req.label}
                       </span>
                     </div>
                   );
                 })
               ) : (
                 <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                   <Unlock size={16} />
                   <span>No blocking requirements.</span>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTracker;