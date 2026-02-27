import { DocumentType, DocumentCategory, CandidateDocument, DocumentStatus, Country } from '../types';

export interface CountryTemplate {
    country: string;
    requiredDocuments: { type: DocumentType; category: DocumentCategory; mandatory: boolean }[];
}

// Shared document sets to avoid duplication
const REGISTRATION_DOCS: CountryTemplate['requiredDocuments'] = [
    { type: DocumentType.PASSPORT, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
    { type: DocumentType.CV, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
    { type: DocumentType.PASSPORT_PHOTOS, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
    { type: DocumentType.FULL_PHOTO, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
    { type: DocumentType.EDU_OL, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
];

const MEDICAL_SECURITY_DOCS: CountryTemplate['requiredDocuments'] = [
    { type: DocumentType.MEDICAL_REPORT, category: DocumentCategory.MEDICAL_SECURITY, mandatory: true },
    { type: DocumentType.POLICE_CLEARANCE, category: DocumentCategory.MEDICAL_SECURITY, mandatory: true },
    { type: DocumentType.VACCINATION_RECORDS, category: DocumentCategory.MEDICAL_SECURITY, mandatory: true },
];

const SELECTION_WP_DOCS: CountryTemplate['requiredDocuments'] = [
    { type: DocumentType.OFFER_LETTER, category: DocumentCategory.SELECTION_WP, mandatory: true },
    { type: DocumentType.SIGNED_OFFER_LETTER, category: DocumentCategory.SELECTION_WP, mandatory: true },
    { type: DocumentType.APPLICATION_CV, category: DocumentCategory.SELECTION_WP, mandatory: true },
    { type: DocumentType.IGI_RECORDS, category: DocumentCategory.SELECTION_WP, mandatory: true },
    { type: DocumentType.WORK_PERMIT, category: DocumentCategory.SELECTION_WP, mandatory: true },
];

const EMBASSY_VISA_BASE_DOCS: CountryTemplate['requiredDocuments'] = [
    { type: DocumentType.EMBASSY_APPOINTMENT_LETTER, category: DocumentCategory.EMBASSY_VISA, mandatory: true },
    { type: DocumentType.USD_PAYMENT_RECEIPT, category: DocumentCategory.EMBASSY_VISA, mandatory: true },
    { type: DocumentType.VISA_COPY, category: DocumentCategory.LATER_PROCESS, mandatory: true },
];

// Europe-specific: D-Form + Schengen Travel Insurance
const EMBASSY_VISA_EUROPE_DOCS: CountryTemplate['requiredDocuments'] = [
    ...EMBASSY_VISA_BASE_DOCS,
    { type: DocumentType.D_FORM, category: DocumentCategory.EMBASSY_VISA, mandatory: true },
    { type: DocumentType.TRAVEL_INSURANCE, category: DocumentCategory.EMBASSY_VISA, mandatory: true },
];

const SLBFE_DEPARTURE_DOCS: CountryTemplate['requiredDocuments'] = [
    { type: DocumentType.SLBFE_INSURANCE, category: DocumentCategory.SLBFE_DEPARTURE, mandatory: true },
    { type: DocumentType.BUREAU_DOCUMENTS_SET, category: DocumentCategory.SLBFE_DEPARTURE, mandatory: true },
    { type: DocumentType.FLIGHT_TICKET, category: DocumentCategory.SLBFE_DEPARTURE, mandatory: true },
    { type: DocumentType.AIR_TICKET, category: DocumentCategory.LATER_PROCESS, mandatory: true },
];

// --- Country-specific templates ---

const TEMPLATES: CountryTemplate[] = [
    // Middle East countries
    {
        country: Country.UAE,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.SAUDI_ARABIA,
        requiredDocuments: [
            ...REGISTRATION_DOCS.filter(d => d.type !== DocumentType.FULL_PHOTO), // Saudi uses professional certs instead
            { type: DocumentType.EDU_PROFESSIONAL, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.QATAR,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.KUWAIT,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.BAHRAIN,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.OMAN,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.JORDAN,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.ISRAEL,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    // Europe countries (get D-Form + Schengen Travel Insurance)
    {
        country: Country.ROMANIA,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_EUROPE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.POLAND,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_EUROPE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.CROATIA,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_EUROPE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.MALTA,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_EUROPE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.CYPRUS,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_EUROPE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.TURKEY,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS, // Turkey is not Schengen, no D-Form/Travel Insurance
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.SERBIA,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS, // Serbia is not Schengen
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    // Southeast Asia
    {
        country: Country.MALAYSIA,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
    {
        country: Country.SINGAPORE,
        requiredDocuments: [
            ...REGISTRATION_DOCS,
            ...MEDICAL_SECURITY_DOCS,
            ...SELECTION_WP_DOCS,
            ...EMBASSY_VISA_BASE_DOCS,
            ...SLBFE_DEPARTURE_DOCS,
        ]
    },
];

// Helper to check if a country requires Schengen documents
const SCHENGEN_COUNTRIES = [
    Country.ROMANIA, Country.POLAND, Country.CROATIA, Country.MALTA, Country.CYPRUS
];

export class TemplateService {
    static getCountries(): string[] {
        return TEMPLATES.map(t => t.country);
    }

    static isSchengenCountry(country: string): boolean {
        return SCHENGEN_COUNTRIES.includes(country as Country);
    }

    static getRequiredDocumentsForCountry(countryName: string): CandidateDocument[] {
        const template = TEMPLATES.find(t => t.country === countryName) || TEMPLATES[0];
        let idCounter = Date.now();

        return template.requiredDocuments.map(req => ({
            id: `doc-${idCounter++}-${Math.random().toString(36).substr(2, 5)}`,
            type: req.type,
            category: req.category,
            status: DocumentStatus.MISSING,
            version: 0,
            logs: []
        }));
    }

    static generateDefaultDocs(): CandidateDocument[] {
        // Falls back to a general set if no country selected
        return this.getRequiredDocumentsForCountry(Country.UAE);
    }
}
