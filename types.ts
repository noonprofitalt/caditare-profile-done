export enum JobStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  FILLED = 'Filled',
  PENDING = 'Pending Approval',
}

// Replaced old CandidateStatus with WorkflowStage
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

export enum Country {
  // Europe
  ROMANIA = 'Romania',
  CROATIA = 'Croatia',
  MALTA = 'Malta',
  POLAND = 'Poland',
  CYPRUS = 'Cyprus',
  TURKEY = 'Turkey',
  SERBIA = 'Serbia',

  // Middle East
  UAE = 'United Arab Emirates',
  ISRAEL = 'Israel',
  SAUDI_ARABIA = 'Saudi Arabia',
  KUWAIT = 'Kuwait',
  QATAR = 'Qatar',
  BAHRAIN = 'Bahrain',
  JORDAN = 'Jordan',
  OMAN = 'Oman',

  // Southeast Asia
  MALAYSIA = 'Malaysia',
  SINGAPORE = 'Singapore',
}

export enum MedicalStatus {
  NOT_STARTED = 'Not Started',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum ProfileCompletionStatus {
  QUICK = 'QUICK',           // Quick Add form only
  PARTIAL = 'PARTIAL',       // Started full form, not completed
  COMPLETE = 'COMPLETE'      // Full registration completed
}

export enum RegistrationSource {
  QUICK_FORM = 'QUICK_FORM',
  FULL_FORM = 'FULL_FORM'
}

export enum StageStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  notes?: string;
}

// Sub-status specific data tracking
export interface StageData {
  medicalStatus?: MedicalStatus;
  medicalScheduledDate?: string;
  medicalCompletedDate?: string;
  medicalNotes?: string;
  policeStatus?: 'Pending' | 'Applied' | 'Issued' | 'Rejected';
  visaStatus?: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  employerStatus?: 'Pending' | 'Selected' | 'Rejected';
  ticketStatus?: 'Pending' | 'Reserved' | 'Issued';
  paymentStatus?: 'Pending' | 'Partial' | 'Completed';
  paymentNotes?: string;
  paymentHistory?: PaymentRecord[];
}

export enum DocumentType {
  // Mandatory at Registration
  PASSPORT = 'Valid Passport',
  CV = 'Updated CV',
  PASSPORT_PHOTOS = 'Passport Size Photos (6)',
  FULL_PHOTO = 'Full Photo (1)',
  EDU_OL = 'O/L Certificate',
  EDU_AL = 'A/L Certificate',
  EDU_LEARNING = 'Learning Certificates',
  EDU_PROFESSIONAL = 'Professional Certificates',

  // Later Process
  MEDICAL_REPORT = 'Medical Report',
  POLICE_CLEARANCE = 'Police Clearance',
  VISA_COPY = 'Visa Copy',
  AIR_TICKET = 'Air Ticket Copy',
}

export enum DocumentStatus {
  MISSING = 'Missing',
  PENDING = 'Pending Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CORRECTION_REQUIRED = 'Correction Required',
}

export enum DocumentCategory {
  MANDATORY_REGISTRATION = 'Mandatory at Registration',
  LATER_PROCESS = 'Later Process Documents',
}

export interface DocumentLog {
  id: string;
  action: 'UPLOAD' | 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | 'DOWNLOAD';
  user: string;
  timestamp: string;
  details?: string;
}

export interface CandidateDocument {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  fileSize?: string;
  fileType?: string;
  version: number;
  logs: DocumentLog[];
  rejectionReason?: string;
  storagePath?: string; // Supabase Storage path
}

export type TimelineEventType = 'STAGE_TRANSITION' | 'STATUS_CHANGE' | 'DOCUMENT' | 'NOTE' | 'ALERT' | 'SYSTEM' | 'MANUAL_OVERRIDE' | 'WORKFLOW';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string; // ISO String 
  actor: string; // Name of staff or 'System'
  isCritical?: boolean; // For delays/alerts
  stage?: WorkflowStage; // Stage context when event happened
  // Metadata for advanced tracking (e.g. rollback reason, error details)
  metadata?: Record<string, any>;
}

