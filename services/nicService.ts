/**
 * Sri Lankan NIC Parser Service
 * Supports 9-digit (Old) and 12-digit (New) NIC formats
 */
export class NICService {
    /**
     * Parse NIC to extract Date of Birth and Gender
     * @param nic - Sri Lankan NIC string
     * @returns Object containing dob and gender, or null if invalid
     */
    static parseNIC(nic: string): { dob: string; gender: 'Male' | 'Female' } | null {
        if (!nic) return null;

        const cleanNIC = nic.trim().toUpperCase();
        let year: number;
        let dayOfYear: number;
        let gender: 'Male' | 'Female';

        // 9-digit format (e.g., 851234567V)
        if (cleanNIC.length === 10 && /^[0-9]{9}[VX]$/.test(cleanNIC)) {
            year = 1900 + parseInt(cleanNIC.substring(0, 2));
            dayOfYear = parseInt(cleanNIC.substring(2, 5));
        }
        // 12-digit format (e.g., 198512345678)
        else if (cleanNIC.length === 12 && /^[0-9]{12}$/.test(cleanNIC)) {
            year = parseInt(cleanNIC.substring(0, 4));
            dayOfYear = parseInt(cleanNIC.substring(4, 7));
        }
        else {
            return null;
        }

        // Determine gender
        if (dayOfYear > 500) {
            gender = 'Female';
            dayOfYear -= 500;
        } else {
            gender = 'Male';
        }

        // Basic validation of day of year
        if (dayOfYear < 1 || dayOfYear > 366) {
            return null;
        }

        // Calculate Date
        const dob = new Date(year, 0); // Jan 1st of the year
        dob.setDate(dayOfYear);

        // Final verification of year (prevents issues with invalid dates like Feb 30)
        if (dob.getFullYear() !== year) {
            return null;
        }

        return {
            dob: dob.toISOString().split('T')[0],
            gender
        };
    }
}
