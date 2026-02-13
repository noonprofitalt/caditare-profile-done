import { Country, DocumentType } from '../../types';
import { CountryComplianceRule } from './ComplianceTypes';

export const COMPLIANCE_CONSTANTS = {
    PASSPORT_WARNING_DAYS: 180, // 6 Months
    PCC_WARNING_DAYS: 150,      // 5 Months
    PCC_EXPIRY_DAYS: 180,       // 6 Months
};

export const COUNTRY_RULES: Record<string, CountryComplianceRule> = {
    [Country.SAUDI_ARABIA]: {
        countryName: Country.SAUDI_ARABIA,
        defaultAgeLimit: { min: 21, max: 45 },
        roleSpecificAgeLimits: {
            'Housemaid': { min: 21, max: 55 },
            'Driver': { min: 25, max: 55 },
            'Construction': { min: 21, max: 50 },
        },
        minPassportValidityMonths: 6, // 180 days usually
        checksPCC: true,
        pccValidityMonths: 6,
        mandatoryDocuments: [DocumentType.PASSPORT, DocumentType.PASSPORT_PHOTOS, DocumentType.FULL_PHOTO],
        medicalRequired: true
    },
    [Country.UAE]: {
        countryName: Country.UAE,
        defaultAgeLimit: { min: 21, max: 50 },
        roleSpecificAgeLimits: {
            'Construction': { min: 21, max: 50 },
            'Hospitality': { min: 21, max: 40 }
        },
        minPassportValidityMonths: 6,
        checksPCC: true,
        pccValidityMonths: 6,
        mandatoryDocuments: [DocumentType.PASSPORT, DocumentType.PASSPORT_PHOTOS],
        medicalRequired: true
    },
    [Country.QATAR]: {
        countryName: Country.QATAR,
        defaultAgeLimit: { min: 21, max: 45 }, // "Qatar Hospitality: 21-45"
        roleSpecificAgeLimits: {
            'Hospitality': { min: 21, max: 45 },
            'Construction': { min: 21, max: 55 }
        },
        minPassportValidityMonths: 6,
        checksPCC: true,
        pccValidityMonths: 6,
        mandatoryDocuments: [DocumentType.PASSPORT, DocumentType.MEDICAL_REPORT, DocumentType.POLICE_CLEARANCE],
        medicalRequired: true
    },
    // Default rules for other countries
    'DEFAULT': {
        countryName: 'General',
        defaultAgeLimit: { min: 18, max: 55 },
        minPassportValidityMonths: 6,
        checksPCC: false,
        pccValidityMonths: 6,
        mandatoryDocuments: [DocumentType.PASSPORT],
        medicalRequired: true
    }
};

export const getCountryRule = (country?: string): CountryComplianceRule => {
    if (!country) return COUNTRY_RULES['DEFAULT'];
    return COUNTRY_RULES[country] || COUNTRY_RULES['DEFAULT'];
};
