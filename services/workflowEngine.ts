import { Candidate, WorkflowStage, StageStatus, DocumentCategory, DocumentStatus, StageData } from '../types';
import { ComplianceService } from './complianceService';

// SLA Configuration (in days)
export const SLA_CONFIG: Record<WorkflowStage, number> = {
  [WorkflowStage.REGISTRATION]: 2,
  [WorkflowStage.VERIFICATION]: 2,
  [WorkflowStage.APPLIED]: 5,
  [WorkflowStage.OFFER_RECEIVED]: 7,
  [WorkflowStage.WP_RECEIVED]: 14,
  [WorkflowStage.EMBASSY_APPLIED]: 1,
  [WorkflowStage.VISA_RECEIVED]: 7,
  [WorkflowStage.SLBFE_REGISTRATION]: 3,
  [WorkflowStage.TICKET]: 2,
  [WorkflowStage.DEPARTURE]: 1,
};

// Stage Sequencing
export const STAGE_ORDER = [
  WorkflowStage.REGISTRATION,
  WorkflowStage.VERIFICATION,
  WorkflowStage.APPLIED,
  WorkflowStage.OFFER_RECEIVED,
  WorkflowStage.WP_RECEIVED,
  WorkflowStage.EMBASSY_APPLIED,
  WorkflowStage.VISA_RECEIVED,
  WorkflowStage.SLBFE_REGISTRATION,
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
      label: "Passport & CV Uploaded",
      check: (c) => {
        const passport = c.documents.find(d => d.type === 'Valid Passport' || d.type.includes('Passport'));
        const cv = c.documents.find(d => d.type === 'Updated CV' || d.type.includes('CV'));
        return !!passport && passport.status !== DocumentStatus.MISSING && !!cv && cv.status !== DocumentStatus.MISSING;
      }
    }
  ],

  [WorkflowStage.APPLIED]: [
    {
      id: 'req-verified',
      label: "Candidate Verified",
      check: (c) => c.stage === WorkflowStage.VERIFICATION // Implicit, but good to check status if we had one
    }
  ],

  [WorkflowStage.OFFER_RECEIVED]: [
    {
      id: 'req-applied',
      label: "Must have applied to job",
      check: (c) => true // Can be stricter if we track 'Job Application' events
    }
  ],

  [WorkflowStage.WP_RECEIVED]: [
    {
      id: 'req-offer-signed',
      label: "Offer Letter Signed & Uploaded",
      check: (c) => {
        // Mock check for now, ideally check for specific 'Offer Letter' doc type
        return true;
      }
    }
  ],

  [WorkflowStage.EMBASSY_APPLIED]: [
    {
      id: 'req-wp-approve',
      label: "Work Permit / Quota Approved",
      check: (c) => true
    },
    {
      id: 'req-compliance',
      label: "Passport & PCC Compliance",
      check: (c) => {
        const { allowed } = ComplianceService.isCompliant(c.passportData, c.pccData);
        return allowed;
      }
    }
  ],

  [WorkflowStage.VISA_RECEIVED]: [
    {
      id: 'req-visa-lodge',
      label: "Visa Lodgement Completed",
      check: (c) => true
    },
    {
      id: 'req-compliance',
      label: "Passport & PCC Compliance",
      check: (c) => {
        const { allowed } = ComplianceService.isCompliant(c.passportData, c.pccData);
        return allowed;
      }
    }
  ],

  [WorkflowStage.SLBFE_REGISTRATION]: [
    {
      id: 'req-visa-valid',
      label: "Valid Visa Received",
      check: (c) => true
    },
    {
      id: 'req-agreement',
      label: "Service Agreement Signed",
      check: (c) => true
    },
    {
      id: 'req-compliance',
      label: "Strict Compliance Check (Passport/PCC)",
      check: (c) => {
        // Strict check before potential deployment registration
        const { allowed } = ComplianceService.isCompliant(c.passportData, c.pccData);
        return allowed;
      }
    }
  ],

  [WorkflowStage.TICKET]: [
    {
      id: 'req-slbfe-finish',
      label: "SLBFE Registration & Training Complete",
      check: (c) => true
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
