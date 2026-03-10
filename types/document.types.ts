/**
 * Document Types
 * Document management enums and interfaces
 */

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
    CDF = 'CDF',
    ADDITIONAL_DOCUMENTS = 'Additional Documents',
    ID_CARD = 'ID',
    DRIVING_LICENSE = 'Driving licence',
    DRIVING_LICENSE_INTERNATIONAL = 'Int. Driving License',

    // Later Process
    MEDICAL_REPORT = 'Medical Report',
    POLICE_CLEARANCE = 'Police Clearance',
    VISA_COPY = 'Visa Copy',
    AIR_TICKET = 'Air Ticket Copy',

    // Phase 4: Selection & WP
    OFFER_LETTER = 'Offer Letter',
    SIGNED_OFFER_LETTER = 'Signed Offer Letter',
    IGI_RECORDS = 'IGI Records',
    WORK_PERMIT = 'Work Permit (WP)',
    APPLICATION_CV = 'Application CV',

    // Medical & Security additions
    VACCINATION_RECORDS = 'Vaccination Records',

    // Additional certificates from paper form
    BIRTH_CERTIFICATE = 'Birth Certificate',
    EXPERIENCE_LETTERS = 'Experience Letters',
    NVQ_TRADE_TEST = 'NVQ/Trade Test Certificates',
    COURSE_CERTIFICATES = 'Course Certificates',
    WORKING_PHOTO = 'Working Photo',
    SELF_INTRO_VIDEO_DOC = 'Self Introduction Video',
    WORKING_VIDEO_DOC = 'Working Video',
    FAMILY_BACKGROUND_REPORT = 'Family Background Report',
    POLICE_REPORT_LOCAL = 'Police Report (Local)',
    POLICE_REPORT_HQ = 'Police Report (HQ/FM)',
    ADVANCE_PAYMENT_RECEIPT = 'Advance Payment Receipt',

    // Phase 5: Embassy & Visa Processing
    D_FORM = 'D-Form',
    EMBASSY_APPOINTMENT_LETTER = 'Embassy Appointment Letter',
    USD_PAYMENT_RECEIPT = 'USD Payment Receipt',
    TRAVEL_INSURANCE = 'Travel Insurance',

    // Phase 6: SLBFE & Final Departure
    SLBFE_INSURANCE = 'SLBFE Insurance',
    BUREAU_DOCUMENTS_SET = 'Bureau Documents Set',
    FLIGHT_TICKET = 'Flight Ticket',
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
    MEDICAL_SECURITY = 'Medical & Security',
    SELECTION_WP = 'Selection & Work Permit',
    EMBASSY_VISA = 'Embassy & Visa Processing',
    SLBFE_DEPARTURE = 'SLBFE & Departure',
}

export interface DocumentLog {
    id: string;
    action: 'UPLOAD' | 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | 'DOWNLOAD';
    user: string;
    userId?: string;
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
    uploadedById?: string;
    fileSize?: string;
    fileType?: string;
    version: number;
    logs: DocumentLog[];
    rejectionReason?: string;
    storagePath?: string;
}
