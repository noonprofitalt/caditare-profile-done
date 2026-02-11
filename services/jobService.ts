import { Job, JobStatus } from '../types';

const STORAGE_KEY = 'caditare_jobs';

// Mock jobs data
const MOCK_JOBS: Job[] = [
    {
        id: 'job-1',
        title: 'Construction Worker',
        company: 'BuildCorp International',
        location: 'Dubai, UAE',
        salaryRange: '$1,200 - $1,800/month',
        type: 'Full-time',
        description: 'Experienced construction workers needed for large-scale projects.',
        status: JobStatus.OPEN,
        postedDate: '2024-01-15',
        requirements: ['3+ years experience', 'Physical fitness', 'Safety certification'],
        employerId: 'emp-1',
        matchedCandidateIds: ['1', '2']
    },
    {
        id: 'job-2',
        title: 'Hotel Staff',
        company: 'Luxury Hotels Group',
        location: 'Doha, Qatar',
        salaryRange: '$900 - $1,400/month',
        type: 'Full-time',
        description: 'Front desk and housekeeping positions available.',
        status: JobStatus.OPEN,
        postedDate: '2024-01-20',
        requirements: ['Customer service experience', 'English proficiency', 'Hospitality background'],
        employerId: 'emp-2',
        matchedCandidateIds: ['3']
    },
    {
        id: 'job-3',
        title: 'Factory Operator',
        company: 'Manufacturing Solutions Ltd',
        location: 'Riyadh, Saudi Arabia',
        salaryRange: '$1,000 - $1,500/month',
        type: 'Contract',
        description: 'Machine operators for food processing facility.',
        status: JobStatus.OPEN,
        postedDate: '2024-02-01',
        requirements: ['Technical skills', 'Shift work availability', 'Quality control knowledge'],
        employerId: 'emp-3',
        matchedCandidateIds: []
    }
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
}
