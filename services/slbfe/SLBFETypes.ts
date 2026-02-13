export interface SLBFEChecklistItem {
    label: string;
    isMandatory: boolean;
    status: 'Complete' | 'Pending' | 'Failed';
    details?: string;
}

export interface DeploymentCertificate {
    certificateId: string;
    issuedDate: string;
    candidateName: string;
    passportNumber: string;
    slbfeRegNo: string;
    insurancePolicyNo: string;
    validUntil: string; // Typically visa or insurance expiry
    authorizedBy: string;
}

export interface SLBFEValidationReport {
    isEligibleForTicketing: boolean;
    checklist: SLBFEChecklistItem[];
    missingRequirements: string[];
    certificate?: DeploymentCertificate;
}
