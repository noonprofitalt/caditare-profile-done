import { Candidate, WorkflowStage, StageStatus, Job, JobStatus, DocumentType, DocumentStatus, DocumentCategory, CandidateDocument, PassportStatus, PCCStatus, MedicalStatus } from "../types";

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Civil Engineer',
    company: 'BuildRight Construction',
    location: 'Dubai, UAE',
    salaryRange: '$4,000 - $6,000 / mo',
    type: 'Contract',
    description: 'Leading site operations for a high-rise residential project.',
    status: JobStatus.OPEN,
    postedDate: '2023-10-15',
    requirements: ['Civil Engineering Degree', '10+ years experience', 'AutoCAD'],
  },
  {
    id: '2',
    title: 'Hospitality Manager',
    company: 'Oasis Resorts',
    location: 'Doha, Qatar',
    salaryRange: '$3,500 - $4,500 / mo',
    type: 'Full-time',
    description: 'Managing front-of-house operations for a 5-star luxury resort.',
    status: JobStatus.OPEN,
    postedDate: '2023-10-18',
    requirements: ['Hospitality Management', 'English & Arabic fluency'],
  },
  {
    id: '3',
    title: 'Heavy Machinery Operator',
    company: 'Global Infra Corp',
    location: 'Riyadh, Saudi Arabia',
    salaryRange: '$2,000 - $2,800 / mo',
    type: 'Contract',
    description: 'Operating excavators and cranes for infrastructure projects.',
    status: JobStatus.CLOSED,
    postedDate: '2023-09-01',
    requirements: ['Valid Heavy License', 'Safety Certification'],
  },
  {
    id: '4',
    title: 'Nurse Practitioner',
    company: 'London Health Services',
    location: 'London, UK',
    salaryRange: '£35,000 - £42,000 / yr',
    type: 'Full-time',
    description: 'Providing primary care services in a community clinic.',
    status: JobStatus.PENDING,
    postedDate: '2023-10-25',
    requirements: ['Nursing Degree', 'IELTS 7.0', 'NMC Registration'],
  }
];

// Helper to generate initial empty docs
const generateRequiredDocs = (): CandidateDocument[] => {
  const docs: CandidateDocument[] = [];
  let idCounter = 1;

  const addDoc = (type: DocumentType, category: DocumentCategory) => {
    docs.push({
      id: `doc-${idCounter++}`,
      type,
      category,
      status: DocumentStatus.MISSING,
      version: 0,
      logs: []
    });
  };

  // Mandatory
  addDoc(DocumentType.PASSPORT, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.CV, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.PASSPORT_PHOTOS, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.FULL_PHOTO, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_OL, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_AL, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_LEARNING, DocumentCategory.MANDATORY_REGISTRATION);
  addDoc(DocumentType.EDU_PROFESSIONAL, DocumentCategory.MANDATORY_REGISTRATION);

  // Medical & Security
  addDoc(DocumentType.MEDICAL_REPORT, DocumentCategory.MEDICAL_SECURITY);
  addDoc(DocumentType.POLICE_CLEARANCE, DocumentCategory.MEDICAL_SECURITY);
  addDoc(DocumentType.VACCINATION_RECORDS, DocumentCategory.MEDICAL_SECURITY);

  // Selection & Work Permit
  addDoc(DocumentType.OFFER_LETTER, DocumentCategory.SELECTION_WP);
  addDoc(DocumentType.SIGNED_OFFER_LETTER, DocumentCategory.SELECTION_WP);
  addDoc(DocumentType.APPLICATION_CV, DocumentCategory.SELECTION_WP);
  addDoc(DocumentType.IGI_RECORDS, DocumentCategory.SELECTION_WP);
  addDoc(DocumentType.WORK_PERMIT, DocumentCategory.SELECTION_WP);

  // Embassy & Visa
  addDoc(DocumentType.D_FORM, DocumentCategory.EMBASSY_VISA);
  addDoc(DocumentType.EMBASSY_APPOINTMENT_LETTER, DocumentCategory.EMBASSY_VISA);
  addDoc(DocumentType.USD_PAYMENT_RECEIPT, DocumentCategory.EMBASSY_VISA);
  addDoc(DocumentType.TRAVEL_INSURANCE, DocumentCategory.EMBASSY_VISA);
  addDoc(DocumentType.VISA_COPY, DocumentCategory.LATER_PROCESS);

  // SLBFE & Departure
  addDoc(DocumentType.SLBFE_INSURANCE, DocumentCategory.SLBFE_DEPARTURE);
  addDoc(DocumentType.BUREAU_DOCUMENTS_SET, DocumentCategory.SLBFE_DEPARTURE);
  addDoc(DocumentType.FLIGHT_TICKET, DocumentCategory.SLBFE_DEPARTURE);
  addDoc(DocumentType.AIR_TICKET, DocumentCategory.LATER_PROCESS);

  return docs;
};