export interface WorkflowLog {
  id: string;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  timestamp: string;
  user: string;
  reason?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string; // Country/City
  salaryRange: string;
  type: 'Full-time' | 'Contract' | 'Seasonal';
  description: string;
  status: JobStatus;
  postedDate: string;
  requirements: string[];
  matchedCandidateIds?: string[]; // IDs of candidates specifically matched/selected for this job
  employerId?: string; // ID of the partner/employer offering this job
  category?: string;        // e.g. Construction, Hospitality, Healthcare
  positions?: number;       // number of openings
  filledPositions?: number; // how many have been filled
  deadline?: string;        // application deadline
  demandOrderId?: string;   // linked demand order from Employer CRM
  contactPerson?: string;   // point of contact
  benefits?: string[];      // e.g. Housing, Transport, Insurance
}

export interface CandidateComment {
  id: string;
  candidateId: string;
  author: string;
  text: string;
  timestamp: string;
  isInternal: boolean;
}

export interface CountryTemplate {
  country: string;
  requiredDocuments: DocumentType[];
}

export interface JobRole {
  title: string;
  experienceYears: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Skilled' | 'Expert';
  notes?: string;
}

// Enhanced SLBFE Data Model
export enum BiometricStatus {
  PENDING = 'Pending',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface FamilyConsent {
  isGiven: boolean;
  signatoryName?: string; // Spouse/Parent
  signatoryRelation?: string;
  verifiedBy?: string; // GN officer or DS officer name
  verificationDate?: string;
  documentUrl?: string; // Uploaded consent form
}

export interface SLBFEData {
  registrationNumber?: string;
  registrationDate?: string;

  // Training
  trainingDate?: string;
  trainingInstitute?: string;
  trainingCertificateNo?: string;

  // Insurance
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  insurancePremium?: number;

  // New Mandatory Requirements
  biometricStatus: BiometricStatus;
  familyConsent: FamilyConsent;

  // Agreement & Workflow
  jobOrderId?: string; // Linked Job Order at SLBFE
  agreementId?: string; // Linked Agreement ID
  agreementStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';

  // Final Authorization
  deploymentApprovalDate?: string;
}

export interface StageHistoryEntry {
  stage: WorkflowStage;
  timestamp: string | Date;
  userId?: string;
  notes?: string;
}

export interface PersonalInfo {
  fullName: string;
  firstName?: string;
  middleName?: string;
  nic?: string;
  dob?: string;
  age?: number;
  gender?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  religion?: string;
  gsDivision?: string;
  divisionalSecretariat?: string;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
  nationality?: string;
  drivingLicenseNo?: string;
  height?: { feet: number; inches: number };
  weight?: number;
  children?: any[];
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  school?: string;
  civilStatus?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  address?: string;
}

export interface ContactInfo {
  primaryPhone: string;
  whatsappPhone?: string;
  additionalPhones?: string[];
  email: string;
  emergencyContact?: EmergencyContact;
}

export interface ProfessionalProfile {
  jobRoles: (string | JobRole)[];
  experienceYears: number;
  skills: string[];
  education: string[];
  educationalQualifications?: Array<{
    courseName: string;
    level: string;
    institute: string;
    year: string;
  }>;
  employmentHistory?: Array<{
    type: 'Local' | 'Foreign';
    position: string;
    companyName: string;
    country?: string;
    years: number;
  }>;
  trainingDetails?: string;
  specialAchievements?: string;
  gceOL?: { year: string };
  gceAL?: { year: string };
  school?: string;
}

export interface MedicalRecord {
  date: string;
  type: string;
  result: string;
  notes?: string;
  clinic?: string;
  reportUrl?: string;
}

export interface MedicalData {
  status: MedicalStatus;
  bloodGroup?: string;
  allergies?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  medicalRecords?: MedicalRecord[];
}

export interface AuditInfo {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  version: number;
}

export interface Candidate {
  id: string;
  candidateCode: string; // New: Format GW-YYYY-XXXX

