/**
 * Enterprise Workflow Engine v2.0
 * Finite State Machine (FSM) Implementation
 * 
 * Purpose: Strict workflow control for Foreign Employment Agency
 * Features: Sequential transitions, compliance enforcement, SLA tracking, rollback support
 */

import { Candidate, WorkflowStage, PassportStatus, PCCStatus, MedicalStatus, DocumentStatus, DocumentCategory, DocumentType } from '../types';
import { ComplianceEngine } from './compliance/ComplianceEngine';
import { ComplianceSeverity } from './compliance/ComplianceTypes';
import { SLBFEAutomationEngine } from './slbfe/SLBFEEngine';
import { TemplateService } from './templateService';
import { AuditService } from './auditService';

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

// Alias for backward compatibility
export const STAGE_ORDER = WORKFLOW_STAGES;

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

    // Check passport document (enum-based)
    const passportDoc = candidate.documents?.find(
      d => d.type === DocumentType.PASSPORT
    );

    if (!passportDoc) {
      missingDocuments.push('Passport document');
      blockers.push('Passport document not uploaded');
    } else if (passportDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`Passport document status is ${passportDoc.status}, must be APPROVED`);
    }

    // Check CV document (enum-based)
    const cvDoc = candidate.documents?.find(
      d => d.type === DocumentType.CV
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

    // Check offer letter document (enum-based)
    const offerDoc = candidate.documents?.find(
      d => d.type === DocumentType.OFFER_LETTER
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

    // Check signed offer document (enum-based)
    const signedOfferDoc = candidate.documents?.find(
      d => d.type === DocumentType.SIGNED_OFFER_LETTER
    );

    if (!signedOfferDoc) {
      missingDocuments.push('Signed Offer Letter');
      blockers.push('Signed offer letter not uploaded');
    } else if (signedOfferDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`Signed offer status is ${signedOfferDoc.status}, must be APPROVED`);
    }

    // Check IGI Records
    const igiDoc = candidate.documents?.find(
      d => d.type === DocumentType.IGI_RECORDS
    );
    if (!igiDoc) {
      missingDocuments.push('IGI Records');
      warnings.push('IGI Records not uploaded (recommended)');
    }

    // Check Work Permit
    const wpDoc = candidate.documents?.find(
      d => d.type === DocumentType.WORK_PERMIT
    );
    if (!wpDoc) {
      missingDocuments.push('Work Permit (WP)');
      blockers.push('Work Permit document not uploaded');
    } else if (wpDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`Work Permit status is ${wpDoc.status}, must be APPROVED`);
    }

    // Check WP Reference Number in system data
    if (!candidate.stageData?.wpReferenceNumber) {
      warnings.push('WP Reference Number not entered in system data');
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
   * CRITICAL: Passport, PCC, Medical compliance required (Hard Stops)
   */
  private static validateWpReceivedToEmbassyApplied(candidate: Candidate): TransitionValidationResult {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const missingDocuments: string[] = [];
    const complianceIssues: string[] = [];

    // 1. Check Passport Status (Hard Stop)
    const passport = candidate.passportData || (candidate.passports && candidate.passports.length > 0 ? candidate.passports[0] : null);
    if (!passport) {
      complianceIssues.push('Passport data not entered');
      blockers.push('Passport information is missing or not entered');
    } else if (passport.status !== PassportStatus.VALID) {
      complianceIssues.push(`Passport status is ${passport.status}`);
      blockers.push('Passport must be VALID (≥ 180 days validity) to apply at Embassy');
    }

    // 2. Check PCC Status (Hard Stop - 180-day flag)
    if (!candidate.pccData) {
      complianceIssues.push('PCC data not entered');
      blockers.push('Police Clearance Certificate (PCC) information is missing');
    } else if (candidate.pccData.status !== PCCStatus.VALID) {
      complianceIssues.push(`PCC status is ${candidate.pccData.status}`);
      blockers.push('PCC must be VALID (≤ 180 days old) for Embassy submission');
    }

    // 3. Check Medical Status (Hard Stop)
    const medicalStatus = candidate.medicalData?.status || candidate.stageData?.medicalStatus;
    if (!medicalStatus) {
      complianceIssues.push('Medical status not set');
      blockers.push('Medical examination status not recorded');
    } else if (medicalStatus !== MedicalStatus.COMPLETED) {
      complianceIssues.push(`Medical status is ${medicalStatus}`);
      blockers.push('Medical examination must be COMPLETED before Embassy submission');
    }

    // 4. Check Work Permit document (enum-based)
    const wpDoc = candidate.documents?.find(d => d.type === DocumentType.WORK_PERMIT && d.status === DocumentStatus.APPROVED);
    if (!wpDoc) {
      missingDocuments.push('Approved Work Permit');
      blockers.push('Approved Work Permit document is required');
    }

    // 5. Check Vaccination Records
    const vacDoc = candidate.documents?.find(d => d.type === DocumentType.VACCINATION_RECORDS);
    if (!vacDoc) {
      missingDocuments.push('Vaccination Records');
      warnings.push('Vaccination records not uploaded (may be required)');
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

    // Check Embassy Appointment Letter
    const appointmentDoc = candidate.documents?.find(
      d => d.type === DocumentType.EMBASSY_APPOINTMENT_LETTER
    );
    if (!appointmentDoc) {
      missingDocuments.push('Embassy Appointment Letter');
      warnings.push('Embassy appointment letter not uploaded (recommended)');
    }

    // Check USD Payment Receipt
    const usdDoc = candidate.documents?.find(
      d => d.type === DocumentType.USD_PAYMENT_RECEIPT
    );
    if (!usdDoc) {
      missingDocuments.push('USD Payment Receipt');
      blockers.push('Embassy USD payment receipt not uploaded');
    } else if (usdDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`USD Payment Receipt status is ${usdDoc.status}, must be APPROVED`);
    }

    // Europe-specific: D-Form and Travel Insurance
    const targetCountry = candidate.targetCountry || candidate.country;
    if (targetCountry && TemplateService.isSchengenCountry(targetCountry)) {
      // D-Form required for Schengen countries
      const dFormDoc = candidate.documents?.find(
        d => d.type === DocumentType.D_FORM
      );
      if (!dFormDoc) {
        missingDocuments.push('D-Form (National Visa Application)');
        blockers.push('D-Form is required for Schengen country visa applications');
      } else if (dFormDoc.status !== DocumentStatus.APPROVED) {
        blockers.push(`D-Form status is ${dFormDoc.status}, must be APPROVED`);
      }

      // Travel Insurance required for Schengen
      const insuranceDoc = candidate.documents?.find(
        d => d.type === DocumentType.TRAVEL_INSURANCE
      );
      if (!insuranceDoc) {
        missingDocuments.push('Travel Insurance (Schengen)');
        blockers.push('Schengen travel insurance is required for European visa');
      } else if (insuranceDoc.status !== DocumentStatus.APPROVED) {
        blockers.push(`Travel Insurance status is ${insuranceDoc.status}, must be APPROVED`);
      }
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

    // Check visa document (enum-based)
    const visaDoc = candidate.documents?.find(
      d => d.type === DocumentType.VISA_COPY
    );

    if (!visaDoc) {
      missingDocuments.push('Visa Document');
      blockers.push('Visa document not uploaded');
    } else if (visaDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`Visa document status is ${visaDoc.status}, must be APPROVED`);
    }

    // Re-check Medical and PCC validity (Hard Stops)
    const medicalStatus = candidate.medicalData?.status || candidate.stageData?.medicalStatus;
    if (medicalStatus !== MedicalStatus.COMPLETED) {
      complianceIssues.push('Medical examination not completed');
      blockers.push('Medical must still be COMPLETED for SLBFE registration');
    }

    if (candidate.pccData?.status !== PCCStatus.VALID) {
      complianceIssues.push('PCC expired or invalid');
      blockers.push('PCC must still be VALID for SLBFE registration');
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
   * Uses the detailed SLBFE Automation Engine
   */
  private static validateSlbfeRegistrationToTicketIssued(candidate: Candidate): TransitionValidationResult {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const missingDocuments: string[] = [];
    const complianceIssues: string[] = [];

    // Use the SLBFE Automation Engine
    const slbfeReport = SLBFEAutomationEngine.validateForTicketing(candidate);

    if (!slbfeReport.isEligibleForTicketing) {
      slbfeReport.missingRequirements.forEach(req => {
        blockers.push(`SLBFE Requirement Missing: ${req}`);
      });
      slbfeReport.checklist.forEach(item => {
        if (item.status !== 'Complete' && item.isMandatory) {
          complianceIssues.push(`SLBFE ${item.label} incomplete (${item.status})`);
        }
      });
    }

    // Check SLBFE Insurance
    const slbfeInsDoc = candidate.documents?.find(
      d => d.type === DocumentType.SLBFE_INSURANCE
    );
    if (!slbfeInsDoc) {
      missingDocuments.push('SLBFE Insurance');
      blockers.push('SLBFE mandatory insurance document not uploaded');
    }

    // Check Bureau Documents Set
    const bureauDoc = candidate.documents?.find(
      d => d.type === DocumentType.BUREAU_DOCUMENTS_SET
    );
    if (!bureauDoc) {
      missingDocuments.push('Bureau Documents Set');
      blockers.push('Bureau master document set not uploaded');
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

    // Check flight ticket document (enum-based)
    const ticketDoc = candidate.documents?.find(
      d => d.type === DocumentType.FLIGHT_TICKET || d.type === DocumentType.AIR_TICKET
    );

    if (!ticketDoc) {
      missingDocuments.push('Flight Ticket');
      blockers.push('Flight ticket not uploaded');
    } else if (ticketDoc.status !== DocumentStatus.APPROVED) {
      blockers.push(`Ticket status is ${ticketDoc.status}, must be APPROVED`);
    }

    // Check flight system data
    if (!candidate.stageData?.flightPNR) {
      warnings.push('Flight PNR not entered in system data');
    }
    if (!candidate.stageData?.flightNumber) {
      warnings.push('Flight number not entered in system data');
    }
    if (!candidate.stageData?.flightDepartureTime) {
      warnings.push('Departure time not entered in system data');
    }

    // Final compliance check (Hard Stops)
    const passport = candidate.passportData || (candidate.passports && candidate.passports.length > 0 ? candidate.passports[0] : null);
    if (passport?.status !== PassportStatus.VALID) {
      complianceIssues.push('Passport not valid');
      blockers.push('Final compliance check: Passport must be VALID for departure');
    }

    if (candidate.pccData?.status !== PCCStatus.VALID) {
      complianceIssues.push('PCC not valid');
      blockers.push('Final compliance check: PCC must be VALID for departure');
    }

    const medicalStatus = candidate.medicalData?.status || candidate.stageData?.medicalStatus;
    if (medicalStatus !== MedicalStatus.COMPLETED) {
      complianceIssues.push('Medical not completed');
      blockers.push('Final compliance check: Medical must be COMPLETED for departure');
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

    // Forward validation - route to specific validator

    // ------------------------------------------------------------------------
    // GLOBAL COMPLIANCE CHECK (Integrated Compliance Engine)
    // ------------------------------------------------------------------------
    const complianceReport = ComplianceEngine.evaluateCandidate(candidate);

    // Check for Critical Issues blocking this specific target stage
    const blockingIssues = complianceReport.results
      .filter(r => !r.passed && r.issue?.severity === ComplianceSeverity.CRITICAL && r.issue.blockingStages?.includes(toStage));

    if (blockingIssues.length > 0) {
      return {
        allowed: false,
        blockers: blockingIssues.map(i => `Compliance Block: ${i.issue!.message}`),
        warnings: [],
        missingDocuments: [],
        complianceIssues: blockingIssues.map(i => i.issue!.message)
      };
    }
    // ------------------------------------------------------------------------

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

    // Find when current stage was entered
    const stageEntry = stageHistory
      .filter(h => h.stage === stage)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const enteredAt = stageEntry ? new Date(stageEntry.timestamp) : new Date();
    const now = new Date();
    const slaDays = SLA_CONFIG[stage];
    const slaDeadline = new Date(enteredAt);
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const daysElapsed = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24));
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
      enteredAt,
      slaDeadline,
      daysElapsed,
      daysRemaining,
      slaDays,
      status,
      percentageElapsed: Math.round(percentageElapsed)
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

    AuditService.log('WORKFLOW_TRANSITION', {
      candidateId: candidate.id,
      fromStage,
      toStage,
      transitionType: event.transitionType,
      isOverdue: event.slaStatus === 'OVERDUE',
      reason: event.reason
    }, userId);

    return {
      success: true,
      event
    };
  }

  /**
   * Action Policy Helper: Centralize permission logic for UI actions
   */
  static canPerformAction(candidate: Candidate, action: string): { allowed: boolean; reason?: string } {
    const stage = candidate.stage;

    switch (action) {
      case 'DELETE':
        // Cannot delete if already departed or in final stages without high privilege
        if (stage === WorkflowStage.DEPARTED) {
          return { allowed: false, reason: 'Cannot delete a candidate who has already departed' };
        }
        return { allowed: true };

      case 'SCHEDULE_INTERVIEW':
        // Interviews are mostly for early stages
        const allowedStages = [WorkflowStage.REGISTERED, WorkflowStage.VERIFIED, WorkflowStage.APPLIED];
        if (!allowedStages.includes(stage)) {
          return { allowed: false, reason: `Interviews are typically scheduled during ${allowedStages.join(', ')}` };
        }
        return { allowed: true };

      case 'ASSIGN_TO_JOB':
        // Can only assign if not already placed or departed
        if ([WorkflowStage.TICKET_ISSUED, WorkflowStage.DEPARTED].includes(stage)) {
          return { allowed: false, reason: 'Candidate is already in final processing stages' };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
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

// Aliases for backward compatibility
export const getNextStage = WorkflowEngine.getNextStage;
export const getPreviousStage = WorkflowEngine.getPreviousStage;

/**
 * Backward compatible SLA status check
 */
export const getSLAStatus = (candidate: Candidate) => {
  const sla = WorkflowEngine.calculateSLAStatus(candidate);
  return {
    ...sla,
    overdue: sla.status === 'OVERDUE',
    daysInStage: sla.daysElapsed,
    slaLimit: sla.slaDays
  };
};

/**
 * Backward compatible validation function
 */
export const validateTransition = (candidate: Candidate, targetStage: WorkflowStage) => {
  const result = WorkflowEngine.validateTransition(candidate, targetStage);
  return {
    allowed: result.allowed,
    reason: result.blockers[0] || result.warnings[0]
  };
};

export default WorkflowEngine;
