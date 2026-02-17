import { Employer, EmployerStatus } from '../types';

const STORAGE_KEY = 'caditare_employers';

const MOCK_EMPLOYERS: Employer[] = [];

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