// Date helper
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const hoursAgo = (hours: number, baseDate?: string) => {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// Create a candidate with some docs filled
const candidateWithDocs = (base: Partial<Candidate> & { name: string }, filledCount: number): Candidate => {
  const docs = generateRequiredDocs();

  // Simulate some filled docs
  for (let i = 0; i < filledCount; i++) {
    docs[i].status = DocumentStatus.APPROVED;
    docs[i].url = '#';
    docs[i].uploadedAt = '2023-11-01 10:30 AM';
    docs[i].uploadedBy = 'System Admin';
    docs[i].fileSize = '2.4 MB';
    docs[i].fileType = 'application/pdf';
    docs[i].version = 1;
    docs[i].logs.push({
      id: `log-${i}`,
      action: 'UPLOAD',
      user: 'Admin User',
      timestamp: '2023-11-01 10:30 AM',
      details: 'Initial upload'
    });
  }

  // Populate new profile fields if not present
  const names = base.name.split(' ');
  const firstName = base.firstName || names[0];
  const city = base.location ? base.location.split(',')[0].trim() : 'Unknown';

  return {
    ...base,
    firstName,
    nic: base.nic || '199012345678',
    dob: base.dob || '1990-01-15',
    gender: base.gender || 'Male',
    whatsapp: base.whatsapp || base.phone,
    address: base.address || '123 Main Street',
    city: base.city || city,
    education: base.education || ['Bachelor\'s Degree'],
    documents: docs
  } as Candidate;
};

export const MOCK_CANDIDATES: Candidate[] = [
  candidateWithDocs({
    id: '101',
    name: 'Ahmed Hassan',
    email: 'ahmed.h@example.com',
    phone: '+20 123 456 7890',
    role: 'Civil Engineer',
    stage: WorkflowStage.REGISTERED,
    stageStatus: StageStatus.IN_PROGRESS,
    stageEnteredAt: daysAgo(3),
    stageData: {
      employerStatus: 'Pending',
      paymentStatus: 'Pending'
    },
    // Valid Passport, Valid PCC
    passportData: {
      passportNumber: 'N12345678',
      issuedDate: '2020-01-01',
      expiryDate: '2030-01-01',
      country: 'Egypt',
      status: PassportStatus.VALID,
      validityDays: 2000
    },
    pccData: {
      issuedDate: daysAgo(30),
      status: PCCStatus.VALID,
      ageDays: 30
    },
    workflowLogs: [],
    timelineEvents: [
      { id: '1', type: 'STAGE_TRANSITION', title: 'Moved to Applied', description: 'Candidate was moved to Applied stage.', timestamp: daysAgo(3), actor: 'System', stage: WorkflowStage.APPLIED },
      { id: '2', type: 'DOCUMENT', title: 'Passport Verified', description: 'Document approved by verification team', timestamp: daysAgo(4), actor: 'Sarah Connor', stage: WorkflowStage.VERIFIED },
      { id: '3', type: 'STATUS_CHANGE', title: 'Verification Completed', description: 'All verification checks passed.', timestamp: daysAgo(4), actor: 'Sarah Connor', stage: WorkflowStage.VERIFIED },
      { id: '4', type: 'STAGE_TRANSITION', title: 'Moved to Verification', description: 'Candidate moved to Verification stage.', timestamp: daysAgo(5), actor: 'System', stage: WorkflowStage.VERIFIED },
      { id: '5', type: 'DOCUMENT', title: 'Passport Uploaded', description: 'Passport document uploaded by candidate.', timestamp: daysAgo(6), actor: 'Ahmed Hassan', stage: WorkflowStage.REGISTERED },
      { id: '6', type: 'SYSTEM', title: 'Profile Created', description: 'Initial profile created.', timestamp: daysAgo(6), actor: 'System', stage: WorkflowStage.REGISTERED },
    ],
    experienceYears: 8,
    skills: ['Project Management', 'AutoCAD', 'Structural Analysis'],
    location: 'Cairo, Egypt',
    preferredCountries: ['United Arab Emirates', 'Qatar', 'Saudi Arabia'],
    avatarUrl: 'https://picsum.photos/150/150?random=1',
  }, 8),

  candidateWithDocs({
    id: '102',
    name: 'Maria Santos',
    email: 'maria.s@example.com',
    phone: '+63 912 345 6789',
    gender: 'Female',
    role: 'Nurse',
    stage: WorkflowStage.REGISTERED,
    stageStatus: StageStatus.PENDING,
    stageEnteredAt: daysAgo(1),
    stageData: {},
    // No Data yet (New Reg)
    workflowLogs: [],
    timelineEvents: [
      { id: '1', type: 'SYSTEM', title: 'Profile Created', description: 'Initial profile created.', timestamp: daysAgo(1), actor: 'System', stage: WorkflowStage.REGISTERED },
    ],
    experienceYears: 5,
    skills: ['Patient Care', 'ICU', 'Emergency Response'],
    location: 'Manila, Philippines',
    preferredCountries: ['Romania', 'Poland', 'Malta'],
    avatarUrl: 'https://picsum.photos/150/150?random=2',
  }, 2),

  candidateWithDocs({
    id: '103',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@example.com',
    phone: '+91 987 654 3210',
    role: 'Chef',
    stage: WorkflowStage.EMBASSY_APPLIED,
    stageStatus: StageStatus.IN_PROGRESS,
    stageEnteredAt: daysAgo(16), // Overdue
    stageData: {
      employerStatus: 'Selected',
      medicalStatus: MedicalStatus.COMPLETED,
      policeStatus: 'Issued',
      visaStatus: 'Submitted',
      paymentStatus: 'Partial'
    },
    // Expiring Passport (< 6 months), Valid PCC
    passportData: {
      passportNumber: 'K98765432',
      issuedDate: '2014-05-01',
      expiryDate: daysAgo(-100), // Expiring in 100 days
      country: 'India',
      status: PassportStatus.EXPIRING,
      validityDays: 100
    },
    pccData: {
      issuedDate: daysAgo(10),
      status: PCCStatus.VALID,
      ageDays: 10
    },
    workflowLogs: [],
    timelineEvents: [
      { id: '1', type: 'ALERT', title: 'SLA Breach: Embassy Stage', description: 'Candidate has been in Embassy stage for 16 days (Limit: 1)', timestamp: hoursAgo(2), actor: 'System', stage: WorkflowStage.EMBASSY_APPLIED, metadata: { isCritical: true } },
      { id: '3', type: 'STAGE_TRANSITION', title: 'Moved to Embassy Applied', description: 'Candidate moved to Embassy Applied stage.', timestamp: daysAgo(16), actor: 'System', stage: WorkflowStage.EMBASSY_APPLIED },
    ],
    experienceYears: 12,
    skills: ['Continental Cuisine', 'Menu Planning', 'Kitchen Management'],
    location: 'Mumbai, India',
    preferredCountries: ['Croatia', 'United Arab Emirates'],
    avatarUrl: 'https://picsum.photos/150/150?random=3',
  }, 12),

  candidateWithDocs({
    id: '104',
    name: 'Elena Popov',
    email: 'elena.p@example.com',
    phone: '+359 88 123 4567',
    gender: 'Female',
    role: 'Hotel Receptionist',
    stage: WorkflowStage.VERIFIED,
    stageStatus: StageStatus.ON_HOLD,
    stageEnteredAt: daysAgo(4), // Overdue SLA 2
    stageData: {},
    // Valid Passport, Expired PCC
    passportData: {
      passportNumber: 'B55667788',
      issuedDate: '2019-01-01',
      expiryDate: '2029-01-01',
      country: 'Bulgaria',
      status: PassportStatus.VALID,
      validityDays: 1500
    },
    pccData: {
      issuedDate: daysAgo(200), // Expired
      status: PCCStatus.EXPIRED,
      ageDays: 200
    },
    workflowLogs: [],
    timelineEvents: [
      { id: '1', type: 'ALERT', title: 'SLA Warning', description: 'Verification is taking longer than expected.', timestamp: daysAgo(1), actor: 'System', stage: WorkflowStage.VERIFIED, metadata: { isCritical: false } },
      { id: '2', type: 'NOTE', title: 'Correction Requested', description: 'Passport photo is blurry. Please re-upload.', timestamp: daysAgo(2), actor: 'Sarah Connor', stage: WorkflowStage.VERIFIED },
      { id: '3', type: 'STAGE_TRANSITION', title: 'Moved to Verification', description: 'Candidate moved to Verification stage.', timestamp: daysAgo(4), actor: 'System', stage: WorkflowStage.VERIFIED },
    ],
    experienceYears: 3,
    skills: ['Customer Service', 'Multi-lingual', 'Booking Systems'],
    location: 'Sofia, Bulgaria',
    preferredCountries: ['Cyprus', 'Romania'],
    avatarUrl: 'https://picsum.photos/150/150?random=4',
  }, 8),
];
