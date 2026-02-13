import { DocumentType, WorkflowStage } from '../../types';

export enum ComplianceDomain {
    PASSPORT = 'Passport',
    PCC = 'Police Clearance',
    MEDICAL = 'Medical',
    AGE = 'Age Requirement',
    DOCUMENTS = 'Document Check',
    FLAGS = 'Compliance Flags',
    GENERAL = 'General'
}

export enum ComplianceSeverity {
    INFO = 'INFO',       // Just for info, score 100%
    WARNING = 'WARNING', // Score penalty, but might proceed with override
    CRITICAL = 'CRITICAL' // Score 0%, absolute blocker
}

export interface ComplianceIssue {
    id: string;
    domain: ComplianceDomain;
    severity: ComplianceSeverity;
    message: string;
    remedy?: string;
    blockingStages: WorkflowStage[]; // Stages that cannot be entered
}

export interface ComplianceRuleResult {
    ruleId: string;
    domain: ComplianceDomain;
    passed: boolean;
    scoreImpact: number; // How much this rule contributes to score (0-100)
    issue?: ComplianceIssue;
}

export interface ComplianceScoreCard {
    overallScore: number; // 0-100
    domainBreakdown: Record<ComplianceDomain, { score: number; maxScore: number }>;
    criticalIssuesCount: number;
    warningIssuesCount: number;
}

export interface FullComplianceReport {
    candidateId: string;
    timestamp: Date;
    scoreCard: ComplianceScoreCard;
    results: ComplianceRuleResult[];
    isProcessable: boolean; // True if no CRITICAL issues for current stage
}

// --- CONFIGURATION TYPES ---

export interface AgeLimit {
    min: number;
    max: number;
}

export interface CountryComplianceRule {
    countryName: string; // Key, e.g., "Saudi Arabia"
    defaultAgeLimit: AgeLimit;
    roleSpecificAgeLimits?: Record<string, AgeLimit>; // e.g., "Housemaid": {max: 55, ...}

    minPassportValidityMonths: number;
    checksPCC: boolean;
    pccValidityMonths: number;

    mandatoryDocuments: DocumentType[];
    medicalRequired: boolean;
}