  // Legacy fields for backward compatibility
  name: string;
  email: string;
  phone: string;
  whatsapp?: string; // Legacy
  secondaryPhone?: string;
  additionalContactNumbers?: string[]; // Legacy
  nic?: string;
  secondaryEmail?: string;
  skills?: string[];
  stage: WorkflowStage;

  // Additional Legacy fields for forms
  firstName?: string;
  middleName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  province?: string;
  divisionalSecretariat?: string;
  gsDivision?: string;
  district?: string;
  nationality?: string;
  drivingLicenseNo?: string;
  height?: { feet: number; inches: number };
  weight?: number;
  religion?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  school?: string;
  gceOL?: { year: string };
  gceAL?: { year: string };
  educationalQualifications?: any[];
  employmentHistory?: any[];
  trainingDetails?: string;
  specialAchievements?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  guardianName?: string;
  guardianIdNo?: string;
  guardianBirthday?: string;
  guardianContact?: string;
  children?: any[];
  education?: string[];
  jobRoles?: any[];
  experienceYears?: number;
  role?: string;
  location?: string;
  position?: string;
  country?: string;
  applicationDate?: string;
  officeSelection?: string;
  officeRemark?: string;
  refNo?: string;
  targetCountry?: string;

  // Normalized Structure
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  professionalProfile: ProfessionalProfile;
  medicalData: MedicalData;
  passportData?: PassportData; // Kept for backward compatibility
  passports?: PassportData[];
  pccData?: PCCData;
  slbfeData?: SLBFEData;

  // Workflow & Status
  profileType: 'QUICK' | 'FULL';
  profileCompletionStatus: ProfileCompletionStatus;
  registrationSource: RegistrationSource;
  profileCompletionPercentage: number;

  stageStatus: StageStatus;
  stageEnteredAt: string;
  stageData: StageData;
  stageHistory?: StageHistoryEntry[];
  workflowLogs: WorkflowLog[];
  timelineEvents: TimelineEvent[];
  complianceFlags?: ComplianceFlag[]; // New field for Phase 13
  comments: CandidateComment[];

  // Other context
  preferredCountries: string[];
  avatarUrl: string;
  documents: CandidateDocument[];
  jobId?: string;
  employerId?: string;
  jobOrderId?: string;

  signature?: string;

  // Audit
  audit: AuditInfo;
}


// --- COMPLIANCE MODULE TYPES ---

export enum PassportStatus {
  VALID = 'VALID',
  EXPIRING = 'EXPIRING', // < 180 days
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID'
}

export interface PassportData {
  passportNumber: string;
  issuedDate: string;
  expiryDate: string;
  country: string;
  status: PassportStatus;
  validityDays: number; // calculated
}

export enum PCCStatus {
  VALID = 'VALID',
  EXPIRING = 'EXPIRING', // > 150 days old
  EXPIRED = 'EXPIRED',   // > 180 days old
  INVALID = 'INVALID'
}

export interface PCCData {
  issuedDate: string;
  expiryDate?: string; // Optional, derived from issuedDate + 180 days usually
  lastInspectionDate?: string; // New: Date of last verification/check
  status: PCCStatus;
  ageDays: number; // calculated
}

// --- INTELLIGENCE ENGINE TYPES ---

export interface KPIMetrics {
  totalCandidates: number;
  activeProcessing: number;
  completedDepartures: number;
  criticalDelays: number;
  revenueEst: number;
  avgProcessDays: number;
  projectedDepartures?: number;
}

export interface StaffPerformanceMetric {
  name: string;
  actionsPerformed: number;
  lastActive: string;
  mostActiveStage: string;
  efficiencyScore?: number; // 0-100 based on activity vs avg
}

export interface BottleneckMetric {
  stage: string;
  count: number;
  avgDays: number;
  slaLimit: number;
  status: 'Good' | 'Warning' | 'Critical';
}

export interface SystemSnapshot {
  timestamp: string;
  kpi: KPIMetrics;
  stageDistribution: { name: string; value: number }[];
  bottlenecks: BottleneckMetric[];
  staffMetrics: StaffPerformanceMetric[];
  financials: {
    totalCollected: number;
    pendingCollection: number;
    projectedRevenue: number;   // Expected in 30 days
    pipelineValue: number;      // Total potential if all close
    revenueByStage: Array<{ name: string; value: number }>;
  };
  aiSummary?: string;            // AI-generated executive health check
}

// --- NEW OPERATIONAL DASHBOARD TYPES ---

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  candidateId: string;
  candidateName: string;
  stage: WorkflowStage;
  dueDate: string;
  actionLabel: string;
  type: 'VERIFICATION' | 'APPROVAL' | 'FOLLOW_UP' | 'PAYMENT' | 'ISSUE';
}

