/**
 * Enterprise Workflow Engine v2.0
 * Finite State Machine (FSM) Implementation
 * 
 * Purpose: Strict workflow control for Foreign Employment Agency
 * Features: Sequential transitions, compliance enforcement, SLA tracking, rollback support
 */

import { Candidate, WorkflowStage, PassportStatus, PCCStatus, MedicalStatus, DocumentStatus, DocumentCategory } from '../types';
import { ComplianceEngine } from './compliance/ComplianceEngine';
import { ComplianceSeverity } from './compliance/ComplianceTypes';

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

/**
 * Workflow Stage Definitions
 * Strict sequential order - no skipping allowed
 */
export const WORKFLOW_STAGES: WorkflowStage[] = [
    WorkflowStage.REGISTERED,
    WorkflowStage.VERIFIED,
    WorkflowStage.APPLIED,
    WorkflowStage.OFFER_RECEIVED,
    WorkflowStage.WP_RECEIVED,
    WorkflowStage.EMBASSY_APPLIED,
    WorkflowStage.VISA_RECEIVED,
    WorkflowStage.SLBFE_REGISTRATION,
    WorkflowStage.TICKET_ISSUED,
    WorkflowStage.DEPARTED
];

/**
 * SLA Configuration (in days)
 * Defines expected duration for each stage
 */
export const SLA_CONFIG: Record<WorkflowStage, number> = {
    [WorkflowStage.REGISTERED]: 2,           // 2 days to verify
    [WorkflowStage.VERIFIED]: 7,             // 7 days to apply
    [WorkflowStage.APPLIED]: 14,             // 14 days to get offer
    [WorkflowStage.OFFER_RECEIVED]: 7,       // 7 days to get WP
    [WorkflowStage.WP_RECEIVED]: 14,         // 14 days to apply embassy
    [WorkflowStage.EMBASSY_APPLIED]: 21,     // 21 days to get visa
    [WorkflowStage.VISA_RECEIVED]: 7,        // 7 days to register SLBFE
    [WorkflowStage.SLBFE_REGISTRATION]: 5,   // 5 days to issue ticket
    [WorkflowStage.TICKET_ISSUED]: 3,        // 3 days to depart
    [WorkflowStage.DEPARTED]: 0              // Final stage
};

/**
 * Transition Validation Result
 */
export interface TransitionValidationResult {
    allowed: boolean;
    blockers: string[];
    warnings: string[];
    missingDocuments: string[];
    complianceIssues: string[];
}

/**
 * Workflow Transition Event
 */
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

/**
 * SLA Status
 */
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

// ============================================================================
// WORKFLOW ENGINE CLASS
// ============================================================================

export class WorkflowEngine {

