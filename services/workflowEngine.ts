import { Candidate, WorkflowStage, StageStatus, DocumentCategory, DocumentStatus, StageData } from '../types';

// SLA Configuration (in days)
export const SLA_CONFIG: Record<WorkflowStage, number> = {
  [WorkflowStage.REGISTRATION]: 2,
  [WorkflowStage.VERIFICATION]: 2,
  [WorkflowStage.JOB_MATCHING]: 5,
  [WorkflowStage.MEDICAL]: 3,
  [WorkflowStage.POLICE]: 7,
  [WorkflowStage.VISA]: 14,
  [WorkflowStage.TICKET]: 2,
  [WorkflowStage.DEPARTURE]: 1,
};

// Stage Sequencing
export const STAGE_ORDER = [
  WorkflowStage.REGISTRATION,
  WorkflowStage.VERIFICATION,
  WorkflowStage.JOB_MATCHING,
  WorkflowStage.MEDICAL,
  WorkflowStage.POLICE,
  WorkflowStage.VISA,
  WorkflowStage.TICKET,
  WorkflowStage.DEPARTURE,
];

// DATA DRIVEN LOGIC: The "System Logic" pulled out into a configuration
export interface Requirement {
  id: string;
  label: string;
  check: (c: Candidate) => boolean;
}

export const STAGE_REQUIREMENTS: Record<WorkflowStage, Requirement[]> = {
  [WorkflowStage.REGISTRATION]: [], // Entry point
  
  [WorkflowStage.VERIFICATION]: [
    {
      id: 'req-docs-reg',
      label: "All Mandatory Registration Docs Uploaded",
      check: (c) => {
        const mandatoryDocs = c.documents.filter(d => d.category === DocumentCategory.MANDATORY_REGISTRATION);
        return !mandatoryDocs.some(d => d.status === DocumentStatus.MISSING || d.status === DocumentStatus.REJECTED);
      }
    }
  ],

  [WorkflowStage.JOB_MATCHING]: [
    {
      id: 'req-docs-verify',
      label: "Registration Docs Approved",
      check: (c) => {
        const mandatoryDocs = c.documents.filter(d => d.category === DocumentCategory.MANDATORY_REGISTRATION);
        return !mandatoryDocs.some(d => d.status !== DocumentStatus.APPROVED);
      }
    }
  ],

  [WorkflowStage.MEDICAL]: [
    {
      id: 'req-emp-select',
      label: "Candidate Selected by Employer",
      check: (c) => c.stageData.employerStatus === 'Selected'
    }
  ],

  [WorkflowStage.POLICE]: [
    {
      id: 'req-med-status',
      label: "Medical Not Failed",
      check: (c) => c.stageData.medicalStatus !== 'Failed'
    }
  ],

  [WorkflowStage.VISA]: [
    {
      id: 'req-med-clear',
      label: "Medical Cleared",
      check: (c) => c.stageData.medicalStatus === 'Cleared'
    },
    {
      id: 'req-pol-issue',
      label: "Police Clearance Issued",
      check: (c) => c.stageData.policeStatus === 'Issued'
    }
  ],

  [WorkflowStage.TICKET]: [
    {
      id: 'req-visa-approve',
      label: "Visa Approved",
      check: (c) => c.stageData.visaStatus === 'Approved'
    },
    {
      id: 'req-pay-start',
      label: "Initial Payments Received",
      check: (c) => c.stageData.paymentStatus !== 'Pending'
    }
  ],

  [WorkflowStage.DEPARTURE]: [
    {
      id: 'req-tick-issue',
      label: "Flight Ticket Issued",
      check: (c) => c.stageData.ticketStatus === 'Issued'
    }
  ]
};

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

export const getSLAStatus = (candidate: Candidate): { overdue: boolean; daysInStage: number; slaLimit: number } => {
  const entered = new Date(candidate.stageEnteredAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - entered.getTime());
  const daysInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const limit = SLA_CONFIG[candidate.stage];
  
  return {
    overdue: daysInStage > limit,
    daysInStage,
    slaLimit: limit
  };
};

// The Core Rule Engine - Now powered by STAGE_REQUIREMENTS
export const validateTransition = (candidate: Candidate, targetStage: WorkflowStage): TransitionResult => {
  const currentStageIndex = STAGE_ORDER.indexOf(candidate.stage);
  const targetStageIndex = STAGE_ORDER.indexOf(targetStage);

  // 1. Basic Flow Validation (Sequence)
  if (targetStageIndex === currentStageIndex) return { allowed: true };
  if (targetStageIndex < currentStageIndex) return { allowed: true, reason: "Rolling back to previous stage." };
  if (targetStageIndex > currentStageIndex + 1) return { allowed: false, reason: "Cannot skip stages. Workflow is sequential." };

  // 2. Data-Driven Requirement Checks
  const requirements = STAGE_REQUIREMENTS[targetStage] || [];
  
  for (const req of requirements) {
    if (!req.check(candidate)) {
      return { allowed: false, reason: req.label };
    }
  }

  return { allowed: true };
};

export const getNextStage = (current: WorkflowStage): WorkflowStage | null => {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
};

export const getPreviousStage = (current: WorkflowStage): WorkflowStage | null => {
  const idx = STAGE_ORDER.indexOf(current);
  return idx > 0 ? STAGE_ORDER[idx - 1] : null;
};