export interface SystemAlert {
  id: string;
  type: 'DELAY' | 'INFO' | 'WARNING' | 'SUCCESS';
  message: string;
  timestamp: string;
  count?: number;
}

export interface AppNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DELAY';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  candidateId?: string;
}

// --- EMPLOYER CRM TYPES ---

export enum EmployerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING_APPROVAL = 'Pending Approval',
  BLACKLISTED = 'Blacklisted',
}

export interface EmployerDocument {
  id: string;
  type: 'Agreement' | 'License' | 'POA' | 'Other';
  title: string;
  expiryDate: string;
  status: 'Valid' | 'Expired' | 'Pending';
  url?: string;
}

export interface EmployerActivity {
  id: string;
  type: 'Note' | 'Email' | 'Call' | 'Meeting' | 'Agreement_Update';
  content: string;
  timestamp: string;
  actor: string;
}

export interface Employer {
  id: string;
  companyName: string;
  regNumber: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: EmployerStatus;
  documents: EmployerDocument[];
  notes?: string;
  website?: string;
  joinedDate: string;

  // Enterprise Enhancements
  quotaTotal?: number;
  quotaUsed?: number;
  commissionPerHire?: number;
  paymentTermDays?: number;
  selectionRatio?: number; // Calculated internally: Interviews / Hires
  activityLog: EmployerActivity[];
}

// --- DEMAND ORDER & CANDIDATE SELECTION TYPES ---

export enum DemandOrderStatus {
  DRAFT = 'Draft',
  OPEN = 'Open',
  PARTIALLY_FILLED = 'Partially Filled',
  FILLED = 'Filled',
  CLOSED = 'Closed',
  CANCELLED = 'Cancelled',
}

export interface DemandOrder {
  id: string;
  employerId: string;
  title: string;                // "20x Construction Workers"
  jobCategory: string;          // "Construction", "Hospitality", etc.
  country: string;
  location: string;             // City
  positionsRequired: number;
  positionsFilled: number;
  salaryRange: string;
  contractDuration: string;     // "2 years"
  benefits: string[];           // "Accommodation", "Food", "Transport"
  requirements: string[];
  status: DemandOrderStatus;
  createdAt: string;
  deadline?: string;            // When employer needs candidates by
  notes?: string;
}

export enum SelectionStage {
  MATCHED = 'Matched',
  CV_SUBMITTED = 'CV Submitted',
  SHORTLISTED = 'Shortlisted',
  INTERVIEW_SCHEDULED = 'Interview Scheduled',
  INTERVIEWED = 'Interviewed',
  SELECTED = 'Selected',
  OFFER_ISSUED = 'Offer Issued',
  OFFER_ACCEPTED = 'Offer Accepted',
  REJECTED = 'Rejected',
}

