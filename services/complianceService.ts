import { PassportData, PassportStatus, PCCData, PCCStatus } from '../types';

export class ComplianceService {

    // --- CONFIGURATION ---
    private static readonly PASSPORT_MIN_VALIDITY_DAYS = 180; // 6 months
    private static readonly PCC_MAX_AGE_DAYS = 180; // 6 months
    private static readonly PCC_EXPIRING_THRESHOLD = 150; // Warn if > 5 months old

    /**
     * Calculates the current status of a Passport based on its expiry date.
     */
    static evaluatePassport(expiryDateStr: string, passportNumber: string, country: string, issuedDateStr: string): PassportData {
        const now = new Date();
        const expiry = new Date(expiryDateStr);

        // Calculate validity days from NOW
        // Difference in time / (1000 * 3600 * 24)
        const diffTime = expiry.getTime() - now.getTime();
        const validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status = PassportStatus.VALID;

        if (validityDays < 0) {
            status = PassportStatus.EXPIRED;
        } else if (validityDays <= this.PASSPORT_MIN_VALIDITY_DAYS) {
            status = PassportStatus.EXPIRING;
        }

        return {
            passportNumber,
            country,
            issuedDate: issuedDateStr,
            expiryDate: expiryDateStr,
            status,
            validityDays
        };
    }

    /**
     * Calculates the current status of a PCC based on its issued date.
     */
    static evaluatePCC(issuedDateStr: string, lastInspectionDateStr?: string): PCCData {
        const now = new Date();
        const issued = new Date(issuedDateStr);

        // Calculate age in days
        const diffTime = now.getTime() - issued.getTime();
        const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let status = PCCStatus.VALID;

        if (ageDays > this.PCC_MAX_AGE_DAYS) {
            status = PCCStatus.EXPIRED;
        } else if (ageDays >= this.PCC_EXPIRING_THRESHOLD) {
            status = PCCStatus.EXPIRING;
        }

        // Calculate expiry date (Issued + 180 days)
        const expiryDate = new Date(issued);
        expiryDate.setDate(expiryDate.getDate() + this.PCC_MAX_AGE_DAYS);

        return {
            issuedDate: issuedDateStr,
            expiryDate: expiryDate.toISOString().split('T')[0],
            lastInspectionDate: lastInspectionDateStr,
            status,
            ageDays
        };
    }

    /**
     * Helper to check if a candidate is compliant for Visa/Departure stages
     */
    static isCompliant(passport?: PassportData, pcc?: PCCData): { allowed: boolean; reasons: string[] } {
        const reasons: string[] = [];

        // Passport Check
        if (!passport) {
            reasons.push("Passport data is missing.");
        } else if (passport.status === PassportStatus.EXPIRED) {
            reasons.push("Passport has EXPIRED.");
        } else if (passport.status === PassportStatus.INVALID) {
            reasons.push("Passport is marked INVALID.");
        }
        // We allow EXPIRING but maybe with a warning? For now, strict block only on Invalid/Expired? 
        // The requirement says "Unless passport_status = VALID". So strictly VALID.
        else if (passport.status !== PassportStatus.VALID) {
            reasons.push(`Passport is ${passport.status} (Valid for ${passport.validityDays} days, requires ${this.PASSPORT_MIN_VALIDITY_DAYS}).`);
        }

        // PCC Check
        if (!pcc) {
            reasons.push("PCC data is missing.");
        } else if (pcc.status === PCCStatus.EXPIRED) {
            reasons.push("PCC has EXPIRED.");
        } else if (pcc.status === PCCStatus.INVALID) {
            reasons.push("PCC is marked INVALID.");
        } else if (pcc.status !== PCCStatus.VALID) {
            reasons.push(`PCC is ${pcc.status} (Age: ${pcc.ageDays} days).`);
        }

        return {
            allowed: reasons.length === 0,
            reasons
        };
    }
}
