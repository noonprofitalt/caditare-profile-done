import { Candidate, WorkflowStage, StageStatus, ProfileCompletionStatus, RegistrationSource, MedicalStatus, PassportStatus, PCCStatus, DocumentCategory, DocumentStatus } from '../types';

/**
 * Test Data Generator for Dual-Form Candidate System
 * Creates candidates with various profile completion statuses
 */

const firstNames = ['Amara', 'Kasun', 'Nimali', 'Rohan', 'Sanduni', 'Tharindu', 'Dilini', 'Chamara', 'Priyanka', 'Nuwan', 'Ishara', 'Malith', 'Sachini', 'Dinesh', 'Kavindi'];
const lastNames = ['Fernando', 'Silva', 'Perera', 'Jayawardena', 'Wickramasinghe', 'Gunasekara', 'Rajapaksa', 'Bandara', 'Dissanayake', 'Mendis', 'Kumara', 'Rathnayake'];

const districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kurunegala', 'Anuradhapura'];
const provinces = ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'];

const positions = ['Housemaid', 'Driver', 'Caregiver', 'Nanny', 'Cook', 'Cleaner', 'Factory Worker', 'Construction Worker', 'Security Guard'];

function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): string {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

function generateNIC(): string {
    const year = Math.floor(Math.random() * 30) + 1970;
    const days = Math.floor(Math.random() * 365) + 1;
    return `${year}${days.toString().padStart(3, '0')}${Math.floor(Math.random() * 10000)}V`;
}

function generatePhone(): string {
    return `077${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

function generatePassportNumber(): string {
    return `N${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

/**
 * Generate Quick Add Candidate (20-30% complete)
 */
function generateQuickAddCandidate(index: number): Candidate {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const nic = generateNIC();

    return {
        id: `quick-${Date.now()}-${index}`,
        name,
        phone,
        nic,
        whatsapp: phone,
        email: '',
        address: '',
        dob: '',
        gender: Math.random() > 0.5 ? 'Male' : 'Female',

        // Minimal data
        location: '',
        district: '',
        province: '',
        position: randomElement(positions),

        // Profile completion
        profileCompletionStatus: ProfileCompletionStatus.QUICK,
        profileCompletionPercentage: Math.floor(Math.random() * 10) + 20, // 20-30%
        registrationSource: RegistrationSource.QUICK_ADD,

        // Workflow
        stage: WorkflowStage.REGISTRATION,
        stageStatus: StageStatus.PENDING,
        stageEnteredAt: randomDate(new Date(2024, 0, 1), new Date()),

        // Empty arrays
        workflowLogs: [],
        timelineEvents: [{
            id: `evt-${Date.now()}`,
            type: 'SYSTEM',
            title: 'Quick Add Registration',
            description: 'Candidate added via Quick Add form',
            timestamp: new Date().toISOString(),
            actor: 'Staff User',
            stage: WorkflowStage.REGISTRATION
        }],
        comments: [],
        documents: [],

        // Defaults
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
        role: randomElement(positions),
        experienceYears: 0,
        preferredCountries: [],
        skills: [],
        stageData: {},

        // Empty optional fields
        educationalQualifications: [],
        employmentHistory: [],
        children: []
    };
}

/**
 * Generate Partial Candidate (40-70% complete)
 */
function generatePartialCandidate(index: number): Candidate {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const nic = generateNIC();
    const district = randomElement(districts);
    const province = randomElement(provinces);

    return {
        id: `partial-${Date.now()}-${index}`,
        name,
        phone,
        nic,
        whatsapp: phone,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        address: `${Math.floor(Math.random() * 500) + 1}, ${randomElement(['Main Street', 'Lake Road', 'Temple Road', 'Station Road'])}, ${district}`,
        dob: randomDate(new Date(1970, 0, 1), new Date(2000, 0, 1)),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',

        // Partial data
        location: district,
        district,
        province,
        position: randomElement(positions),
        divisionalSecretariat: `${district} DS`,
        gsDivision: `${district} GS`,

        // Some personal details
        height: { feet: Math.floor(Math.random() * 2) + 5, inches: Math.floor(Math.random() * 12) },
        weight: Math.floor(Math.random() * 30) + 50,
        religion: randomElement(['Buddhist', 'Hindu', 'Christian', 'Islam']),
        maritalStatus: randomElement(['Single', 'Married', 'Divorced']),

        // Some education
        educationalQualifications: [{
            courseName: 'O/L',
            level: 'O/L',
            institute: `${district} Central College`,
            year: (Math.floor(Math.random() * 20) + 1990).toString()
        }],

        // Profile completion
        profileCompletionStatus: ProfileCompletionStatus.PARTIAL,
        profileCompletionPercentage: Math.floor(Math.random() * 30) + 40, // 40-70%
        registrationSource: RegistrationSource.QUICK_ADD,

        // Workflow
        stage: WorkflowStage.REGISTRATION,
        stageStatus: StageStatus.IN_PROGRESS,
        stageEnteredAt: randomDate(new Date(2024, 0, 1), new Date()),

        // Arrays
        workflowLogs: [],
        timelineEvents: [
            {
                id: `evt-${Date.now()}-1`,
                type: 'SYSTEM',
                title: 'Quick Add Registration',
                description: 'Candidate added via Quick Add form',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                actor: 'Staff User',
                stage: WorkflowStage.REGISTRATION
            },
            {
                id: `evt-${Date.now()}-2`,
                type: 'SYSTEM',
                title: 'Profile Partially Updated',
                description: 'Additional information added',
                timestamp: new Date().toISOString(),
                actor: 'Staff User',
                stage: WorkflowStage.REGISTRATION
            }
        ],
        comments: [],
        documents: [],

        // Defaults
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
        role: randomElement(positions),
        experienceYears: Math.floor(Math.random() * 5),
        preferredCountries: [],
        skills: [],
        stageData: {},

        employmentHistory: []
    };
}

/**
 * Generate Complete Candidate (100% complete)
 */
function generateCompleteCandidate(index: number): Candidate {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const nic = generateNIC();
    const district = randomElement(districts);
    const province = randomElement(provinces);
    const passportNumber = generatePassportNumber();
    const passportIssued = randomDate(new Date(2020, 0, 1), new Date(2023, 0, 1));
    const passportExpiry = randomDate(new Date(2030, 0, 1), new Date(2035, 0, 1));

    return {
        id: `complete-${Date.now()}-${index}`,
        name,
        phone,
        nic,
        whatsapp: phone,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        address: `${Math.floor(Math.random() * 500) + 1}, ${randomElement(['Main Street', 'Lake Road', 'Temple Road', 'Station Road'])}, ${district}`,
        dob: randomDate(new Date(1970, 0, 1), new Date(2000, 0, 1)),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',

        // Complete data
        location: district,
        district,
        province,
        position: randomElement(positions),
        divisionalSecretariat: `${district} DS`,
        gsDivision: `${district} GS`,
        drivingLicenseNo: Math.random() > 0.5 ? `B${Math.floor(Math.random() * 1000000)}` : undefined,

        // Personal details
        height: { feet: Math.floor(Math.random() * 2) + 5, inches: Math.floor(Math.random() * 12) },
        weight: Math.floor(Math.random() * 30) + 50,
        religion: randomElement(['Buddhist', 'Hindu', 'Christian', 'Islam']),
        maritalStatus: randomElement(['Single', 'Married']),
        school: `${district} Central College`,

        // Family
        fatherName: `${randomElement(firstNames)} ${lastName}`,
        motherName: `${randomElement(firstNames)} ${lastName}`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,

        // Education
        educationalQualifications: [
            {
                courseName: 'O/L',
                level: 'O/L',
                institute: `${district} Central College`,
                year: (Math.floor(Math.random() * 20) + 1990).toString()
            },
            {
                courseName: 'A/L',
                level: 'A/L',
                institute: `${district} Central College`,
                year: (Math.floor(Math.random() * 20) + 1995).toString()
            }
        ],

        // Employment
        employmentHistory: [
            {
                type: 'Local' as const,
                position: randomElement(positions),
                companyName: `${randomElement(['ABC', 'XYZ', 'Global', 'National'])} Company`,
                years: Math.floor(Math.random() * 5) + 1
            }
        ],

        // Passport
        passportData: {
            passportNumber,
            issuedDate: passportIssued,
            expiryDate: passportExpiry,
            country: 'Sri Lanka',
            status: PassportStatus.VALID,
            validityDays: Math.floor((new Date(passportExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        },

        // PCC
        pccData: {
            issuedDate: randomDate(new Date(2023, 0, 1), new Date()),
            status: PCCStatus.VALID,
            ageDays: Math.floor(Math.random() * 180)
        },

        // Medical
        stageData: {
            medicalStatus: MedicalStatus.COMPLETED,
            medicalNotes: 'All tests passed'
        },

        // Profile completion
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        profileCompletionPercentage: 100,
        registrationSource: RegistrationSource.FULL_FORM,

        // Workflow - varied stages
        stage: randomElement([WorkflowStage.REGISTRATION, WorkflowStage.INTERVIEW_SCHEDULED, WorkflowStage.TRAINING, WorkflowStage.JOB_MATCHING]),
        stageStatus: StageStatus.COMPLETED,
        stageEnteredAt: randomDate(new Date(2024, 0, 1), new Date()),

        // Arrays
        workflowLogs: [],
        timelineEvents: [
            {
                id: `evt-${Date.now()}-1`,
                type: 'SYSTEM',
                title: 'Full Application Submitted',
                description: 'Candidate registered via Digital Application Form',
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                actor: 'Staff User',
                stage: WorkflowStage.REGISTRATION
            },
            {
                id: `evt-${Date.now()}-2`,
                type: 'SYSTEM',
                title: 'Profile Complete',
                description: 'All required information provided',
                timestamp: new Date().toISOString(),
                actor: 'System',
                stage: WorkflowStage.REGISTRATION
            }
        ],
        comments: [],
        documents: [
            {
                id: `doc-${Date.now()}-1`,
                name: 'Passport Copy',
                category: DocumentCategory.MANDATORY_REGISTRATION,
                status: DocumentStatus.APPROVED,
                uploadedAt: new Date().toISOString(),
                url: '#'
            },
            {
                id: `doc-${Date.now()}-2`,
                name: 'CV',
                category: DocumentCategory.MANDATORY_REGISTRATION,
                status: DocumentStatus.APPROVED,
                uploadedAt: new Date().toISOString(),
                url: '#'
            },
            {
                id: `doc-${Date.now()}-3`,
                name: 'Passport Photos',
                category: DocumentCategory.MANDATORY_REGISTRATION,
                status: DocumentStatus.APPROVED,
                uploadedAt: new Date().toISOString(),
                url: '#'
            }
        ],

        // Defaults
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
        role: randomElement(positions),
        experienceYears: Math.floor(Math.random() * 10) + 1,
        preferredCountries: ['Saudi Arabia', 'UAE', 'Qatar'],
        skills: ['Cooking', 'Cleaning', 'Child Care'],

        children: []
    };
}

/**
 * Main function to generate all test data
 */
export function generateAllTestData() {
    const candidates: Candidate[] = [];

    // Generate 5 Quick Add candidates
    console.log('Generating 5 Quick Add candidates...');
    for (let i = 0; i < 5; i++) {
        candidates.push(generateQuickAddCandidate(i));
    }

    // Generate 7 Partial candidates
    console.log('Generating 7 Partial candidates...');
    for (let i = 0; i < 7; i++) {
        candidates.push(generatePartialCandidate(i));
    }

    // Generate 8 Complete candidates
    console.log('Generating 8 Complete candidates...');
    for (let i = 0; i < 8; i++) {
        candidates.push(generateCompleteCandidate(i));
    }

    console.log(`\nGenerated ${candidates.length} test candidates:`);
    console.log(`- Quick Add: 5 (20-30% complete)`);
    console.log(`- Partial: 7 (40-70% complete)`);
    console.log(`- Complete: 8 (100% complete)`);

    return candidates;
}

// Export individual generators for flexibility
export { generateQuickAddCandidate, generatePartialCandidate, generateCompleteCandidate };
