/**
 * Workflow & Stage Types
 * Core enums and interfaces for the candidate workflow pipeline
 */

export enum JobStatus {
    OPEN = 'Open',
    CLOSED = 'Closed',
    FILLED = 'Filled',
    PENDING = 'Pending Approval',
}

export enum WorkflowStage {
    REGISTERED = 'Registered',
    VERIFIED = 'Verified',
    APPLIED = 'Applied',
    OFFER_RECEIVED = 'Offer Received',
    WP_RECEIVED = 'WP Received',
    EMBASSY_APPLIED = 'Embassy Applied',
    VISA_RECEIVED = 'Visa Received',
    SLBFE_REGISTRATION = 'SLBFE Registration',
    TICKET_ISSUED = 'Ticket Issued',
    DEPARTED = 'Departed',
}

export enum StageStatus {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    ON_HOLD = 'On Hold',
    REJECTED = 'Rejected',
    CANCELLED = 'Cancelled',
}

export enum ProfileCompletionStatus {
    QUICK = 'QUICK',
    PARTIAL = 'PARTIAL',
    COMPLETE = 'COMPLETE'
}

export enum RegistrationSource {
    QUICK_FORM = 'QUICK_FORM',
    FULL_FORM = 'FULL_FORM'
}

export enum MedicalStatus {
    NOT_STARTED = 'Not Started',
    SCHEDULED = 'Scheduled',
    COMPLETED = 'Completed',
    FAILED = 'Failed',
}

export type TimelineEventType = 'STAGE_TRANSITION' | 'STATUS_CHANGE' | 'DOCUMENT' | 'NOTE' | 'ALERT' | 'SYSTEM' | 'MANUAL_OVERRIDE' | 'WORKFLOW';

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    title: string;
    description: string;
    timestamp: string;
    actor: string;
    userId?: string;
    isCritical?: boolean;
    stage?: WorkflowStage;
    metadata?: Record<string, any>;
}

export interface WorkflowLog {
    id: string;
    fromStage: WorkflowStage;
    toStage: WorkflowStage;
    timestamp: string;
    actor: string;
    userId?: string;
    reason?: string;
}

export interface WorkflowMilestones {
    verifiedDate?: string;
    offerAppliedDate?: string;
    offerReceivedDate?: string;
    wpAppliedDate?: string;
    wpReceivedDate?: string;
    embAppliedDate?: string;
    embAppointmentDate?: string;
    stampRejectDate?: string;
    stampResult?: string;
    slbfeTrainingDate?: string;
    slbfeRegistrationDate?: string;
    ticketIssuedDate?: string;
    departureDate?: string;
}

export interface StageHistoryEntry {
    stage: WorkflowStage;
    timestamp: string | Date;
    userId?: string;
    notes?: string;
}

export interface TransitionValidationResult {
    allowed: boolean;
    blockers: string[];
    warnings: string[];
    missingDocuments: string[];
    complianceIssues: string[];
}

export interface WorkflowTransitionEvent {
    id: string;
    candidateId: string;
    fromStage: WorkflowStage;
    toStage: WorkflowStage;
    transitionType: 'FORWARD' | 'ROLLBACK';
    timestamp: Date;
    userId: string;
    reason?: string;
    validationResult: TransitionValidationResult;
    slaStatus: 'ON_TIME' | 'OVERDUE';
    daysInPreviousStage: number;
}

export interface SLAStatus {
    stage: WorkflowStage;
    enteredAt: Date;
    slaDeadline: Date;
    daysElapsed: number;
    daysRemaining: number;
    slaDays: number;
    status: 'ON_TIME' | 'WARNING' | 'OVERDUE';
    percentageElapsed: number;
}