    /**
     * Get the next stage in the workflow
     */
    static getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
        const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
        if (currentIndex === -1 || currentIndex === WORKFLOW_STAGES.length - 1) {
            return null; // Invalid stage or final stage
        }
        return WORKFLOW_STAGES[currentIndex + 1];
    }

    /**
     * Get the previous stage in the workflow
     */
    static getPreviousStage(currentStage: WorkflowStage): WorkflowStage | null {
        const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
        if (currentIndex <= 0) {
            return null; // First stage or invalid
        }
        return WORKFLOW_STAGES[currentIndex - 1];
    }

    /**
     * Check if a transition is sequential (forward by 1 or backward)
     */
    static isSequentialTransition(fromStage: WorkflowStage, toStage: WorkflowStage): boolean {
        const fromIndex = WORKFLOW_STAGES.indexOf(fromStage);
        const toIndex = WORKFLOW_STAGES.indexOf(toStage);

        if (fromIndex === -1 || toIndex === -1) return false;

        // Allow forward by 1 or any backward movement
        return toIndex === fromIndex + 1 || toIndex < fromIndex;
    }

    /**
     * Validate transition from REGISTERED to VERIFIED
     */
    private static validateRegisteredToVerified(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check passport document
        const passportDoc = candidate.documents?.find(
            d => d.category === DocumentCategory.MANDATORY_REGISTRATION &&
                d.type.toLowerCase().includes('passport')
        );

        if (!passportDoc) {
            missingDocuments.push('Passport document');
            blockers.push('Passport document not uploaded');
        } else if (passportDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Passport document status is ${passportDoc.status}, must be APPROVED`);
        }

        // Check CV document
        const cvDoc = candidate.documents?.find(
            d => d.category === DocumentCategory.MANDATORY_REGISTRATION &&
                d.type.toLowerCase().includes('cv')
        );

        if (!cvDoc) {
            missingDocuments.push('CV/Resume document');
            blockers.push('CV/Resume document not uploaded');
        } else if (cvDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`CV document status is ${cvDoc.status}, must be APPROVED`);
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from VERIFIED to APPLIED
     */
    private static validateVerifiedToApplied(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check profile completeness (≥ 90%)
        const completionPercentage = candidate.profileCompletionPercentage || 0;
        if (completionPercentage < 90) {
            blockers.push(`Profile completion is ${completionPercentage}%, must be ≥ 90%`);
        }

        // Check education
        if (!candidate.education || candidate.education.length === 0) {
            blockers.push('Educational qualifications not completed');
        }

        // Check job role
        if (!candidate.jobRoles || candidate.jobRoles.length === 0) {
            blockers.push('Job roles not specified');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from APPLIED to OFFER_RECEIVED
     */
    private static validateAppliedToOfferReceived(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check offer letter document
        const offerDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('offer') &&
                d.type.toLowerCase().includes('letter')
        );

        if (!offerDoc) {
            missingDocuments.push('Offer Letter');
            blockers.push('Offer letter not uploaded');
        } else if (offerDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Offer letter status is ${offerDoc.status}, must be APPROVED`);
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from OFFER_RECEIVED to WP_RECEIVED
     */
    private static validateOfferReceivedToWpReceived(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check signed offer document
        const signedOfferDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('signed') &&
                d.type.toLowerCase().includes('offer')
        );

        if (!signedOfferDoc) {
            missingDocuments.push('Signed Offer Letter');
            blockers.push('Signed offer letter not uploaded');
        } else if (signedOfferDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Signed offer status is ${signedOfferDoc.status}, must be APPROVED`);
        }

        // Check employer confirmation
        if (!candidate.employerId) {
            blockers.push('Employer not confirmed');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from WP_RECEIVED to EMBASSY_APPLIED
     * CRITICAL: Passport, PCC, Medical compliance required
     */
    private static validateWpReceivedToEmbassyApplied(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check Passport Status
        if (!candidate.passportData) {
            complianceIssues.push('Passport data not entered');
            blockers.push('Passport information missing');
        } else if (candidate.passportData.status !== PassportStatus.VALID) {
            complianceIssues.push(`Passport status is ${candidate.passportData.status}`);
            blockers.push('Passport must be VALID (≥ 180 days validity)');
        }

        // Check PCC Status
        if (!candidate.pccData) {
            complianceIssues.push('PCC data not entered');
            blockers.push('Police Clearance Certificate (PCC) information missing');
        } else if (candidate.pccData.status !== PCCStatus.VALID) {
            complianceIssues.push(`PCC status is ${candidate.pccData.status}`);
            blockers.push('PCC must be VALID (≤ 180 days old)');
        }

        // Check Medical Status
        const medicalStatus = candidate.stageData?.medicalStatus;
        if (!medicalStatus) {
            complianceIssues.push('Medical status not set');
            blockers.push('Medical examination status not recorded');
        } else if (medicalStatus !== MedicalStatus.COMPLETED) {
            complianceIssues.push(`Medical status is ${medicalStatus}`);
            blockers.push('Medical examination must be COMPLETED');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from EMBASSY_APPLIED to VISA_RECEIVED
     */
    private static validateEmbassyAppliedToVisaReceived(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check embassy submission confirmation
        const embassyDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('embassy') &&
                d.type.toLowerCase().includes('submission')
        );

        if (!embassyDoc) {
            missingDocuments.push('Embassy Submission Confirmation');
            warnings.push('Embassy submission document not uploaded (recommended)');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from VISA_RECEIVED to SLBFE_REGISTRATION
     */
    private static validateVisaReceivedToSlbfeRegistration(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check visa document
        const visaDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('visa')
        );

        if (!visaDoc) {
            missingDocuments.push('Visa Document');
            blockers.push('Visa document not uploaded');
        } else if (visaDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Visa document status is ${visaDoc.status}, must be APPROVED`);
        }

        // Check agreement document
        const agreementDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('agreement') ||
                d.type.toLowerCase().includes('contract')
        );

        if (!agreementDoc) {
            missingDocuments.push('Employment Agreement');
            blockers.push('Employment agreement not uploaded');
        } else if (agreementDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Agreement status is ${agreementDoc.status}, must be APPROVED`);
        }

        // Re-check Medical and PCC validity
        if (candidate.stageData?.medicalStatus !== MedicalStatus.COMPLETED) {
            complianceIssues.push('Medical examination not completed');
            blockers.push('Medical must still be COMPLETED');
        }

        if (candidate.pccData?.status !== PCCStatus.VALID) {
            complianceIssues.push('PCC expired or invalid');
            blockers.push('PCC must still be VALID');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from SLBFE_REGISTRATION to TICKET_ISSUED
     */
    private static validateSlbfeRegistrationToTicketIssued(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check SLBFE number
        if (!candidate.slbfeData?.registrationNumber) {
            blockers.push('SLBFE registration number not entered');
        }

        // Check insurance document
        const insuranceDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('insurance')
        );

        if (!insuranceDoc) {
            missingDocuments.push('Insurance Document');
            blockers.push('Insurance document not uploaded');
        } else if (insuranceDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Insurance status is ${insuranceDoc.status}, must be APPROVED`);
        }

        // Check training completion
        if (!candidate.slbfeData?.trainingDate) {
            blockers.push('SLBFE training not completed');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Validate transition from TICKET_ISSUED to DEPARTED
     */
    private static validateTicketIssuedToDeparted(candidate: Candidate): TransitionValidationResult {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const missingDocuments: string[] = [];
        const complianceIssues: string[] = [];

        // Check ticket document
        const ticketDoc = candidate.documents?.find(
            d => d.type.toLowerCase().includes('ticket') ||
                d.type.toLowerCase().includes('flight')
        );

        if (!ticketDoc) {
            missingDocuments.push('Flight Ticket');
            blockers.push('Flight ticket not uploaded');
        } else if (ticketDoc.status !== DocumentStatus.APPROVED) {
            blockers.push(`Ticket status is ${ticketDoc.status}, must be APPROVED`);
        }

        // Final compliance check
        if (candidate.passportData?.status !== PassportStatus.VALID) {
            complianceIssues.push('Passport not valid');
            blockers.push('Final compliance check: Passport must be VALID');
        }

        if (candidate.pccData?.status !== PCCStatus.VALID) {
            complianceIssues.push('PCC not valid');
            blockers.push('Final compliance check: PCC must be VALID');
        }

        if (candidate.stageData?.medicalStatus !== MedicalStatus.COMPLETED) {
            complianceIssues.push('Medical not completed');
            blockers.push('Final compliance check: Medical must be COMPLETED');
        }

        return {
            allowed: blockers.length === 0,
            blockers,
            warnings,
            missingDocuments,
            complianceIssues
        };
    }

    /**
     * Master validation function - routes to specific validators
     */
    static validateTransition(candidate: Candidate, toStage: WorkflowStage): TransitionValidationResult {
        const fromStage = candidate.stage;

        // Check if transition is sequential
        if (!this.isSequentialTransition(fromStage, toStage)) {
            return {
                allowed: false,
                blockers: ['Non-sequential transition not allowed. Stages must be completed in order.'],
                warnings: [],
                missingDocuments: [],
                complianceIssues: []
            };
        }

        // If backward (rollback), allow with reason
        const fromIndex = WORKFLOW_STAGES.indexOf(fromStage);
        const toIndex = WORKFLOW_STAGES.indexOf(toStage);
        if (toIndex < fromIndex) {
            return {
                allowed: true,
                blockers: [],
                warnings: ['This is a rollback. Reason must be provided.'],
                missingDocuments: [],
                complianceIssues: []
            };
        }

        // --- GLOBAL COMPLIANCE CHECK ---
        const complianceReport = ComplianceEngine.evaluateCandidate(candidate);
        const globalBlockers: string[] = [];

        for (const result of complianceReport.results) {
            // Check only CRITICAL issues that have not passed
            if (!result.passed && result.issue?.severity === ComplianceSeverity.CRITICAL) {
                // Check if this issue blocks the TARGET stage
                if (result.issue.blockingStages.includes(toStage)) {
                    globalBlockers.push(`[COMPLIANCE] ${result.issue.message}`);
                }
            }
        }

        if (globalBlockers.length > 0) {
            return {
                allowed: false,
                blockers: globalBlockers,
                warnings: [],
                missingDocuments: [],
                complianceIssues: globalBlockers // Categorize as compliance issues
            };
        }
        // -----------------------------

        // Forward validation - route to specific validator
        const transitionKey = `${fromStage}_TO_${toStage}`;

        switch (transitionKey) {
            case `${WorkflowStage.REGISTERED}_TO_${WorkflowStage.VERIFIED}`:
                return this.validateRegisteredToVerified(candidate);

            case `${WorkflowStage.VERIFIED}_TO_${WorkflowStage.APPLIED}`:
                return this.validateVerifiedToApplied(candidate);

            case `${WorkflowStage.APPLIED}_TO_${WorkflowStage.OFFER_RECEIVED}`:
                return this.validateAppliedToOfferReceived(candidate);

            case `${WorkflowStage.OFFER_RECEIVED}_TO_${WorkflowStage.WP_RECEIVED}`:
                return this.validateOfferReceivedToWpReceived(candidate);

            case `${WorkflowStage.WP_RECEIVED}_TO_${WorkflowStage.EMBASSY_APPLIED}`:
                return this.validateWpReceivedToEmbassyApplied(candidate);

            case `${WorkflowStage.EMBASSY_APPLIED}_TO_${WorkflowStage.VISA_RECEIVED}`:
                return this.validateEmbassyAppliedToVisaReceived(candidate);

            case `${WorkflowStage.VISA_RECEIVED}_TO_${WorkflowStage.SLBFE_REGISTRATION}`:
                return this.validateVisaReceivedToSlbfeRegistration(candidate);

            case `${WorkflowStage.SLBFE_REGISTRATION}_TO_${WorkflowStage.TICKET_ISSUED}`:
                return this.validateSlbfeRegistrationToTicketIssued(candidate);

            case `${WorkflowStage.TICKET_ISSUED}_TO_${WorkflowStage.DEPARTED}`:
                return this.validateTicketIssuedToDeparted(candidate);

            default:
                return {
                    allowed: false,
                    blockers: ['Invalid stage transition'],
                    warnings: [],
                    missingDocuments: [],
                    complianceIssues: []
                };
        }
    }

    /**
     * Calculate SLA status for current stage
     */
    static calculateSLAStatus(candidate: Candidate): SLAStatus {
        const stage = candidate.stage;
        const stageHistory = candidate.stageHistory || [];

        // Find when current stage was entered (Safely handle potentially invalid history timestamps)
        const stageEntry = stageHistory
            .filter(h => h && h.stage === stage && h.timestamp)
            .sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
            })[0];

        const enteredAt = (stageEntry && stageEntry.timestamp) ? new Date(stageEntry.timestamp) : (candidate.stageEnteredAt ? new Date(candidate.stageEnteredAt) : new Date());
        const safeEnteredAt = isNaN(enteredAt.getTime()) ? new Date() : enteredAt;
        const now = new Date();
        const slaDays = (this as any).SLA_CONFIG?.[stage] || 7; // Fallback to 7 days if config missing
        const slaDeadline = new Date(safeEnteredAt);
        slaDeadline.setDate(slaDeadline.getDate() + slaDays);

        const timeDiff = now.getTime() - safeEnteredAt.getTime();
        const daysElapsed = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.floor((slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const percentageElapsed = slaDays > 0 ? (daysElapsed / slaDays) * 100 : 0;

        let status: 'ON_TIME' | 'WARNING' | 'OVERDUE';
        if (daysRemaining < 0) {
            status = 'OVERDUE';
        } else if (percentageElapsed >= 80) {
            status = 'WARNING';
        } else {
            status = 'ON_TIME';
        }

        return {
            stage,
            enteredAt: safeEnteredAt,
            slaDeadline,
            daysElapsed,
            daysRemaining,
            slaDays,
            status,
            percentageElapsed: isNaN(percentageElapsed) ? 0 : Math.round(percentageElapsed)
        };
    }

    /**
     * Perform workflow transition (forward or rollback)
     */
    static performTransition(
        candidate: Candidate,
        toStage: WorkflowStage,
        userId: string,
        reason?: string
    ): { success: boolean; event?: WorkflowTransitionEvent; error?: string } {
        const fromStage = candidate.stage;

        // Validate transition
        const validationResult = this.validateTransition(candidate, toStage);

        // Determine if rollback
        const fromIndex = WORKFLOW_STAGES.indexOf(fromStage);
        const toIndex = WORKFLOW_STAGES.indexOf(toStage);
        const isRollback = toIndex < fromIndex;

        // For rollback, require reason
        if (isRollback && !reason) {
            return {
                success: false,
                error: 'Rollback requires a reason'
            };
        }

        // For forward, check validation
        if (!isRollback && !validationResult.allowed) {
            return {
                success: false,
                error: `Transition blocked: ${validationResult.blockers.join(', ')}`
            };
        }

        // Calculate SLA status
        const slaStatus = this.calculateSLAStatus(candidate);
        const daysInPreviousStage = slaStatus.daysElapsed;

        // Create transition event
        const event: WorkflowTransitionEvent = {
            id: `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            candidateId: candidate.id,
            fromStage,
            toStage,
            transitionType: isRollback ? 'ROLLBACK' : 'FORWARD',
            timestamp: new Date(),
            userId,
            reason,
            validationResult,
            slaStatus: slaStatus.status === 'OVERDUE' ? 'OVERDUE' : 'ON_TIME',
            daysInPreviousStage
        };

        return {
            success: true,
            event
        };
    }

    /**
     * Get all overdue candidates
     */
    static getOverdueCandidates(candidates: Candidate[]): Array<{ candidate: Candidate; sla: SLAStatus }> {
        return candidates
            .map(candidate => ({
                candidate,
                sla: this.calculateSLAStatus(candidate)
            }))
            .filter(item => item.sla.status === 'OVERDUE');
    }

    /**
     * Get workflow progress percentage
     */
    static getWorkflowProgress(stage: WorkflowStage): number {
        const index = WORKFLOW_STAGES.indexOf(stage);
        if (index === -1) return 0;
        return Math.round((index / (WORKFLOW_STAGES.length - 1)) * 100);
    }

    /**
     * Get remaining stages
     */
    static getRemainingStages(currentStage: WorkflowStage): WorkflowStage[] {
        const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
        if (currentIndex === -1) return [];
        return WORKFLOW_STAGES.slice(currentIndex + 1);
    }
}

export default WorkflowEngine;
