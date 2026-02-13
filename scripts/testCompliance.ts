import { ComplianceEngine } from '../services/compliance/ComplianceEngine';
import { Candidate, WorkflowStage, MedicalStatus, PassportStatus, PCCStatus, ProfileCompletionStatus, RegistrationSource, StageStatus, DocumentStatus, DocumentType, DocumentCategory, Country } from '../types';

// Mock Candidate
const mockCandidate: Candidate = {
    id: 'C-12345',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'Construction Worker',
    experienceYears: 5,
    skills: ['Masonry'],
    profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
    registrationSource: RegistrationSource.FULL_FORM,
    profileCompletionPercentage: 100,
    stage: WorkflowStage.VERIFIED,
    stageStatus: StageStatus.PENDING,
    stageEnteredAt: new Date().toISOString(),
    stageData: {
        medicalStatus: MedicalStatus.SCHEDULED,
        medicalScheduledDate: '2023-01-01' // Past Date -> Should trigger OVERDUE
    },
    workflowLogs: [],
    timelineEvents: [],
    comments: [],
    location: 'Colombo',
    preferredCountries: [],
    avatarUrl: '',
    documents: [
        {
            id: 'd1', type: DocumentType.PASSPORT, category: DocumentCategory.MANDATORY_REGISTRATION,
            status: DocumentStatus.APPROVED, version: 1, logs: []
        }
    ],
    passportData: {
        passportNumber: 'N1234567',
        country: 'Sri Lanka',
        issuedDate: '2015-01-01',
        expiryDate: '2025-01-01', // Valid
        status: PassportStatus.VALID,
        validityDays: 365
    },
    pccData: {
        issuedDate: '2023-01-01',
        status: PCCStatus.EXPIRED, // Expired
        ageDays: 400
    },
    dob: '2010-01-01', // 16 years old -> Too Young for most
    targetCountry: Country.SAUDI_ARABIA
};

console.log('--- EVALUATING COMPLIANCE ---');
const report = ComplianceEngine.evaluateCandidate(mockCandidate);

console.log(`Candidate: ${mockCandidate.name}`);
console.log(`Target Country: ${mockCandidate.targetCountry}`);
console.log(`Overall Score: ${report.scoreCard.overallScore}%`);
console.log(`Is Processable: ${report.isProcessable}`);

console.log('\n--- ISSUES ---');
report.results.forEach(r => {
    if (!r.passed || r.issue) {
        console.log(`[${r.domain}] ${r.passed ? 'PASS' : 'FAIL'} - ${r.issue?.message} (Severity: ${r.issue?.severity})`);
        if (r.issue?.blockingStages) {
            console.log(`   Blocks: ${r.issue.blockingStages.join(', ')}`);
        }
    }
});

console.log('\n--- ALERTS ---');
const alerts = ComplianceEngine.generateAlerts(report);
alerts.forEach(a => console.log(`[ALERT] ${a.title}: ${a.message}`));
