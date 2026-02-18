import { Employer, EmployerStatus } from '../types';

const STORAGE_KEY = 'caditare_employers';

const MOCK_EMPLOYERS: Employer[] = [
    {
        id: 'emp-1',
        companyName: 'BuildCorp International',
        regNumber: 'DXB-2019-44821',
        country: 'United Arab Emirates',
        contactPerson: 'Ahmed Al Rasheed',
        email: 'ahmed@buildcorp.ae',
        phone: '+971-4-555-0100',
        status: EmployerStatus.ACTIVE,
        joinedDate: '2023-03-15',
        website: 'https://buildcorp.ae',
        commissionPerHire: 500,
        paymentTermDays: 30,
        quotaTotal: 80,
        quotaUsed: 35,
        selectionRatio: 0.72,
        documents: [
            { id: 'doc-emp1-1', type: 'Agreement', title: 'Recruitment Agency Agreement', expiryDate: '2026-03-15', status: 'Valid' },
            { id: 'doc-emp1-2', type: 'License', title: 'Trade License', expiryDate: '2025-12-31', status: 'Valid' },
        ],
        activityLog: [
            { id: 'act-emp1-1', type: 'Agreement_Update', content: 'Annual agreement renewed for 2025-2026', timestamp: '2025-01-10T09:00:00Z', actor: 'Admin' },
            { id: 'act-emp1-2', type: 'Meeting', content: 'Quarterly review meeting — discussed new construction project in Dubai Marina', timestamp: '2025-01-20T14:00:00Z', actor: 'Sarah' },
            { id: 'act-emp1-3', type: 'Note', content: 'Client satisfied with last batch quality. Wants to increase quota for Q2', timestamp: '2025-02-01T11:30:00Z', actor: 'Admin' },
        ],
    },
    {
        id: 'emp-2',
        companyName: 'Luxury Hotels Group',
        regNumber: 'QTR-2020-77231',
        country: 'Qatar',
        contactPerson: 'Sarah Al Thani',
        email: 'sarah@luxuryhotels.qa',
        phone: '+974-555-0200',
        status: EmployerStatus.ACTIVE,
        joinedDate: '2023-06-10',
        website: 'https://luxuryhotels.qa',
        commissionPerHire: 400,
        paymentTermDays: 45,
        quotaTotal: 50,
        quotaUsed: 18,
        selectionRatio: 0.65,
        documents: [
            { id: 'doc-emp2-1', type: 'Agreement', title: 'Hospitality Staffing Agreement', expiryDate: '2025-06-10', status: 'Valid' },
            { id: 'doc-emp2-2', type: 'License', title: 'Commercial License', expiryDate: '2025-09-30', status: 'Valid' },
        ],
        activityLog: [
            { id: 'act-emp2-1', type: 'Call', content: 'Follow-up call on housekeeping batch — 3 selected, 2 pending interview', timestamp: '2025-01-25T10:00:00Z', actor: 'Admin' },
            { id: 'act-emp2-2', type: 'Email', content: 'Sent updated CV shortlist for front desk positions', timestamp: '2025-02-02T08:30:00Z', actor: 'Sarah' },
        ],
    },
    {
        id: 'emp-3',
        companyName: 'Manufacturing Solutions Ltd',
        regNumber: 'KSA-2021-55120',
        country: 'Saudi Arabia',
        contactPerson: 'Mohammad Al Saud',
        email: 'mohammad@mfgsolutions.sa',
        phone: '+966-11-555-0300',
        status: EmployerStatus.ACTIVE,
        joinedDate: '2024-01-08',
        website: 'https://mfgsolutions.sa',
        commissionPerHire: 450,
        paymentTermDays: 30,
        quotaTotal: 60,
        quotaUsed: 8,
        selectionRatio: 0.58,
        documents: [
            { id: 'doc-emp3-1', type: 'Agreement', title: 'Manpower Supply Agreement', expiryDate: '2026-01-08', status: 'Valid' },
            { id: 'doc-emp3-2', type: 'POA', title: 'Power of Attorney', expiryDate: '2025-07-31', status: 'Valid' },
        ],
        activityLog: [
            { id: 'act-emp3-1', type: 'Note', content: 'New factory line opening in Q2 — expects demand for 40+ operators', timestamp: '2025-02-05T14:00:00Z', actor: 'Admin' },
        ],
    },
    {
        id: 'emp-4',
        companyName: 'Gulf Medical Centre',
        regNumber: 'DXB-2022-33190',
        country: 'United Arab Emirates',
        contactPerson: 'Dr. Fatima Hassan',
        email: 'fatima.hassan@gulfmedical.ae',
        phone: '+971-2-555-0400',
        status: EmployerStatus.PENDING_APPROVAL,
        joinedDate: '2024-11-20',
        commissionPerHire: 600,
        paymentTermDays: 60,
        quotaTotal: 30,
        quotaUsed: 2,
        selectionRatio: 0.85,
        documents: [
            { id: 'doc-emp4-1', type: 'License', title: 'Medical Facility License', expiryDate: '2026-06-30', status: 'Valid' },
            { id: 'doc-emp4-2', type: 'Agreement', title: 'Healthcare Recruitment Agreement', expiryDate: '2025-11-20', status: 'Pending' },
        ],
        activityLog: [
            { id: 'act-emp4-1', type: 'Meeting', content: 'Onboarding meeting — discussed nurse recruitment pipeline', timestamp: '2024-11-20T09:00:00Z', actor: 'Admin' },
            { id: 'act-emp4-2', type: 'Email', content: 'Sent agreement draft for review', timestamp: '2024-12-01T10:00:00Z', actor: 'Legal' },
        ],
    },
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
