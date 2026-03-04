import { Candidate, WorkflowStage, StageStatus, ProfileCompletionStatus, RegistrationSource, PersonalInfo, ContactInfo, ProfessionalProfile } from '../types';

/**
 * DataSyncService
 * Handles bidirectional synchronization between Flat Legacy Fields and Normalized Nested Structures.
 * Ensures data integrity across forms, profile views, and services.
 */
export class DataSyncService {
    /**
     * Synchronizes flat fields TO nested structures.
     * Useful when data is coming from a form that uses flat fields (like QuickAddForm).
     */
    static syncToNested(candidate: Partial<Candidate>): Partial<Candidate> {
        const result = { ...candidate };

        // 1. Personal Info Sync
        const currentPI = result.personalInfo || {} as PersonalInfo;

        // Surname + OtherNames -> Full Name fallback
        const surname = currentPI.surname || result.surname || '';
        const otherNames = currentPI.otherNames || result.otherNames || '';
        const name = currentPI.fullName || result.name || `${otherNames} ${surname}`.trim();

        const personalInfo: PersonalInfo = {
            ...currentPI,
            fullName: name,
            surname: surname,
            otherNames: otherNames,
            firstName: currentPI.firstName || result.firstName || otherNames,
            middleName: currentPI.middleName || result.middleName || '',
            nic: currentPI.nic || result.nic || '',
            dob: currentPI.dob || result.dob || '',
            gender: currentPI.gender || result.gender || '',
            address: currentPI.address || result.address || '',
            city: currentPI.city || result.city || '',
            province: currentPI.province || result.province || '',
            district: currentPI.district || result.district || result.city || '',
            divisionalSecretariat: currentPI.divisionalSecretariat || result.divisionalSecretariat || '',
            gsDivision: currentPI.gsDivision || result.gsDivision || '',
            drivingLicenseNo: currentPI.drivingLicenseNo || result.drivingLicenseNo || '',
            nationality: currentPI.nationality || result.nationality || 'Sri Lankan',
            placeOfBirth: currentPI.placeOfBirth || result.placeOfBirth || '',
            passportProfession: currentPI.passportProfession || result.passportProfession || '',
            maritalStatus: (currentPI.maritalStatus || result.maritalStatus || 'Single') as any,
            spouseName: currentPI.spouseName || result.spouseName || '',
            fatherName: currentPI.fatherName || result.fatherName || '',
            motherName: currentPI.motherName || result.motherName || '',
        };
        result.personalInfo = personalInfo;

        // 2. Contact Info Sync
        const currentCI = result.contactInfo || {} as ContactInfo;
        const contactInfo: ContactInfo = {
            ...currentCI,
            primaryPhone: currentCI.primaryPhone || result.phone || '',
            whatsappPhone: currentCI.whatsappPhone || result.whatsapp || result.phone || '',
            email: currentCI.email || result.email || '',
            additionalPhones: currentCI.additionalPhones || result.additionalContactNumbers || (result.secondaryPhone ? [result.secondaryPhone] : [])
        };
        result.contactInfo = contactInfo;

        // 3. Professional Profile Sync
        const currentPP = result.professionalProfile || {} as ProfessionalProfile;
        const professionalProfile: ProfessionalProfile = {
            ...currentPP,
            jobRoles: currentPP.jobRoles?.length ? currentPP.jobRoles : (result.jobRoles || (result.role ? [result.role] : [])),
            experienceYears: currentPP.experienceYears ?? result.experienceYears,
            skills: currentPP.skills?.length ? currentPP.skills : (result.skills || []),
            education: currentPP.education?.length ? currentPP.education : (result.education || []),
            educationalQualifications: currentPP.educationalQualifications?.length ? currentPP.educationalQualifications : (result.educationalQualifications || []),
            employmentHistory: currentPP.employmentHistory?.length ? currentPP.employmentHistory : (result.employmentHistory || []),
            trainingDetails: currentPP.trainingDetails || result.trainingDetails || '',
            specialAchievements: currentPP.specialAchievements || result.specialAchievements || '',
            school: currentPP.school || result.school || ''
        };
        result.professionalProfile = professionalProfile;

        return result;
    }

