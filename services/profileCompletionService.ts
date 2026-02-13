import { Candidate, ProfileCompletionStatus, PassportStatus, PCCStatus, MedicalStatus, DocumentCategory, DocumentStatus, DocumentType } from '../types';

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

        // 1. Primary Identity (25%)
        // NIC (10%)
        const nic = candidate.personalInfo?.nic || candidate.nic;
        if (nic && nic.length >= 10) score += 10;

        // Passport (15%) - Valid if at least one valid passport exists
        const hasValidPassport = candidate.passports?.some(p => p.status === PassportStatus.VALID) ||
            candidate.passportData?.status === PassportStatus.VALID;
        if (hasValidPassport) score += 15;

        // 2. Contact Authenticity (15%)
        // Primary Phone (10%)
        const phone = candidate.contactInfo?.primaryPhone || candidate.phone;
        if (phone && phone.length >= 10) score += 10;

        // WhatsApp (5%)
        const whatsapp = candidate.contactInfo?.whatsappPhone || candidate.whatsapp;
        if (whatsapp && whatsapp.length >= 10) score += 5;

        // 3. Professional Depth (25%)
        // Education (12.5%)
        const hasEducation = (candidate.professionalProfile?.education && candidate.professionalProfile.education.length > 0) ||
            (candidate.educationalQualifications && candidate.educationalQualifications.length > 0) ||
            (candidate.education && candidate.education.length > 0);
        if (hasEducation) score += 12.5;

        // Experience (12.5%)
        const hasExperience = (candidate.professionalProfile?.employmentHistory && candidate.professionalProfile.employmentHistory.length > 0) ||
            (candidate.employmentHistory && candidate.employmentHistory.length > 0);
        if (hasExperience) score += 12.5;

        // 4. Medical Compliance (15%)
        // Status (10%)
        const medicalStatus = candidate.medicalData?.status || candidate.stageData?.medicalStatus;
        if (medicalStatus === MedicalStatus.COMPLETED) score += 10;

        // Date (5%)
        const medicalDate = candidate.medicalData?.completedDate || candidate.stageData?.medicalCompletedDate;
        if (medicalDate) score += 5;

        // 5. Documents (20%) - Categorized Checklist
        if (candidate.documents && candidate.documents.length > 0) {
            const approvedDocuments = candidate.documents.filter(d => d.status === DocumentStatus.APPROVED);

            // Check for specific mandatory categories
            const hasPassport = approvedDocuments.some(d => d.type === DocumentType.PASSPORT);
            const hasCV = approvedDocuments.some(d => d.type === DocumentType.CV);
            const hasPhoto = approvedDocuments.some(d => d.type === DocumentType.PASSPORT_PHOTOS || d.type === DocumentType.FULL_PHOTO);
            const hasEdu = approvedDocuments.some(d =>
                d.type === DocumentType.EDU_OL ||
                d.type === DocumentType.EDU_AL ||
                d.type === DocumentType.EDU_PROFESSIONAL
            );

            if (hasPassport) score += 5;
            if (hasCV) score += 5;
            if (hasPhoto) score += 5;
            if (hasEdu) score += 5;
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
