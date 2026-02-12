import { Candidate } from '../types';
import { CandidateService } from './candidateService';

/**
 * Duplicate Detection Service
 * Prevents duplicate candidate entries based on unique identifiers
 */
export class DuplicateDetectionService {
    /**
     * Find duplicate candidates based on unique identifiers
     * @param candidateData - Partial candidate data to check
     * @returns Array of matching candidates
     */
    static findDuplicates(candidateData: Partial<Candidate>): Candidate[] {
        const allCandidates = CandidateService.getCandidates();

        return allCandidates.filter(existing => {
            // Skip self-comparison if ID exists
            if (candidateData.id && existing.id === candidateData.id) {
                return false;
            }

            // Exact match on NIC
            if (candidateData.nic && existing.nic &&
                candidateData.nic.trim().toLowerCase() === existing.nic.trim().toLowerCase()) {
                return true;
            }

            // Exact match on Passport Number
            if (candidateData.passportData?.passportNumber &&
                existing.passportData?.passportNumber &&
                candidateData.passportData.passportNumber.trim().toLowerCase() ===
                existing.passportData.passportNumber.trim().toLowerCase()) {
                return true;
            }

            // Exact match on Primary Phone (normalize format)
            if (candidateData.phone && existing.phone) {
                const normalizedNew = this.normalizePhone(candidateData.phone);
                const normalizedExisting = this.normalizePhone(existing.phone);
                if (normalizedNew === normalizedExisting) {
                    return true;
                }
            }

            // Exact match on WhatsApp (normalize format)
            if (candidateData.whatsapp && existing.whatsapp) {
                const normalizedNew = this.normalizePhone(candidateData.whatsapp);
                const normalizedExisting = this.normalizePhone(existing.whatsapp);
                if (normalizedNew === normalizedExisting) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Check if candidate data represents a duplicate
     * @param candidateData - Partial candidate data to check
     * @returns Object with duplicate status, matches, and matched fields
     */
    static isDuplicate(candidateData: Partial<Candidate>): {
        isDuplicate: boolean;
        matches: Candidate[];
        matchedFields: string[];
    } {
        const matches = this.findDuplicates(candidateData);
        const matchedFields: string[] = [];

        if (matches.length > 0) {
            // Determine which fields matched
            matches.forEach(match => {
                if (candidateData.nic && match.nic &&
                    candidateData.nic.trim().toLowerCase() === match.nic.trim().toLowerCase()) {
                    if (!matchedFields.includes('NIC')) matchedFields.push('NIC');
                }
                if (candidateData.passportData?.passportNumber &&
                    match.passportData?.passportNumber &&
                    candidateData.passportData.passportNumber.trim().toLowerCase() ===
                    match.passportData.passportNumber.trim().toLowerCase()) {
                    if (!matchedFields.includes('Passport Number')) matchedFields.push('Passport Number');
                }
                if (candidateData.phone && match.phone &&
                    this.normalizePhone(candidateData.phone) === this.normalizePhone(match.phone)) {
                    if (!matchedFields.includes('Phone')) matchedFields.push('Phone');
                }
                if (candidateData.whatsapp && match.whatsapp &&
                    this.normalizePhone(candidateData.whatsapp) === this.normalizePhone(match.whatsapp)) {
                    if (!matchedFields.includes('WhatsApp')) matchedFields.push('WhatsApp');
                }
            });
        }

        return {
            isDuplicate: matches.length > 0,
            matches,
            matchedFields
        };
    }

    /**
     * Normalize phone number for comparison
     * Removes spaces, dashes, and country code variations
     * @param phone - Phone number to normalize
     * @returns Normalized phone number
     */
    private static normalizePhone(phone: string): string {
        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, '');

        // Remove country code if present (94 for Sri Lanka)
        if (normalized.startsWith('94')) {
            normalized = normalized.substring(2);
        }

        // Remove leading zero if present
        if (normalized.startsWith('0')) {
            normalized = normalized.substring(1);
        }

        return normalized;
    }

    /**
     * Get duplicate warning message
     * @param matches - Array of matching candidates
     * @param matchedFields - Array of matched field names
     * @returns Formatted warning message
     */
    static getDuplicateWarningMessage(matches: Candidate[], matchedFields: string[]): string {
        if (matches.length === 0) return '';

        const candidate = matches[0];
        const fieldsText = matchedFields.join(', ');

        return `A candidate with matching ${fieldsText} already exists:\n\n` +
            `Name: ${candidate.name}\n` +
            `NIC: ${candidate.nic || 'N/A'}\n` +
            `Phone: ${candidate.phone}\n` +
            `Status: ${candidate.stage}\n\n` +
            `Would you like to view the existing profile or continue anyway?`;
    }
}