    /**
     * Synchronizes nested structures BACK to flat fields.
     * Useful for legacy components, search indexing, or backward compatibility.
     */
    static syncToFlat(candidate: Partial<Candidate>): Partial<Candidate> {
        const result = { ...candidate };

        if (result.personalInfo) {
            const pi = result.personalInfo;
            result.name = pi.fullName || result.name || '';
            result.surname = pi.surname || result.surname || '';
            result.otherNames = pi.otherNames || result.otherNames || '';
            result.firstName = pi.firstName || result.firstName || '';
            result.nic = pi.nic || result.nic || '';
            result.dob = pi.dob || result.dob || '';
            result.gender = pi.gender || result.gender || '';
            result.address = pi.address || result.address || '';
            result.city = pi.city || result.city || '';
            result.province = pi.province || result.province || '';
            result.district = pi.district || result.district || '';
            result.divisionalSecretariat = pi.divisionalSecretariat || result.divisionalSecretariat || '';
            result.gsDivision = pi.gsDivision || result.gsDivision || '';
            result.nationality = pi.nationality || result.nationality || '';
            result.placeOfBirth = pi.placeOfBirth || result.placeOfBirth || '';
            result.passportProfession = pi.passportProfession || result.passportProfession || '';
            result.drivingLicenseNo = pi.drivingLicenseNo || result.drivingLicenseNo || '';
            result.religion = pi.religion || result.religion || '';
            result.maritalStatus = pi.maritalStatus || result.maritalStatus || 'Single';
            result.fatherName = pi.fatherName || result.fatherName || '';
            result.motherName = pi.motherName || result.motherName || '';
            result.spouseName = pi.spouseName || result.spouseName || '';
            result.school = pi.school || result.school || '';
            result.height = pi.height || result.height;
            result.weight = pi.weight || result.weight;

            // Paper form header & specific family fields
            result.companyName = (pi as any).companyName || (result as any).companyName || '';
            result.fatherAge = (pi as any).fatherAge || (result as any).fatherAge;
            result.fatherNic = (pi as any).fatherNic || (result as any).fatherNic;
            result.motherAge = (pi as any).motherAge || (result as any).motherAge;
            result.motherNic = (pi as any).motherNic || (result as any).motherNic;
            result.spouseAge = (pi as any).spouseAge || (result as any).spouseAge;
            result.spouseNic = (pi as any).spouseNic || (result as any).spouseNic;
            result.usdRateEmb = (result as any).usdRateEmb;
            result.usdRateFA = (result as any).usdRateFA;
        }

        if (result.contactInfo) {
            const ci = result.contactInfo;
            result.phone = ci.primaryPhone || result.phone || '';
            result.whatsapp = ci.whatsappPhone || result.whatsapp || '';
            result.email = ci.email || result.email || '';
            result.secondaryPhone = (ci.additionalPhones && ci.additionalPhones.length > 0) ? ci.additionalPhones[0] : (result.secondaryPhone || '');
            result.additionalContactNumbers = ci.additionalPhones || result.additionalContactNumbers || [];
        }

        if (result.professionalProfile) {
            const pp = result.professionalProfile;
            result.skills = pp.skills || result.skills || [];
            result.education = pp.education || result.education || [];
            result.experienceYears = pp.experienceYears ?? result.experienceYears;
            result.jobRoles = pp.jobRoles || result.jobRoles || [];
            result.educationalQualifications = pp.educationalQualifications || result.educationalQualifications || [];
            result.employmentHistory = pp.employmentHistory || result.employmentHistory || [];
            result.trainingDetails = pp.trainingDetails || result.trainingDetails || '';
            result.specialAchievements = pp.specialAchievements || result.specialAchievements || '';
            result.school = pp.school || result.school || '';

            // First job role title as main role
            if (pp.jobRoles && pp.jobRoles.length > 0) {
                const firstRole = pp.jobRoles[0];
                result.role = typeof firstRole === 'string' ? firstRole : firstRole.title;
            }
        }

        // Shared field sync for paper forms and specific mappings
        result.companyName = (result.personalInfo as any)?.companyName || (result as any).companyName || '';
        result.fatherAge = (result.personalInfo as any)?.fatherAge || (result as any).fatherAge;
        result.fatherNic = (result.personalInfo as any)?.fatherNic || (result as any).fatherNic;
        result.motherAge = (result.personalInfo as any)?.motherAge || (result as any).motherAge;
        result.motherNic = (result.personalInfo as any)?.motherNic || (result as any).motherNic;
        result.spouseAge = (result.personalInfo as any)?.spouseAge || (result as any).spouseAge;
        result.spouseNic = (result.personalInfo as any)?.spouseNic || (result as any).spouseNic;
        result.usdRateEmb = (result as any).usdRateEmb;
        result.usdRateFA = (result as any).usdRateFA;
        result.placeOfBirth = result.personalInfo?.placeOfBirth || result.placeOfBirth || '';
        result.passportProfession = result.personalInfo?.passportProfession || result.passportProfession || '';
        result.drivingLicenseNo = result.personalInfo?.drivingLicenseNo || result.drivingLicenseNo || '';
        result.religion = result.personalInfo?.religion || result.religion || '';
        result.height = result.personalInfo?.height ?? result.height;
        result.weight = result.personalInfo?.weight ?? result.weight;

        return result;
    }

    /**
     * Performs a full bidirectional sync to ensure absolute parity.
     */
    static fullSync(candidate: Partial<Candidate>): Candidate {
        // Sync to nested first (treats flat as priority if both exist but differ)
        let synced = this.syncToNested(candidate);
        // Then sync back to flat to ensure consistency
        synced = this.syncToFlat(synced);
        return synced as Candidate;
    }
}
