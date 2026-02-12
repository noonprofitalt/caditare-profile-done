import { Candidate, ProfileCompletionStatus, PassportStatus, PCCStatus, MedicalStatus, DocumentCategory, DocumentStatus } from '../types';

/**
 * Profile Completion Service
 * Calculates profile completion percentage and identifies missing fields
 */
export class ProfileCompletionService {
    /**
     * Calculate profile completion percentage based on weighted scoring
     * @param candidate - Candidate object to evaluate
     * @returns Completion percentage (0-100)
     */
    static calculateCompletionPercentage(candidate: Partial<Candidate>): number {
        let score = 0;

        // Personal Info (20%)
        const personalFields: (keyof Candidate)[] = ['name', 'nic', 'dob', 'gender', 'address', 'phone'];
        const personalFilled = personalFields.filter(field => {
            const value = candidate[field];
            return value !== undefined && value !== null && value !== '';
        }).length;
        score += (personalFilled / personalFields.length) * 20;

        // Passport Compliance (15%)
        if (candidate.passportData?.status === PassportStatus.VALID) {
            score += 15;
        }

        // Medical Info (10%)
        if (candidate.stageData?.medicalStatus === MedicalStatus.COMPLETED) {
            score += 10;
        }

        // PCC Compliance (10%)
        if (candidate.pccData?.status === PCCStatus.VALID) {
            score += 10;
        }

        // Education (15%)
        if (candidate.educationalQualifications && candidate.educationalQualifications.length > 0) {
            score += 15;
        }

        // Experience (15%)
        if (candidate.employmentHistory && candidate.employmentHistory.length > 0) {
            score += 15;
        }

        // Family Info (10%)
        const familyFields: (keyof Candidate)[] = ['fatherName', 'motherName', 'guardianName'];
        const hasFamilyInfo = familyFields.some(field => {
            const value = candidate[field];
            return value !== undefined && value !== null && value !== '';
        });
        if (hasFamilyInfo) {
            score += 10;
        }

        // Documents (5%)
        if (candidate.documents) {
            const mandatoryDocs = candidate.documents.filter(
                d => d.category === DocumentCategory.MANDATORY_REGISTRATION &&
                    d.status === DocumentStatus.APPROVED
            );
            if (mandatoryDocs.length >= 3) {
                score += 5;
            }
        }

        return Math.round(score);
    }

    /**
     * Get list of missing fields for profile completion
     * @param candidate - Candidate object to evaluate
     * @returns Array of missing field labels
     */
    static getMissingFields(candidate: Partial<Candidate>): string[] {
        const missing: string[] = [];

        // Personal Info
        if (!candidate.name) missing.push('Full Name');
        if (!candidate.nic) missing.push('NIC');
        if (!candidate.dob) missing.push('Date of Birth');
        if (!candidate.gender) missing.push('Gender');
        if (!candidate.address) missing.push('Address');
        if (!candidate.phone) missing.push('Phone Number');

        // Passport Compliance
        if (!candidate.passportData || candidate.passportData.status !== PassportStatus.VALID) {
            missing.push('Valid Passport Information');
        }

        // Medical Info
        if (!candidate.stageData?.medicalStatus || candidate.stageData.medicalStatus !== MedicalStatus.COMPLETED) {
            missing.push('Medical Examination (Completed)');
        }

        // PCC Compliance
        if (!candidate.pccData || candidate.pccData.status !== PCCStatus.VALID) {
            missing.push('Valid Police Clearance Certificate');
        }

        // Education
        if (!candidate.educationalQualifications || candidate.educationalQualifications.length === 0) {
            missing.push('Educational Qualifications');
        }

        // Experience
        if (!candidate.employmentHistory || candidate.employmentHistory.length === 0) {
            missing.push('Employment History');
        }

        // Family Info
        const hasFamilyInfo = candidate.fatherName || candidate.motherName || candidate.guardianName;
        if (!hasFamilyInfo) {
            missing.push('Family Information (Father/Mother/Guardian)');
        }

        // Documents
        if (!candidate.documents) {
            missing.push('Mandatory Documents (Passport, CV, Photos)');
        } else {
            const mandatoryDocs = candidate.documents.filter(
                d => d.category === DocumentCategory.MANDATORY_REGISTRATION &&
                    d.status === DocumentStatus.APPROVED
            );
            if (mandatoryDocs.length < 3) {
                missing.push('Mandatory Documents (Need at least 3 approved)');
            }
        }

        return missing;
    }

    /**
     * Determine profile completion status based on percentage
     * @param percentage - Completion percentage
     * @returns ProfileCompletionStatus enum value
     */
    static getProfileCompletionStatus(percentage: number): ProfileCompletionStatus {
        if (percentage >= 100) {
            return ProfileCompletionStatus.COMPLETE;
        } else if (percentage > 30) {
            return ProfileCompletionStatus.PARTIAL;
        } else {
            return ProfileCompletionStatus.QUICK;
        }
    }

    /**
     * Update candidate with calculated completion data
     * @param candidate - Candidate object to update
     * @returns Updated candidate with completion fields
     */
    static updateCompletionData(candidate: Candidate): Candidate {
        const percentage = this.calculateCompletionPercentage(candidate);
        const status = this.getProfileCompletionStatus(percentage);

        return {
            ...candidate,
            profileCompletionPercentage: percentage,
            profileCompletionStatus: status
        };
    }
}
