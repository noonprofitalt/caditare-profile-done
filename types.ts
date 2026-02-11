export enum JobStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  PENDING = 'Pending Approval',
}

// Replaced old CandidateStatus with WorkflowStage
export enum WorkflowStage {
  REGISTRATION = 'Registered',
  VERIFICATION = 'Verified',
  APPLIED = 'Applied',
  OFFER_RECEIVED = 'Offer Received',
  WP_RECEIVED = 'WP Received',
  EMBASSY_APPLIED = 'Embassy Applied',
  VISA_RECEIVED = 'Visa Received',
  SLBFE_REGISTRATION = 'SLBFE Registration',
  TICKET = 'Ticket Issued',
  DEPARTURE = 'Departed',
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
  medicalStatus?: 'Pending' | 'Scheduled' | 'Cleared' | 'Failed';
  medicalScheduledDate?: string;
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
}

export type TimelineEventType = 'STAGE_TRANSITION' | 'STATUS_CHANGE' | 'DOCUMENT' | 'NOTE' | 'ALERT' | 'SYSTEM' | 'MANUAL_OVERRIDE';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string; // ISO String 
  actor: string; // Name of staff or 'System'
  stage: WorkflowStage; // Stage context when event happened
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    fileUrl?: string;
    isCritical?: boolean; // For delays/alerts
  };
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

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  role: string;
  experienceYears: number;
  skills: string[];

  // Extended Personal Profile
  firstName?: string;
  lastName?: string;
  nic?: string;
  dob?: string;
  gender?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  education?: string[];

  // Workflow Core
  stage: WorkflowStage;
  stageStatus: StageStatus;
  stageEnteredAt: string;
  stageData: StageData;
  workflowLogs: WorkflowLog[];
  timelineEvents: TimelineEvent[];
  comments: CandidateComment[]; // New: For team collaboration

  // Compliance Module
  passportData?: PassportData;
  pccData?: PCCData;

  location: string;
  preferredCountries: string[];
  jobRoles?: JobRole[];
  avatarUrl: string;
  documents: CandidateDocument[];
  jobId?: string; // ID of the job this candidate is matched to
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
}

export interface StaffPerformanceMetric {
  name: string;
  actionsPerformed: number;
  lastActive: string;
  mostActiveStage: string;
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
    pendingCollection: number; // Mock logic based on stage
  };
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

// --- CHAT SYSTEM TYPES ---

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  role: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private';
  unreadCount?: number;
  allowedRoles?: string[]; // RBAC: If set, only these roles can access
}

export interface ChatMessageContext {
  type: 'CANDIDATE' | 'JOB' | 'SYSTEM_EVENT';
  id: string;
  label: string; // "John Doe" or "Visa Approved"
  metadata?: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isMe?: boolean;
  context?: ChatMessageContext; // Smart Context
  isSystem?: boolean;
  participants?: string[];
  unreadCount?: number;
  lastMessage?: ChatMessage;
}

// --- AUTHENTICATION & SECURITY TYPES ---

export type UserRole = 'Admin' | 'Recruiter' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastLogin: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
