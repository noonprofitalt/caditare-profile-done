export enum JobStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  PENDING = 'Pending Approval',
}

// Replaced old CandidateStatus with WorkflowStage
export enum WorkflowStage {
  REGISTRATION = 'Registration',
  VERIFICATION = 'Verification',
  JOB_MATCHING = 'Job Matching',
  MEDICAL = 'Medical',
  POLICE = 'Police',
  VISA = 'Visa',
  TICKET = 'Ticket',
  DEPARTURE = 'Departure',
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
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  experienceYears: number;
  skills: string[];
  
  // Extended Personal Profile (Added per request)
  firstName?: string;
  lastName?: string;
  nic?: string;
  dob?: string;
  gender?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  education?: string;

  // Workflow Core
  stage: WorkflowStage;
  stageStatus: StageStatus;
  stageEnteredAt: string; // ISO Date for SLA tracking
  stageData: StageData;
  workflowLogs: WorkflowLog[];
  timelineEvents: TimelineEvent[]; // The Full History

  location: string;
  preferredCountries: string[];
  avatarUrl: string;
  documents: CandidateDocument[];
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