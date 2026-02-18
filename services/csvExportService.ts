import { Candidate, DocumentType, DocumentStatus, WorkflowStage, MedicalStatus, PassportStatus, PCCStatus } from '../types';

export const convertToCSV = (objArray: any[]) => {
    if (!objArray || objArray.length === 0) return '';

    const candidates: Candidate[] = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    // Define all headers covering every aspect of the Candidate interface
    const headers = [
        // System / Core
        'System: ID',
        'System: Candidate Code',
        'System: Audit Created At',
        'System: Audit Created By',
        'System: Audit Updated At',
        'System: Audit Updated By',
        'System: Avatar URL',

        // Critical Workflow
        'Workflow: Status',
        'Workflow: Stage',
        'Workflow: Stage Status',
        'Workflow: Profile Completion %',
        'Workflow: Registration Source',
        'Workflow: Risk Score',
        'Workflow: SLA Status',
        'Workflow: Days in Stage',

        // Personal Information (Detailed)
        'Personal: Full Name',
        'Personal: First Name',
        'Personal: Middle Name',
        // 'Personal: Last Name', // Removed
        'Personal: NIC',
        'Personal: Date of Birth',
        'Personal: Age',
        'Personal: Gender',
        'Personal: Marital Status',
        'Personal: Religion',
        'Personal: Nationality',
        'Personal: Civil Status',
        'Personal: Screen Name',

        // Family Details
        'Family: Spouse Name',
        'Family: Father Name',
        'Family: Mother Name',
        'Family: Children Count',
        'Family: Children Details', // JSON stringified or joined
        'Family: Guardian Name',
        'Family: Guardian ID',
        'Family: Guardian Contact',
        'Family: Guardian Birthday',

        // Contact Information
        'Contact: Primary Phone',
        'Contact: Whatsapp',
        'Contact: Secondary Phone',
        'Contact: Additional Phones',
        'Contact: Email',
        'Contact: Secondary Email',

        // Address
        'Address: Current Address',
        'Address: City',
        'Address: District',
        'Address: Province',
        'Address: GS Division',
        'Address: Divisional Secretariat',

        // Physical Attributes
        'Physical: Height (Feet)',
        'Physical: Height (Inches)',
        'Physical: Weight (kg)',

        // Professional Profile
        'Professional: Job Roles',
        'Professional: Role',
        'Professional: Experience (Years)',
        'Professional: Skills',
        'Professional: Education Levels',
        'Professional: School',
        'Professional: O/L Year',
        'Professional: A/L Year',
        'Professional: Training Details',
        'Professional: Special Achievements',
        'Professional: Educational Qualifications', // Detailed string
        'Professional: Employment History', // Detailed string

        // Preferences & Job
        'Job: Preferred Countries',
        'Job: Target Country',
        'Job: Assigned Job ID',
        'Job: Assigned Employer ID',
        'Job: Application Date',
        'Job: Office Selection',
        'Job: Office Remark',
        'Job: Reference No',

        // Emergency Contact
        'Emergency: Name',
        'Emergency: Relation',
        'Emergency: Phone',
        'Emergency: Address',

        // Passport Data (Primary)
        'Passport: Number',
        'Passport: Issued Date',
        'Passport: Expiry Date',
        'Passport: Country',
        'Passport: Status',
        'Passport: Validity Days',
        'Passport: All Passports', // List of other passports

        // Medical Data
        'Medical: Status',
        'Medical: Scheduled Date',
        'Medical: Completed Date',
        'Medical: Blood Group',
        'Medical: Allergies',
        'Medical: Notes',
        'Medical: Records Summary',

        // Police Clearance (PCC)
        'PCC: Status',
        'PCC: Issued Date',
        'PCC: Expiry Date',
        'PCC: Age (Days)',
        'PCC: Last Inspection',

        // Driving License
        'Driving: License No',

        // SLBFE Data
        'SLBFE: Registration Number',
        'SLBFE: Registration Date',
        'SLBFE: Training Date',
        'SLBFE: Training Institute',
        'SLBFE: Certificate No',
        'SLBFE: Insurance Provider',
        'SLBFE: Insurance Policy No',
        'SLBFE: Insurance Expiry',
        'SLBFE: Insurance Premium',
        'SLBFE: Biometric Status',
        'SLBFE: Job Order ID',
        'SLBFE: Agreement ID',
        'SLBFE: Agreement Status',
        'SLBFE: Deployment Approval Date',

        // Family Consent
        'Consent: Is Given',
        'Consent: Signatory Name',
        'Consent: Relation',
        'Consent: Verified By',
        'Consent: Verification Date',

        // Documents
        'Documents: Missing Count',
        'Documents: Missing List',
        'Documents: Rejected Count',
        'Documents: Rejected List',
        'Documents: Total Uploaded',

        // Stage Data Specifics
        'Stage Data: Medical Status',
        'Stage Data: Police Status',
        'Stage Data: Visa Status',
        'Stage Data: Employer Status',
        'Stage Data: Ticket Status',
        'Stage Data: Payment Status',
        'Stage Data: Payment Notes'
    ];

    str += headers.join(',') + '\r\n';

    for (const candidate of candidates) {
        // --- PRE-CALCULATIONS & EXTRACTIONS ---

        // Missing/Rejected Documents
        const validDocs = candidate.documents || [];
        const missingDocs = validDocs.filter((d: any) => d.status === DocumentStatus.MISSING);
        const rejectedDocs = validDocs.filter((d: any) => d.status === DocumentStatus.REJECTED || d.status === DocumentStatus.CORRECTION_REQUIRED);

        // Risk & SLA (Logic from previous implementation / ReportService)
        const missingInfoFields: string[] = [];
        if (!candidate.nic) missingInfoFields.push('NIC');
        if (!candidate.personalInfo?.dob && !candidate.dob) missingInfoFields.push('DOB');

        const entryDate = new Date(candidate.stageEnteredAt || new Date().toISOString());
        const now = new Date();
        const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        const slaStatus = daysInStage > 14 ? 'CRITICAL' : daysInStage > 7 ? 'WARNING' : 'ON_TRACK';

        const riskPoints = (missingInfoFields.length * 2) + (rejectedDocs.length * 3) + (missingDocs.length * 1) + (slaStatus === 'CRITICAL' ? 10 : 0);
        const riskScore = riskPoints > 15 ? 'HIGH' : riskPoints > 5 ? 'MEDIUM' : 'LOW';

        // Helpers for complex fields
        const formatDate = (dateString?: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';
        const escapeCsv = (val: any) => {
            if (val === null || val === undefined) return '';
            const stringVal = String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        };
        const formatList = (list?: any[]) => list ? list.map(i => typeof i === 'object' ? JSON.stringify(i) : i).join('; ') : '';

        // --- MAPPING VALUES ---
        const row = [
            // System
            candidate.id,
            candidate.candidateCode,
            candidate.audit?.createdAt,
            candidate.audit?.createdBy,
            candidate.audit?.updatedAt,
            candidate.audit?.updatedBy,
            candidate.avatarUrl,

            // Workflow
            candidate.profileCompletionStatus,
            candidate.stage,
            candidate.stageStatus,
            candidate.profileCompletionPercentage,
            candidate.registrationSource,
            riskScore,
            slaStatus,
            daysInStage,

            // Personal Info (Flattened from root + personalInfo object)
            // Priority to personalInfo object, fallback to root legacy fields
            candidate.personalInfo?.fullName || candidate.name,
            candidate.personalInfo?.firstName || candidate.firstName,
            candidate.personalInfo?.middleName || candidate.middleName,
            // Removed lastName as it is not in the interface
            candidate.personalInfo?.nic || candidate.nic,
            formatDate(candidate.personalInfo?.dob || candidate.dob),
            candidate.personalInfo?.age,
            candidate.personalInfo?.gender || candidate.gender,
            candidate.personalInfo?.maritalStatus || candidate.maritalStatus,
            candidate.personalInfo?.religion || candidate.religion,
            candidate.personalInfo?.nationality || candidate.nationality,
            candidate.personalInfo?.civilStatus,
            (candidate.personalInfo as any)?.screenName, // Type assertion if not in main interface but in data

            // Family
            candidate.personalInfo?.spouseName || candidate.spouseName,
            candidate.personalInfo?.fatherName || candidate.fatherName,
            candidate.personalInfo?.motherName || candidate.motherName,
            candidate.personalInfo?.children?.length || candidate.numberOfChildren || 0,
            JSON.stringify(candidate.personalInfo?.children || candidate.children || []),
            candidate.guardianName, // Legacy root
            candidate.guardianIdNo,
            candidate.guardianContact,
            formatDate(candidate.guardianBirthday),

            // Contact
            candidate.contactInfo?.primaryPhone || candidate.phone,
            candidate.contactInfo?.whatsappPhone || candidate.whatsapp,
            candidate.contactInfo?.additionalPhones ? candidate.contactInfo.additionalPhones.join('; ') : candidate.secondaryPhone,
            formatList(candidate.additionalContactNumbers),
            candidate.contactInfo?.email || candidate.email,
            candidate.secondaryEmail,

            // Address
            candidate.personalInfo?.address || candidate.address,
            candidate.personalInfo?.city || candidate.city,
            candidate.personalInfo?.district || candidate.district,
            candidate.personalInfo?.province || candidate.province,
            candidate.personalInfo?.gsDivision || candidate.gsDivision,
            candidate.personalInfo?.divisionalSecretariat || candidate.divisionalSecretariat,

            // Physical
            candidate.personalInfo?.height?.feet || candidate.height?.feet,
            candidate.personalInfo?.height?.inches || candidate.height?.inches,
            candidate.personalInfo?.weight || candidate.weight,

            // Professional
            formatList(candidate.professionalProfile?.jobRoles || candidate.jobRoles),
            candidate.role || candidate.professionalProfile?.jobRoles?.[0] || '', // Primary role
            candidate.professionalProfile?.experienceYears || candidate.experienceYears,
            formatList(candidate.professionalProfile?.skills || candidate.skills),
            formatList(candidate.professionalProfile?.education || candidate.education),
            candidate.professionalProfile?.school || candidate.school,
            candidate.professionalProfile?.gceOL?.year || candidate.gceOL?.year,
            candidate.professionalProfile?.gceAL?.year || candidate.gceAL?.year,
            candidate.professionalProfile?.trainingDetails || candidate.trainingDetails,
            candidate.professionalProfile?.specialAchievements || candidate.specialAchievements,
            // Complex objects JSON stringified for safety
            JSON.stringify(candidate.professionalProfile?.educationalQualifications || candidate.educationalQualifications || []),
            JSON.stringify(candidate.professionalProfile?.employmentHistory || candidate.employmentHistory || []),

            // Preferences & Job
            formatList(candidate.preferredCountries),
            candidate.targetCountry || candidate.country,
            candidate.jobId,
            candidate.employerId,
            formatDate(candidate.applicationDate),
            candidate.officeSelection,
            candidate.officeRemark,
            candidate.refNo,

            // Emergency
            candidate.contactInfo?.emergencyContact?.name,
            candidate.contactInfo?.emergencyContact?.relation,
            candidate.contactInfo?.emergencyContact?.phone,
            candidate.contactInfo?.emergencyContact?.address,

            // Passport (Primary)
            candidate.passportData?.passportNumber,
            formatDate(candidate.passportData?.issuedDate),
            formatDate(candidate.passportData?.expiryDate),
            candidate.passportData?.country,
            candidate.passportData?.status,
            candidate.passportData?.validityDays,
            JSON.stringify(candidate.passports || []),

            // Medical
            candidate.medicalData?.status,
            formatDate(candidate.medicalData?.scheduledDate),
            formatDate(candidate.medicalData?.completedDate),
            candidate.medicalData?.bloodGroup,
            candidate.medicalData?.allergies,
            candidate.medicalData?.notes,
            JSON.stringify(candidate.medicalData?.medicalRecords || []),

            // PCC
            candidate.pccData?.status,
            formatDate(candidate.pccData?.issuedDate),
            formatDate(candidate.pccData?.expiryDate),
            candidate.pccData?.ageDays,
            formatDate(candidate.pccData?.lastInspectionDate),

            // Driving
            candidate.personalInfo?.drivingLicenseNo || candidate.drivingLicenseNo,

            // SLBFE
            candidate.slbfeData?.registrationNumber,
            formatDate(candidate.slbfeData?.registrationDate),
            formatDate(candidate.slbfeData?.trainingDate),
            candidate.slbfeData?.trainingInstitute,
            candidate.slbfeData?.trainingCertificateNo,
            candidate.slbfeData?.insuranceProvider,
            candidate.slbfeData?.insurancePolicyNumber,
            formatDate(candidate.slbfeData?.insuranceExpiryDate),
            candidate.slbfeData?.insurancePremium,
            candidate.slbfeData?.biometricStatus,
            candidate.slbfeData?.jobOrderId || candidate.jobOrderId,
            candidate.slbfeData?.agreementId,
            candidate.slbfeData?.agreementStatus,
            formatDate(candidate.slbfeData?.deploymentApprovalDate),

            // Family Consent
            candidate.slbfeData?.familyConsent?.isGiven ? 'Yes' : 'No',
            candidate.slbfeData?.familyConsent?.signatoryName,
            candidate.slbfeData?.familyConsent?.signatoryRelation,
            candidate.slbfeData?.familyConsent?.verifiedBy,
            formatDate(candidate.slbfeData?.familyConsent?.verificationDate),

            // Documents
            missingDocs.length,
            missingDocs.map((d: any) => d.type).join('; '),
            rejectedDocs.length,
            rejectedDocs.map((d: any) => d.type).join('; '),
            candidate.documents ? candidate.documents.length : 0,

            // Stage Data
            candidate.stageData?.medicalStatus,
            candidate.stageData?.policeStatus,
            candidate.stageData?.visaStatus,
            candidate.stageData?.employerStatus,
            candidate.stageData?.ticketStatus,
            candidate.stageData?.paymentStatus,
            candidate.stageData?.paymentNotes
        ];

        str += row.map(escapeCsv).join(',') + '\r\n';
    }

    return str;
};
