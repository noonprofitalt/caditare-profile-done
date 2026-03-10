/**
 * Employer & CRM Types
 * Employer management, demand orders, and candidate selection
 */

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
    type: 'Note' | 'Email' | 'Call' | 'Meeting' | 'Agreement_Update' | 'Creation' | 'Update';
    content: string;
    timestamp: string;
    actor: string;
    userId?: string;
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
    quotaTotal?: number;
    quotaUsed?: number;
    commissionPerHire?: number;
    paymentTermDays?: number;
    selectionRatio?: number;
    activityLog: EmployerActivity[];
}

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
    title: string;
    jobCategory: string;
    country: string;
    location: string;
    positionsRequired: number;
    positionsFilled: number;
    salaryRange: string;
    contractDuration: string;
    benefits: string[];
    requirements: string[];
    status: DemandOrderStatus;
    createdAt: string;
    deadline?: string;
    notes?: string;
    activityLog?: EmployerActivity[];
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
    candidateName: string;
    stage: SelectionStage;
    interviewDate?: string;
    interviewType?: 'Video' | 'In-Person' | 'Phone';
    interviewNotes?: string;
    employerFeedback?: string;
    offerSalary?: string;
    offerDate?: string;
    rejectionReason?: string;
    matchScore?: number;
    createdAt: string;
    updatedAt: string;
}
