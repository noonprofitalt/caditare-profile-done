import { BiometricStatus, Candidate, DocumentStatus, DocumentType, MedicalStatus, PassportStatus } from '../../types';
import { DeploymentCertificate, SLBFEChecklistItem, SLBFEValidationReport } from './SLBFETypes';

export class SLBFEAutomationEngine {

    /**
     * Main Public Interface: Validate if a candidate can proceed to TICKETING stage
     */
    static validateForTicketing(candidate: Candidate): SLBFEValidationReport {
        const checklist = this.generateChecklist(candidate);
        const missingRequirements = checklist
            .filter(item => item.isMandatory && item.status !== 'Complete')
            .map(item => item.label);

        const isEligible = missingRequirements.length === 0;

        let certificate: DeploymentCertificate | undefined = undefined;
        if (isEligible) {
            certificate = this.generateDeploymentCertificate(candidate);
        }

        return {
            isEligibleForTicketing: isEligible,
            checklist,
            missingRequirements,
            certificate
        };
    }

    /**
     * Generates a step-by-step compliance checklist
     */
    static generateChecklist(candidate: Candidate): SLBFEChecklistItem[] {
        const slbfeData = candidate.slbfeData;
        const items: SLBFEChecklistItem[] = [];

        // 1. SLBFE Registration
        items.push({
            label: 'SLBFE Registration Number',
            isMandatory: true,
            status: slbfeData?.registrationNumber ? 'Complete' : 'Pending',
            details: slbfeData?.registrationNumber
        });

        items.push({
            label: 'Registration Date',
            isMandatory: true,
            status: slbfeData?.registrationDate ? 'Complete' : 'Pending',
            details: slbfeData?.registrationDate
        });

        // 2. Training
        items.push({
            label: 'Pre-Departure Training',
            isMandatory: true,
            status: slbfeData?.trainingDate ? 'Complete' : 'Pending',
            details: slbfeData?.trainingDate ? `Completed on ${slbfeData.trainingDate}` : undefined
        });

        // 3. Insurance
        const hasInsurance = slbfeData?.insurancePolicyNumber && slbfeData?.insuranceExpiryDate;
        const isInsuranceValid = hasInsurance && new Date(slbfeData!.insuranceExpiryDate!) > new Date();

        items.push({
            label: 'Valid Insurance Policy',
            isMandatory: true,
            status: isInsuranceValid ? 'Complete' : (hasInsurance ? 'Failed' : 'Pending'),
            details: hasInsurance ? (isInsuranceValid ? slbfeData!.insurancePolicyNumber : 'Expired') : undefined
        });

        // 4. Biometrics
        items.push({
            label: 'Fingerprint/Biometrics',
            isMandatory: true,
            status: slbfeData?.biometricStatus === BiometricStatus.COMPLETED ? 'Complete' : 'Pending',
            details: slbfeData?.biometricStatus
        });

        // 5. Family Consent (Required for Females in Domestic roles usually, but implementing generic check if data present)
        // Assuming mandatory if candidate is Female + Domestic (Mock logic: always check if present in data model)
        const isFemaleDomestic = candidate.gender === 'Female' && (candidate.role?.toLowerCase().includes('house') || candidate.role?.toLowerCase().includes('maid'));
        if (isFemaleDomestic) {
            items.push({
                label: 'Family Consent Verification',
                isMandatory: true,
                status: slbfeData?.familyConsent?.isGiven && slbfeData?.familyConsent?.verifiedBy ? 'Complete' : 'Pending',
                details: slbfeData?.familyConsent?.verifiedBy ? `Verified by ${slbfeData.familyConsent.verifiedBy}` : undefined
            });
        }

        // 6. Agreement
        items.push({
            label: 'Employment Agreement Approval',
            isMandatory: true,
            status: slbfeData?.agreementStatus === 'Approved' ? 'Complete' : 'Pending',
            details: slbfeData?.agreementStatus
        });

        // 7. Visa Verification (Cross-check with other modules)
        const visaDoc = candidate.documents?.find(d => d.type.toLowerCase().includes('visa') && d.status === DocumentStatus.APPROVED);
        items.push({
            label: 'Valid Visa on File',
            isMandatory: true,
            status: visaDoc ? 'Complete' : 'Pending',
            details: visaDoc ? 'Verified Document' : undefined
        });

        // 8. Medical (Double Check)
        const medicalOk = candidate.stageData?.medicalStatus === MedicalStatus.COMPLETED;
        items.push({
            label: 'Final Medical Clearance',
            isMandatory: true,
            status: medicalOk ? 'Complete' : 'Pending',
            details: candidate.stageData?.medicalStatus
        });

        return items;
    }

    /**
     * Internal generator for the Certificate
     */
    private static generateDeploymentCertificate(candidate: Candidate): DeploymentCertificate {
        // This would effectively return a "Virtual Certificate" object
        const now = new Date();
        const expiry = new Date(now);
        expiry.setFullYear(expiry.getFullYear() + 2); // 2 Year Validity usually

        return {
            certificateId: `SLBFE-${now.getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            issuedDate: now.toISOString().split('T')[0],
            candidateName: candidate.name,
            passportNumber: candidate.passportData?.passportNumber || 'N/A',
            slbfeRegNo: candidate.slbfeData?.registrationNumber || 'N/A',
            insurancePolicyNo: candidate.slbfeData?.insurancePolicyNumber || 'N/A',
            validUntil: expiry.toISOString().split('T')[0],
            authorizedBy: 'System Automation Engine' // Or specific user
        };
    }

    /**
     * Helper to auto-fix/detect potential missing data from documents if structured data is missing
     * (Mock Intelligence)
     */
    static detectMissingData(candidate: Candidate): string[] {
        const alerts: string[] = [];
        if (!candidate.slbfeData) return ['No SLBFE Data Record Found'];

        if (!candidate.slbfeData.registrationNumber) alerts.push('Missing SLBFE Reg No');
        if (!candidate.slbfeData.insurancePolicyNumber) alerts.push('Missing Insurance Policy');

        return alerts;
    }
}
