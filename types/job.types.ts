/**
 * Job Types
 */

import { JobStatus } from './workflow.types';

export { JobStatus };

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salaryRange: string;
    type: 'Full-time' | 'Contract' | 'Seasonal';
    description: string;
    status: JobStatus;
    postedDate: string;
    requirements: string[];
    matchedCandidateIds?: string[];
    employerId?: string;
    category?: string;
    positions?: number;
    filledPositions?: number;
    deadline?: string;
    demandOrderId?: string;
    contactPerson?: string;
    benefits?: string[];
}
