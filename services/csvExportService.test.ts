
import { describe, it, expect } from 'vitest';
import { convertToCSV } from './csvExportService';
import { Candidate, WorkflowStage, ProfileCompletionStatus, StageStatus, RegistrationSource, DocumentType, DocumentStatus, DocumentCategory, MedicalStatus, PassportStatus, PCCStatus, EmploymentHistory } from '../types';

describe('csvExportService', () => {
    it('should export all candidate fields to CSV', () => {
        const mockCandidate: Candidate = {
            id: '123',
            candidateCode: 'GW-2024-0001',
            regNo: 'SPA 19-240101',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            whatsapp: '+0987654321',
            secondaryPhone: '+1122334455',
            secondaryEmail: 'john.secondary@example.com',
            nic: '123456789V',
            stage: WorkflowStage.REGISTERED,
            profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
            registrationSource: RegistrationSource.FULL_FORM,
            profileCompletionPercentage: 100,
            stageStatus: StageStatus.PENDING,
            stageEnteredAt: new Date().toISOString(),
            stageData: {
                medicalStatus: MedicalStatus.COMPLETED,
                policeStatus: 'Issued',
                visaStatus: 'Approved',
                employerStatus: 'Selected',
                paymentStatus: 'Completed',
                medicalNotes: 'Fit for work'
            },
            personalInfo: {
                fullName: 'Johnathan Doe',
                firstName: 'John',
                middleName: 'Quincy',
                lastName: 'Doe',
                nic: '123456789V',
                dob: '1990-01-01',
                age: 34,
                gender: 'Male',
                maritalStatus: 'Married',
                religion: 'Buddhism',
                address: '123 Main St',
                city: 'Colombo',
                district: 'Colombo',
                province: 'Western',
                nationality: 'Sri Lankan',
                drivingLicenseNo: 'B1234567',
                height: { feet: 5, inches: 10 },
                weight: 70,
                civilStatus: 'Married',
                screenName: 'JohnD',
                fatherName: 'Father Doe',
                motherName: 'Mother Doe',
                spouseName: 'Jane Doe',
                school: 'Royal College',
                children: [{ name: 'Child 1', dob: '2020-01-01' }]
            },
            contactInfo: {
                primaryPhone: '+1234567890',
                whatsappPhone: '+0987654321',
                additionalPhones: ['+111', '+222'],
                email: 'john@example.com',
                emergencyContact: {
                    name: 'Jane Doe',
                    relation: 'Spouse',
                    phone: '+9876543210',
                    address: 'Same as above'
                }
            },
            professionalProfile: {
                jobRoles: ['Carpenter', { title: 'Driver', experienceYears: 2, skillLevel: 'Skilled' }],
                experienceYears: 5,
                skills: ['Woodworking', 'Driving'],
                education: ['OL', 'AL'],
                educationalQualifications: [
                    { courseName: 'Carpentry NVQ', level: 'NVQ 4', institute: 'VTA', year: '2010' }
                ],
                employmentHistory: [
                    { type: 'Local', position: 'Carpenter', companyName: 'ABC Construction', years: 2 },
                    { type: 'Foreign', position: 'Mason', companyName: 'XYZ Builders', country: 'Qatar', years: 3 }
                ],
                trainingDetails: 'Safety Training',
                specialAchievements: 'Best Employee 2022',
                school: 'Royal College',
                gceOL: { year: '2006' },
                gceAL: { year: '2009' }
            },
            medicalData: {
                status: MedicalStatus.COMPLETED,
                bloodGroup: 'O+',
                allergies: 'None',
                scheduledDate: '2024-01-01',
                completedDate: '2024-01-02',
                notes: 'All good',
                medicalRecords: [
                    { date: '2024-01-02', type: 'Full Medical', result: 'Pass', clinic: 'City Med', reportUrl: 'http://example.com/med.pdf' }
                ]
            },
            passportData: {
                passportNumber: 'N1234567',
                issuedDate: '2020-01-01',
                expiryDate: '2030-01-01',
                country: 'Sri Lanka',
                status: PassportStatus.VALID,
                validityDays: 2000
            },
            passports: [{
                passportNumber: 'N1234567',
                issuedDate: '2020-01-01',
                expiryDate: '2030-01-01',
                country: 'Sri Lanka',
                status: PassportStatus.VALID,
                validityDays: 2000
            }],
            pccData: {
                issuedDate: '2024-01-01',
                expiryDate: '2024-07-01',
                status: PCCStatus.VALID,
                ageDays: 10,
                lastInspectionDate: '2024-01-05'
            },
            slbfeData: {
                registrationNumber: 'SLBFE123',
                registrationDate: '2024-02-01',
                trainingDate: '2024-02-05',
                trainingInstitute: 'SLBFE Center',
                trainingCertificateNo: 'TR123',
                insuranceProvider: 'Allianz',
                insurancePolicyNumber: 'POL123',
                insuranceExpiryDate: '2026-02-01',
                insurancePremium: 5000,
                biometricStatus: 'Completed',
                familyConsent: {
                    isGiven: true,
                    signatoryName: 'Jane Doe',
                    signatoryRelation: 'Spouse',
                    verifiedBy: 'GN Officer',
                    verificationDate: '2024-01-15'
                },
                jobOrderId: 'JO123',
                agreementId: 'AG123',
                agreementStatus: 'Approved',
                deploymentApprovalDate: '2024-03-01'
            },
            workflowLogs: [],
            timelineEvents: [],
            comments: [],
            documents: [
                {
                    id: 'doc1',
                    type: DocumentType.PASSPORT,
                    category: DocumentCategory.MANDATORY_REGISTRATION,
                    status: DocumentStatus.APPROVED,
                    version: 1,
                    logs: []
                }
            ],
            preferredCountries: ['Romania', 'Poland'],
            avatarUrl: 'http://example.com/avatar.jpg',
            audit: {
                createdAt: '2024-01-01T00:00:00Z',
                createdBy: 'Admin',
                updatedAt: '2024-01-02T00:00:00Z',
                updatedBy: 'Admin',
                version: 1
            },
            // Legacy fields population for completeness
            firstName: 'John',
            middleName: 'Quincy',
            dob: '1990-01-01',
            gender: 'Male',
            address: '123 Main St',
            city: 'Colombo',
            province: 'Western',
            divisionalSecretariat: 'Colombo DS',
            gsDivision: 'Colombo Central',
            district: 'Colombo',
            nationality: 'Sri Lankan',
            drivingLicenseNo: 'B1234567',
            height: { feet: 5, inches: 10 },
            weight: 70,
            religion: 'Buddhism',
            maritalStatus: 'Married',
            numberOfChildren: 1,
            school: 'Royal College',
            gceOL: { year: '2006' },
            gceAL: { year: '2009' },
            educationalQualifications: [],
            employmentHistory: [],
            trainingDetails: 'Safety Training',
            specialAchievements: 'Best Employee',
            fatherName: 'Father Doe',
            motherName: 'Mother Doe',
            spouseName: 'Jane Doe',
            guardianName: 'Jane Doe',
            guardianIdNo: '987654321V',
            guardianBirthday: '1992-01-01',
            guardianContact: '+9876543210',
            experienceYears: 5,
            role: 'Carpenter',
            location: 'Colombo',
            country: 'Sri Lanka',
            applicationDate: '2024-01-01',
            officeSelection: 'Colombo Office',
            officeRemark: 'Good candidate',
            refNo: 'REF123',
            targetCountry: 'Romania',
            skills: ['Woodworking'],
            jobRoles: ['Carpenter']

        };

        const csv = convertToCSV([mockCandidate]);

        // Basic check
        expect(csv).toContain('GW-2024-0001');

        // Check for fields that are likely missing in the current implementation
        // Personal Info
        expect(csv).toContain('Personal: Full Name');
        expect(csv).toContain('Johnathan Doe');
        expect(csv).toContain('Family: Father Name');
        expect(csv).toContain('Father Doe');

        // Professional Info
        expect(csv).toContain('Professional: Skills');
        expect(csv).toContain('Woodworking');
        expect(csv).toContain('Professional: School');
        expect(csv).toContain('Royal College');

        // SLBFE Data
        expect(csv).toContain('SLBFE: Registration Number');
        expect(csv).toContain('SLBFE123');
        expect(csv).toContain('SLBFE: Insurance Provider');
        expect(csv).toContain('Allianz');

        // Passport Data
        expect(csv).toContain('Passport: Number');
        expect(csv).toContain('N1234567');
        expect(csv).toContain('Passport: Expiry Date');
        expect(csv).toContain('2030-01-01');

        // Medical Data
        expect(csv).toContain('Medical: Blood Group');
        expect(csv).toContain('O+');

        // Contact Info
        expect(csv).toContain('Emergency: Name');
        expect(csv).toContain('Jane Doe');

    });
});
