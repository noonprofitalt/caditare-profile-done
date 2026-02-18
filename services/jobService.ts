import { Job, JobStatus } from '../types';

const STORAGE_KEY = 'caditare_jobs';

const MOCK_JOBS: Job[] = [
    {
        id: 'job-1',
        title: 'Construction Worker',
        company: 'BuildCorp International',
        location: 'Dubai, UAE',
        salaryRange: '$1,200 - $1,800/month',
        type: 'Full-time',
        description: 'Experienced construction workers needed for large-scale commercial and residential projects in Dubai. Must be physically fit, comfortable working at heights, and experienced with concrete, steel, and general construction tasks.',
        status: JobStatus.OPEN,
        postedDate: '2025-01-15',
        requirements: ['3+ years construction experience', 'Physical fitness certification', 'Safety training (OSHA or equivalent)', 'Able to work at heights'],
        employerId: 'emp-1',
        demandOrderId: 'do-1',
        matchedCandidateIds: ['1', '2'],
        category: 'Construction',
        positions: 25,
        filledPositions: 8,
        deadline: '2025-03-30',
        contactPerson: 'Ahmed Al Rasheed',
        benefits: ['Housing', 'Transport', 'Medical Insurance', 'Annual Flight'],
    },
    {
        id: 'job-2',
        title: 'Hotel Front Desk & Housekeeping',
        company: 'Luxury Hotels Group',
        location: 'Doha, Qatar',
        salaryRange: '$900 - $1,400/month',
        type: 'Full-time',
        description: 'Multiple positions available for front desk staff and housekeeping supervisors at a 5-star hotel chain in Qatar. Candidates should have a hospitality background and excellent communication skills.',
        status: JobStatus.OPEN,
        postedDate: '2025-01-20',
        requirements: ['Customer service experience', 'English proficiency (B2+)', 'Hospitality diploma preferred', 'Neat appearance'],
        employerId: 'emp-2',
        demandOrderId: 'do-2',
        matchedCandidateIds: ['3'],
        category: 'Hospitality',
        positions: 15,
        filledPositions: 3,
        deadline: '2025-04-15',
        contactPerson: 'Sarah Al Thani',
        benefits: ['Housing', 'Meals', 'Medical Insurance', 'Uniform Provided'],
    },
    {
        id: 'job-3',
        title: 'Factory Machine Operator',
        company: 'Manufacturing Solutions Ltd',
        location: 'Riyadh, Saudi Arabia',
        salaryRange: '$1,000 - $1,500/month',
        type: 'Contract',
        description: 'Machine operators needed for a modern food processing facility. Requires understanding of production line operations, quality control procedures, and shift-based work schedules.',
        status: JobStatus.OPEN,
        postedDate: '2025-02-01',
        requirements: ['Technical/mechanical aptitude', 'Shift work availability', 'Quality control knowledge', 'Basic English'],
        employerId: 'emp-3',
        demandOrderId: 'do-3',
        matchedCandidateIds: [],
        category: 'Manufacturing',
        positions: 40,
        filledPositions: 0,
        deadline: '2025-05-01',
        contactPerson: 'Mohammad Al Saud',
        benefits: ['Housing', 'Transport', 'Medical Insurance'],
    },
    {
        id: 'job-4',
        title: 'Registered Nurse',
        company: 'Gulf Medical Centre',
        location: 'Abu Dhabi, UAE',
        salaryRange: '$2,200 - $3,500/month',
        type: 'Full-time',
        description: 'Licensed nurses needed for a leading medical centre. Must hold a valid nursing license from country of origin and have at least 2 years post-qualification experience in a hospital setting.',
        status: JobStatus.OPEN,
        postedDate: '2025-02-05',
        requirements: ['Valid nursing license', '2+ years hospital experience', 'BLS/ACLS certified', 'English fluency'],
        employerId: 'emp-1',
        matchedCandidateIds: [],
        category: 'Healthcare',
        positions: 10,
        filledPositions: 2,
        deadline: '2025-04-30',
        contactPerson: 'Dr. Fatima Hassan',
        benefits: ['Housing Allowance', 'Medical Insurance', 'Annual Flight', 'Continuing Education'],
    },
    {
        id: 'job-5',
        title: 'Heavy Equipment Operator',
        company: 'BuildCorp International',
        location: 'Jeddah, Saudi Arabia',
        salaryRange: '$1,500 - $2,200/month',
        type: 'Contract',
        description: 'Experienced operators needed for excavators, cranes, and bulldozers on a major infrastructure project. Valid heavy equipment operating license required.',
        status: JobStatus.FILLED,
        postedDate: '2024-11-10',
        requirements: ['Heavy equipment license', '5+ years experience', 'Safety training', 'Arabic or English'],
        employerId: 'emp-3',
        matchedCandidateIds: ['1'],
        category: 'Construction',
        positions: 8,
        filledPositions: 8,
        deadline: '2025-01-15',
        contactPerson: 'Khalid Al Rashid',
        benefits: ['Housing', 'Transport', 'Medical Insurance', 'Overtime Pay'],
    },
    {
        id: 'job-6',
        title: 'Restaurant Chef & Kitchen Staff',
        company: 'Luxury Hotels Group',
        location: 'Kuwait City, Kuwait',
        salaryRange: '$1,100 - $2,000/month',
        type: 'Full-time',
        description: 'Chefs and sous chefs needed for multiple restaurant outlets. Focus on South Asian, Continental, and Arabic cuisines. Kitchen assistants also required.',
        status: JobStatus.CLOSED,
        postedDate: '2024-10-01',
        requirements: ['Culinary diploma or equivalent', '3+ years kitchen experience', 'Food safety certification', 'Able to work long hours'],
        employerId: 'emp-2',
        matchedCandidateIds: ['2', '3'],
        category: 'Hospitality',
        positions: 12,
        filledPositions: 12,
        deadline: '2024-12-31',
        contactPerson: 'Yousef Al Sabah',
        benefits: ['Housing', 'Meals', 'Medical Insurance'],
    },
];

export class JobService {
    static getJobs(): Job[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to parse jobs", e);
            }
        }
        this.saveJobs(MOCK_JOBS);
        return MOCK_JOBS;
    }

    static saveJobs(jobs: Job[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
        } catch (e) {
            console.error("Failed to save jobs", e);
        }
    }

    static getJobById(id: string): Job | undefined {
        const jobs = this.getJobs();
        return jobs.find(j => j.id === id);
    }

    static getJobsByEmployerId(employerId: string): Job[] {
        const jobs = this.getJobs();
        return jobs.filter(j => j.employerId === employerId);
    }

    static getJobsByStatus(status: JobStatus): Job[] {
        return this.getJobs().filter(j => j.status === status);
    }

    static getOpenJobs(): Job[] {
        return this.getJobsByStatus(JobStatus.OPEN);
    }

    static addJob(job: Job): void {
        const jobs = this.getJobs();
        jobs.push(job);
        this.saveJobs(jobs);
    }

    static updateJob(updatedJob: Job): void {
        const jobs = this.getJobs();
        const index = jobs.findIndex(j => j.id === updatedJob.id);
        if (index !== -1) {
            jobs[index] = updatedJob;
            this.saveJobs(jobs);
        }
    }

    static deleteJob(id: string): void {
        const jobs = this.getJobs();
        const filtered = jobs.filter(j => j.id !== id);
        this.saveJobs(filtered);
    }

    /** Force reset to mock data (useful for dev) */
    static resetToMockData(): void {
        this.saveJobs(MOCK_JOBS);
    }
}
