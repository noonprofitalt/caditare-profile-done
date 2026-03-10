/**
 * Candidate Types
 * Core candidate interface and related sub-types
 */

import { WorkflowStage, StageStatus, MedicalStatus, ProfileCompletionStatus, RegistrationSource, TimelineEvent, WorkflowLog, StageHistoryEntry } from './workflow.types';
import { CandidateDocument } from './document.types';
import { AdvancePayment, PaymentRecord } from './finance.types';

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

export interface InterviewRecord {
    id: string;
    date: string;
    time: string;
    interviewer?: string;
    method: 'In-Person' | 'Online' | 'Phone';
    linkOrLocation?: string;
    notes?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show' | 'Passed' | 'Failed';
}

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
    interviews?: InterviewRecord[];
    wpReferenceNumber?: string;
    travelInsurancePolicyNumber?: string;
    travelInsuranceCoverageEndDate?: string;
    flightNumber?: string;
    flightPNR?: string;
    flightDepartureTime?: string;
    workingVideoLink?: string;
    selfIntroductionVideoLink?: string;
    additionalVideoLinks?: string[];
}

export interface EmbassyDetails {
    eNo?: string;
    seNo?: string;
    appliedDate?: string;
    appointmentDate?: string;
    stampDate?: string;
    stampResult?: 'Pending' | 'Stamped' | 'Rejected';
    rejectReason?: string;
    awarenessProgramDate?: string;
    awarenessProgramSigned?: boolean;
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

export enum PassportStatus {
    VALID = 'VALID',
    EXPIRING = 'EXPIRING',
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID'
}

export interface PassportData {
    passportNumber: string;
    issuedDate: string;
    expiryDate: string;
    country: string;
    status: PassportStatus;
    validityDays: number;
}

export enum PCCStatus {
    VALID = 'VALID',
    EXPIRING = 'EXPIRING',
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID'
}

export interface PCCData {
    issuedDate: string;
    expiryDate?: string;
    lastInspectionDate?: string;
    status: PCCStatus;
    ageDays: number;
}

export enum BiometricStatus {
    PENDING = 'Pending',
    SCHEDULED = 'Scheduled',
    COMPLETED = 'Completed',
    FAILED = 'Failed'
}

export interface FamilyConsent {
    isGiven: boolean;
    signatoryName?: string;
    signatoryRelation?: string;
    verifiedBy?: string;
    verificationDate?: string;
    documentUrl?: string;
}

export interface SLBFEData {
    registrationNumber?: string;
    registrationDate?: string;
    trainingDate?: string;
    trainingInstitute?: string;
    trainingCertificateNo?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceExpiryDate?: string;
    insurancePremium?: number;
    biometricStatus: BiometricStatus;
    familyConsent: FamilyConsent;
    jobOrderId?: string;
    agreementId?: string;
    agreementStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
    deploymentApprovalDate?: string;
}

export interface OfficeUseOnly {
    customerCareOfficer?: string;
    fileHandlingOfficer?: string;
    date?: string;
    charges?: string;
}

export interface PersonalInfo {
    fullName: string;
    firstName?: string;
    middleName?: string;
    surname?: string;
    otherNames?: string;
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
    placeOfBirth?: string;
    passportProfession?: string;
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

export interface JobRole {
    title: string;
    experienceYears: number;
    skillLevel: 'Beginner' | 'Intermediate' | 'Skilled' | 'Expert';
    notes?: string;
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
    expiryDate?: string;
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
    requiredDocuments: import('./document.types').DocumentType[];
}

export interface RemarkEntry {
    date: string;
    remark: string;
    note?: string;
}

export interface ComplianceFlag {
    id: string;
    type: 'LEGAL' | 'MEDICAL' | 'DOCUMENT' | 'BEHAVIORAL' | 'OTHER';
    severity: 'WARNING' | 'CRITICAL';
    reason: string;
    createdBy: string;
    createdAt: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
}

export interface Candidate {
    id: string;
    candidateCode: string;
    regNo: string;
    regDate?: string;
    foreignAgent?: string;
    coordinatorName?: string;
    dhOfficer?: string;

    // Legacy fields
    name: string;
    email: string;
    phone: string;
    whatsapp?: string;
    secondaryPhone?: string;
    additionalContactNumbers?: string[];
    nic?: string;
    secondaryEmail?: string;
    skills?: string[];
    notes?: string;
    stage: WorkflowStage;

    // Additional Legacy fields
    firstName?: string;
    middleName?: string;
    surname?: string;
    otherNames?: string;
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
    officeUseOnly?: OfficeUseOnly;

    // Normalized Structure
    personalInfo: PersonalInfo;
    contactInfo: ContactInfo;
    professionalProfile: ProfessionalProfile;
    medicalData: MedicalData;
    passportData?: PassportData;
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
    complianceFlags?: ComplianceFlag[];
    comments: CandidateComment[];

    // Other context
    preferredCountries: string[];
    avatarUrl: string;
    documents: CandidateDocument[];
    jobId?: string;
    employerId?: string;
    jobOrderId?: string;
    signature?: string;

    // Embassy & Advance Payment
    embassyDetails?: EmbassyDetails;
    advancePayments?: AdvancePayment[];
    usdRateEmb?: number;
    usdRateFA?: number;
    workflowMilestones?: import('./workflow.types').WorkflowMilestones;
    departureDate?: string;
    placeOfBirth?: string;
    passportProfession?: string;
    passportRemark?: string;
    companyName?: string;
    batchReference?: string;
    remarkLog?: RemarkEntry[];
    fatherAge?: number;
    fatherNic?: string;
    motherAge?: number;
    motherNic?: string;
    spouseAge?: number;
    spouseNic?: string;

    // Audit
    audit: AuditInfo;
}