export interface CandidateSelection {
  id: string;
  demandOrderId: string;
  candidateId: string;
  candidateName: string;        // Denormalized for display
  stage: SelectionStage;
  interviewDate?: string;
  interviewType?: 'Video' | 'In-Person' | 'Phone';
  interviewNotes?: string;
  employerFeedback?: string;
  offerSalary?: string;
  offerDate?: string;
  rejectionReason?: string;
  matchScore?: number;          // 0-100 skill match
  createdAt: string;
  updatedAt: string;
}

// --- FINANCE SYSTEM TYPES ---

export enum TransactionType {
  REVENUE = 'Revenue',
  EXPENSE = 'Expense',
}

export enum TransactionCategory {
  COMMISSION = 'Commission',
  VISA_FEE = 'Visa Fee',
  FLIGHT_TICKET = 'Flight Ticket',
  MEDICAL_FEE = 'Medical Fee',
  EMBASSY_FEE = 'Embassy Fee',
  AGENT_COMMISSION = 'Agent Commission',
  OFFICE_RENT = 'Office Rent',
  OTHER = 'Other',
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}

export interface FinanceTransaction {
  id: string;
  candidateId: string;
  employerId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  status: 'Pending' | 'Completed' | 'Reversed';
  timestamp: string;
  description?: string;
  referenceId?: string; // e.g. Invoice ID
}

export interface Invoice {
  id: string;
  employerId: string;
  candidateId: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: { description: string; amount: number }[];
  billingAddress?: string;
}

// --- AUTHENTICATION & SECURITY TYPES ---

export type UserRole = 'Admin' | 'Recruiter' | 'Viewer' | 'Manager' | 'Finance' | 'Compliance' | 'Operations';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
// ... existing code ...

// ============================================================================
// WORKFLOW ENGINE V2 TYPES
// ============================================================================

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

export interface ComplianceFlag {
  id: string;
  type: 'LEGAL' | 'MEDICAL' | 'DOCUMENT' | 'BEHAVIORAL' | 'OTHER';
  severity: 'WARNING' | 'CRITICAL'; // CRITICAL blocks workflow
  reason: string;
  createdBy: string;
  createdAt: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

// --- CHAT SYSTEM TYPES ---

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline' | 'away';
  role?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private';
  unreadCount: number;
  allowedRoles?: string[];
  lastMessage?: ChatMessage;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'file';
  size?: string;
  mimeType?: string;
}

export interface ChatMessageContext {
  type: 'candidate' | 'job' | 'finance' | 'system' | 'CANDIDATE' | 'JOB' | 'SYSTEM_EVENT';
  id: string;
  title?: string;
  label?: string;
  icon?: string; // Added for icon support
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  editedAt?: string;
  isMe?: boolean;
  isSystem?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  reactions?: MessageReaction[];
  attachments?: ChatAttachment[]; // Added attachments
  parentMessageId?: string;
  replyCount?: number;
  context?: ChatMessageContext;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
}

export interface ChannelMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: string;
  joinedAt: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  channelId: string;
  messageId?: string;
  title: string;
  message: string;
  type: 'mention' | 'reply' | 'channel_invite' | 'system';
  isRead: boolean;
  createdAt: string;
}

export type Permission =
  | 'candidates.view'
  | 'candidates.edit'
  | 'candidates.delete'
  | 'finance.view'
  | 'finance.edit'
  | 'finance.manage'
  | 'reports.view'
  | 'users.manage'
  | 'chat.view';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Admin': ['candidates.view', 'candidates.edit', 'candidates.delete', 'finance.view', 'finance.edit', 'reports.view', 'users.manage', 'chat.view'],
  'Recruiter': ['candidates.view', 'candidates.edit', 'reports.view', 'chat.view'],
  'Viewer': ['candidates.view', 'reports.view', 'chat.view'],
  'Manager': ['candidates.view', 'candidates.edit', 'reports.view', 'chat.view'],
  'Finance': ['finance.view', 'finance.edit', 'reports.view', 'chat.view'],
  'Compliance': ['candidates.view', 'reports.view', 'chat.view'],
  'Operations': ['candidates.view', 'reports.view', 'chat.view']
};
