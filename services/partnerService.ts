import { Employer, EmployerStatus } from '../types';

const STORAGE_KEY = 'caditare_employers';

const MOCK_EMPLOYERS: Employer[] = [
    {
        id: 'emp-1',
        companyName: 'Al-Fanar Construction',
        regNumber: 'SA-99212',
        country: 'Saudi Arabia',
        contactPerson: 'Ahmed Hassan',
        email: 'hr@alfanar.com',
        phone: '+966 11 234 5678',
        status: EmployerStatus.ACTIVE,
        joinedDate: '2025-01-15T10:00:00Z',
        documents: [
            { id: 'doc-1', type: 'Agreement', title: 'Main Service Agreement', expiryDate: '2026-01-15', status: 'Valid' },
            { id: 'doc-2', type: 'License', title: 'SA Commercial License', expiryDate: '2025-12-31', status: 'Valid' }
        ],
        notes: 'Premium partner for construction projects in Riyadh.',
        quotaTotal: 50,
        quotaUsed: 34,
        commissionPerHire: 450,
        paymentTermDays: 30,
        selectionRatio: 0.85,
        activityLog: [
            { id: 'act-1', type: 'Call', content: 'Followed up on new project manager requirements.', timestamp: '2025-02-09T14:30:00Z', actor: 'John Staff' },
            { id: 'act-2', type: 'Agreement_Update', content: 'Renewed Saudi commercial license docs.', timestamp: '2025-02-05T10:00:00Z', actor: 'Legal Dept' }
        ]
    },
    {
        id: 'emp-2',
        companyName: 'Marina Bay Sands',
        regNumber: 'SG-11029',
        country: 'Singapore',
        contactPerson: 'Sarah Chen',
        email: 'careers@mbs.com.sg',
        phone: '+65 6688 8888',
        status: EmployerStatus.ACTIVE,
        joinedDate: '2025-02-01T09:00:00Z',
        documents: [
            { id: 'doc-3', type: 'Agreement', title: 'Hospitality Staffing Agreement', expiryDate: '2025-08-01', status: 'Valid' }
        ],
        notes: 'Key partner for hospitality and gaming roles.',
        quotaTotal: 25,
        quotaUsed: 12,
        commissionPerHire: 600,
        paymentTermDays: 15,
        selectionRatio: 0.92,
        activityLog: [
            { id: 'act-3', type: 'Meeting', content: 'On-site visit at the Singapore office.', timestamp: '2025-02-01T11:00:00Z', actor: 'Regional Director' }
        ]
    }
];

export class PartnerService {
    static getEmployers(): Employer[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to parse employers", e);
            }
        }
        this.saveEmployers(MOCK_EMPLOYERS);
        return MOCK_EMPLOYERS;
    }

    static saveEmployers(employers: Employer[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employers));
    }

    static getEmployerById(id: string): Employer | undefined {
        const employers = this.getEmployers();
        return employers.find(e => e.id === id);
    }

    static addEmployer(employer: Employer): void {
        const employers = this.getEmployers();
        employers.push(employer);
        this.saveEmployers(employers);
    }

    static updateEmployer(updated: Employer): void {
        const employers = this.getEmployers();
        const index = employers.findIndex(e => e.id === updated.id);
        if (index !== -1) {
            employers[index] = updated;
            this.saveEmployers(employers);
        }
    }

    static deleteEmployer(id: string): void {
        const employers = this.getEmployers();
        const filtered = employers.filter(e => e.id !== id);
        this.saveEmployers(filtered);
    }
}
