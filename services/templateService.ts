import { DocumentType, DocumentCategory, CandidateDocument, DocumentStatus } from '../types';

export interface CountryTemplate {
    country: string;
    requiredDocuments: { type: DocumentType; category: DocumentCategory; mandatory: boolean }[];
}

const TEMPLATES: CountryTemplate[] = [
    {
        country: 'UAE (United Arab Emirates)',
        requiredDocuments: [
            { type: DocumentType.PASSPORT, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.CV, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.PASSPORT_PHOTOS, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.FULL_PHOTO, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.EDU_OL, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.MEDICAL_REPORT, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.POLICE_CLEARANCE, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.VISA_COPY, category: DocumentCategory.LATER_PROCESS, mandatory: true },
        ]
    },
    {
        country: 'Saudi Arabia',
        requiredDocuments: [
            { type: DocumentType.PASSPORT, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.CV, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.PASSPORT_PHOTOS, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.EDU_PROFESSIONAL, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.MEDICAL_REPORT, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.POLICE_CLEARANCE, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.VISA_COPY, category: DocumentCategory.LATER_PROCESS, mandatory: true },
        ]
    },
    {
        country: 'Qatar',
        requiredDocuments: [
            { type: DocumentType.PASSPORT, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.CV, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.FULL_PHOTO, category: DocumentCategory.MANDATORY_REGISTRATION, mandatory: true },
            { type: DocumentType.MEDICAL_REPORT, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.POLICE_CLEARANCE, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.VISA_COPY, category: DocumentCategory.LATER_PROCESS, mandatory: true },
            { type: DocumentType.AIR_TICKET, category: DocumentCategory.LATER_PROCESS, mandatory: true },
        ]
    }
];

export class TemplateService {
    static getCountries(): string[] {
        return TEMPLATES.map(t => t.country);
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
        return this.getRequiredDocumentsForCountry('UAE (United Arab Emirates)');
    }
}
