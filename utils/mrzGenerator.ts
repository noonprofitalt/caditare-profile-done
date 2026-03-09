export function charValue(c: string): number {
    if (c >= '0' && c <= '9') return parseInt(c, 10);
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55; // 'A' is 65. 65 - 55 = 10.
    if (c === '<') return 0;
    return 0; // fallback
}

export function calculateCheckDigit(str: string): number {
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum += charValue(str[i]) * weights[i % 3];
    }
    return sum % 10;
}

export function pad(str: string, len: number, padChar: string = '<'): string {
    return str.padEnd(len, padChar).substring(0, len);
}

export function convertDate(dateStr: string): string {
    // expects 'YYYY-MM-DD' returns 'YYMMDD'
    if (!dateStr) return '<<<<<<';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return parts[0].substring(2, 4) + parts[1] + parts[2];
    }
    return '<<<<<<';
}

export function generateMRZ(candidate: any, passport: any): [string, string] {
    if (!candidate || !passport) {
        return ['<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'];
    }

    // Determine Country Codes
    // Usually ISO 3166-1 alpha-3, e.g., 'LKA' for Sri Lanka
    const countryMap: Record<string, string> = {
        'Sri Lanka': 'LKA',
        // add others if needed.. fallback is LKA for now
    };
    const issuingCountry = countryMap[passport.country] || 'LKA';
    // Assume nationality is the same as issuing country for now
    const nationality = issuingCountry;

    // Line 1
    const pType = issuingCountry === 'LKA' ? 'PB' : 'P<'; // Using PB for Sri Lanka
    const line1Prefix = pType + pad(issuingCountry, 3);

    // Names
    const pi = candidate.personalInfo || {};
    let surname = pi.surname || pi.firstName || candidate.firstName || '';
    let otherNames = pi.otherNames || pi.middleName || candidate.middleName || '';

    // Split words by space and rejoin with <
    surname = surname.toUpperCase().trim().replace(/[^A-Z\s]/g, '').replace(/\s+/g, '<');
    otherNames = otherNames.toUpperCase().trim().replace(/[^A-Z\s]/g, '').replace(/\s+/g, '<');

    let nameStr = `${surname}<<${otherNames}`;
    if (!surname) {
        nameStr = `${otherNames}`;
    } else if (!otherNames) {
        nameStr = `${surname}`;
    }

    const line1 = line1Prefix + pad(nameStr, 39);

    // Line 2
    const pptNoRaw = (passport.passportNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const pptNo = pad(pptNoRaw, 9);
    const pptCheck = pptNoRaw ? calculateCheckDigit(pptNo).toString() : '<';

    const dob = convertDate(pi.dob || candidate.dob);
    const dobCheck = (pi.dob || candidate.dob) ? calculateCheckDigit(dob).toString() : '<';

    let sex = pi.gender || candidate.gender || '<';
    sex = sex.toUpperCase().charAt(0);
    if (sex !== 'M' && sex !== 'F') sex = '<';

    const exp = convertDate(passport.expiryDate);
    const expCheck = passport.expiryDate ? calculateCheckDigit(exp).toString() : '<';

    const nicRaw = (pi.nic || candidate.nic || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const nic = pad(nicRaw, 14);
    const nicCheck = nicRaw ? calculateCheckDigit(nic).toString() : '<';

    // Composite Check
    // Over pptNo + pptCheck + dob + dobCheck + exp + expCheck + nic + nicCheck
    const compositeStr = pptNo + (pptCheck === '<' ? '0' : pptCheck) + dob + (dobCheck === '<' ? '0' : dobCheck) + exp + (expCheck === '<' ? '0' : expCheck) + nic + (nicCheck === '<' ? '0' : nicCheck);
    const compositeCheck = calculateCheckDigit(compositeStr).toString();

    const line2 = pptNo + pptCheck + pad(nationality, 3) + dob + dobCheck + sex + exp + expCheck + nic + nicCheck + compositeCheck;

    return [line1, line2];
}
