import { SLBFEAutomationEngine } from '../services/slbfe/SLBFEEngine';
import { Candidate, WorkflowStage, MedicalStatus, PassportStatus, PCCStatus, ProfileCompletionStatus, RegistrationSource, StageStatus, DocumentStatus, DocumentType, DocumentCategory, Country, BiometricStatus } from '../types';

// Mock Candidate with "Some" SLBFE data but not all
const slbfeCandidate: Candidate = {
    id: 'SLBFE-TEST-001',
    name: 'Rani Kumari',
    email: 'rani@example.com',
    phone: '0771234567',
    role: 'Housemaid',
    gender: 'Female', // Triggers Family Consent Check
    experienceYears: 2,
    skills: ['Housekeeping'],
    profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
    registrationSource: RegistrationSource.FULL_FORM,
    profileCompletionPercentage: 100,
    stage: WorkflowStage.SLBFE_REGISTRATION,
    stageStatus: StageStatus.IN_PROGRESS,
    stageEnteredAt: new Date().toISOString(),
    stageData: {
        medicalStatus: MedicalStatus.COMPLETED
    },
    workflowLogs: [],
    timelineEvents: [],
    comments: [],
    location: 'Kandy',
    preferredCountries: [],
    avatarUrl: '',
    documents: [
        {
            id: 'visa1', type: DocumentType.VISA_COPY, category: DocumentCategory.LATER_PROCESS,
            status: DocumentStatus.APPROVED, version: 1, logs: []
        }
    ],
    passportData: {
        passportNumber: 'N7654321',
        country: 'Sri Lanka',
        issuedDate: '2020-01-01',
        expiryDate: '2030-01-01',
        status: PassportStatus.VALID,
        validityDays: 1000
    },
    slbfeData: {
        registrationNumber: 'SLBFE/2023/1234',
        registrationDate: '2023-11-01',
        trainingDate: '2023-10-15',
        // Missing Insurance Policy
        // Biometrics Completed
        biometricStatus: BiometricStatus.COMPLETED,
        // Family Consent Missing
        familyConsent: {
            isGiven: false
        },
        agreementStatus: 'Pending' // Agreement not approved
    },
    targetCountry: Country.SAUDI_ARABIA
};

console.log('--- SLBFE AUTOMATION ENGINE TEST ---');
console.log(`Candidate: ${slbfeCandidate.name} (${slbfeCandidate.role})`);

const report = SLBFEAutomationEngine.validateForTicketing(slbfeCandidate);

console.log(`Ticketing Eligibility: ${report.isEligibleForTicketing ? 'PASS' : 'FAIL'}`);

console.log('\n--- CHECKLIST ---');
report.checklist.forEach(item => {
    const symbol = item.status === 'Complete' ? '✅' : (item.status === 'Failed' ? '❌' : '⚠️');
    console.log(`${symbol} ${item.label}: ${item.status} ${item.details ? `(${item.details})` : ''}`);
});

if (!report.isEligibleForTicketing) {
    console.log('\n--- MISSING REQUIREMENTS ---');
    report.missingRequirements.forEach(req => console.log(`- ${req}`));
    console.log('\n[BLOCK] Cannot issue ticket. Deployment Certificate denied.');
} else {
    console.log('\n--- DEPLOYMENT CERTIFICATE GENERATED ---');
    console.log(JSON.stringify(report.certificate, null, 2));
}
