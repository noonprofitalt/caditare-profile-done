import { PassportData, PassportStatus, PCCData, PCCStatus, MedicalStatus, Candidate, AppNotification } from '../types';

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
     * Validates medical status and scheduled date
     */
    static validateMedicalStatus(
        medicalStatus?: MedicalStatus,
        scheduledDate?: string
    ): { valid: boolean; message?: string } {
        // If no medical status set, it's valid (optional field)
        if (!medicalStatus) {
            return { valid: true };
        }

        // If status is "Scheduled", date is mandatory
        if (medicalStatus === MedicalStatus.SCHEDULED) {
            if (!scheduledDate) {
                return {
                    valid: false,
                    message: 'Medical scheduled date is required when status is "Scheduled".'
                };
            }

            // Validate date is not in the past (allow today)
            const scheduled = new Date(scheduledDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (scheduled < today) {
                return {
                    valid: false,
                    message: 'Medical scheduled date cannot be in the past.'
                };
            }
        }

        return { valid: true };
    }

    /**
     * Check if medical appointment is overdue
     */
    static isMedicalOverdue(medicalStatus?: MedicalStatus, scheduledDate?: string): boolean {
        if (medicalStatus !== MedicalStatus.SCHEDULED || !scheduledDate) {
            return false;
        }

        const scheduled = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return scheduled < today;
    }

    /**
     * Helper to check if a candidate is compliant for Visa/Departure stages
     */
    static isCompliant(passport?: PassportData, pcc?: PCCData, medicalStatus?: MedicalStatus): { allowed: boolean; reasons: string[] } {
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

        // Medical Check (for visa stages, medical should be completed)
        if (medicalStatus === MedicalStatus.FAILED) {
            reasons.push("Medical examination has FAILED.");
        } else if (medicalStatus === MedicalStatus.NOT_STARTED) {
            reasons.push("Medical examination has not been started.");
        } else if (medicalStatus === MedicalStatus.SCHEDULED) {
            reasons.push("Medical examination is scheduled but not yet completed.");
        }

        return {
            allowed: reasons.length === 0,
            reasons
        };
    }

    /**
     * Generate compliance alerts for a candidate
     */
    static generateComplianceAlerts(candidate: Candidate): AppNotification[] {
        const alerts: AppNotification[] = [];
        const now = new Date();

        // Passport Expiry Alerts
        if (candidate.passportData) {
            const { status, validityDays, expiryDate } = candidate.passportData;

            if (status === PassportStatus.EXPIRED) {
                alerts.push({
                    id: `passport-expired-${candidate.id}`,
                    type: 'DELAY',
                    title: '🚨 Passport Expired',
                    message: `${candidate.name}'s passport has expired. Immediate renewal required.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            } else if (status === PassportStatus.EXPIRING) {
                alerts.push({
                    id: `passport-expiring-${candidate.id}`,
                    type: 'WARNING',
                    title: '⚠️ Passport Expiring Soon',
                    message: `${candidate.name}'s passport expires in ${validityDays} days (${expiryDate}). Plan renewal.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            }
        }

        // PCC Expiry Alerts
        if (candidate.pccData) {
            const { status, ageDays, expiryDate } = candidate.pccData;

            if (status === PCCStatus.EXPIRED) {
                alerts.push({
                    id: `pcc-expired-${candidate.id}`,
                    type: 'DELAY',
                    title: '🚨 PCC Expired',
                    message: `${candidate.name}'s Police Clearance Certificate has expired (${ageDays} days old). Renewal required.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            } else if (status === PCCStatus.EXPIRING) {
                alerts.push({
                    id: `pcc-expiring-${candidate.id}`,
                    type: 'WARNING',
                    title: '⚠️ PCC Expiring Soon',
                    message: `${candidate.name}'s PCC is ${ageDays} days old. Expires on ${expiryDate}.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            }
        }

        // Medical Appointment Alerts
        if (candidate.stageData?.medicalStatus === MedicalStatus.SCHEDULED && candidate.stageData?.medicalScheduledDate) {
            const scheduledDate = new Date(candidate.stageData.medicalScheduledDate);
            const daysUntil = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil < 0) {
                // Overdue
                alerts.push({
                    id: `medical-overdue-${candidate.id}`,
                    type: 'DELAY',
                    title: '🚨 Medical Appointment Overdue',
                    message: `${candidate.name}'s medical appointment was scheduled for ${candidate.stageData.medicalScheduledDate}. Update status.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            } else if (daysUntil === 0) {
                // Today
                alerts.push({
                    id: `medical-today-${candidate.id}`,
                    type: 'INFO',
                    title: '📅 Medical Appointment Today',
                    message: `${candidate.name} has a medical appointment scheduled today.`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            } else if (daysUntil <= 7) {
                // Within 7 days
                alerts.push({
                    id: `medical-upcoming-${candidate.id}`,
                    type: 'INFO',
                    title: '📅 Upcoming Medical Appointment',
                    message: `${candidate.name}'s medical appointment is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${candidate.stageData.medicalScheduledDate}).`,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: candidate.id,
                    link: `/candidates/${candidate.id}`
                });
            }
        }

        return alerts;
    }
}
