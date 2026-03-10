/**
 * Types Barrel Export
 * 
 * Re-exports all domain types from their individual modules.
 * Existing imports from '../types' will continue to work.
 */

// Workflow & Pipeline
export {
    JobStatus,
    WorkflowStage,
    StageStatus,
    ProfileCompletionStatus,
    RegistrationSource,
    MedicalStatus,
    type TimelineEventType,
    type TimelineEvent,
    type WorkflowLog,
    type WorkflowMilestones,
    type StageHistoryEntry,
    type TransitionValidationResult,
    type WorkflowTransitionEvent,
    type SLAStatus,
} from './workflow.types';

// Documents
export {
    DocumentType,
    DocumentStatus,
    DocumentCategory,
    type DocumentLog,
    type CandidateDocument,
} from './document.types';

// Auth & Security
export {
    type UserRole,
    type User,
    type AuthState,
    type Permission,
    ROLE_PERMISSIONS,
} from './auth.types';

// Finance
export {
    TransactionType,
    TransactionCategory,
    InvoiceStatus,
    AdvancePaymentType,
    type AdvancePayment,
    type PaymentRecord,
    type FinanceTransaction,
    type Invoice,
} from './finance.types';

// Candidate
export {
    Country,
    PassportStatus,
    PCCStatus,
    BiometricStatus,
    type InterviewRecord,
    type StageData,
    type EmbassyDetails,
    type PassportData,
    type PCCData,
    type FamilyConsent,
    type SLBFEData,
    type OfficeUseOnly,
    type PersonalInfo,
    type EmergencyContact,
    type ContactInfo,
    type JobRole,
    type ProfessionalProfile,
    type MedicalRecord,
    type MedicalData,
    type AuditInfo,
    type CandidateComment,
    type CountryTemplate,
    type RemarkEntry,
    type ComplianceFlag,
    type Candidate,
} from './candidate.types';

// Job
export { type Job } from './job.types';

// Employer & CRM
export {
    EmployerStatus,
    DemandOrderStatus,
    SelectionStage,
    type EmployerDocument,
    type EmployerActivity,
    type Employer,
    type DemandOrder,
    type CandidateSelection,
} from './employer.types';

// Chat
export {
    type ChatUser,
    type ChatChannel,
    type MessageReaction,
    type ChatAttachment,
    type ChatMessageContext,
    type ChatMessage,
    type TypingIndicator,
    type ChannelMember,
    type ChatNotification,
} from './chat.types';

// Intelligence / Dashboard
export {
    type KPIMetrics,
    type StaffSession,
    type StaffWorkBreakdown,
    type StaffDailyActivity,
    type StaffCandidateSummary,
    type StaffPerformanceMetric,
    type BottleneckMetric,
    type SystemSnapshot,
    type TaskPriority,
    type WorkTask,
    type SystemAlert,
    type AppNotification,
} from './intelligence.types';
