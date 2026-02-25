import { Job, JobStatus } from '../types';
import { supabase } from './supabase';
import { OfflineSyncService } from './offlineSyncService';
import { AuditService } from './auditService';

export class JobService {
    static async getJobs(): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching jobs:', error);
            return [];
        }

        return data.map((j: any) => this.mapDatabaseToJob(j));
    }

    static async searchJobs(
        limit: number = 20,
        offset: number = 0,
        filters?: { employerId?: string; status?: JobStatus | 'ALL'; query?: string }
    ): Promise<{ jobs: Job[], count: number }> {
        let qb = supabase.from('jobs').select('*', { count: 'exact' });

        if (filters?.employerId) qb = qb.eq('employer_id', filters.employerId);
        if (filters?.status && filters.status !== 'ALL') qb = qb.eq('status', filters.status);
        if (filters?.query) {
            const q = `%${filters.query}%`;
            qb = qb.or(`title.ilike.${q},location.ilike.${q},description.ilike.${q}`);
        }

        const { data, error, count } = await qb
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error paginating jobs:', error);
            return { jobs: [], count: 0 };
        }

        return { jobs: data.map((j: any) => this.mapDatabaseToJob(j)), count: count || 0 };
    }

    static async getJobById(id: string): Promise<Job | undefined> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching job:', error);
            return undefined;
        }

        return this.mapDatabaseToJob(data);
    }

    static async getJobsByEmployerId(employerId: string): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('employer_id', employerId);

        if (error) {
            console.error('Error fetching jobs for employer:', error);
            return [];
        }

        return data.map((j: any) => this.mapDatabaseToJob(j));
    }

    static async getJobsByStatus(status: JobStatus): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', status);

        if (error) {
            console.error('Error fetching jobs by status:', error);
            return [];
        }

        return data.map((j: any) => this.mapDatabaseToJob(j));
    }

    static async getOpenJobs(): Promise<Job[]> {
        return this.getJobsByStatus(JobStatus.OPEN);
    }

    static async addJob(job: Job): Promise<Job | null> {
        const dbJob = {
            employer_id: job.employerId,
            demand_order_id: job.demandOrderId,
            title: job.title,
            category: job.category,
            location: job.location,
            salary: job.salaryRange,
            type: job.type,
            status: job.status,
            positions: job.positions,
            description: job.description,
            requirements: job.requirements,
            matched_candidate_ids: job.matchedCandidateIds,
            created_at: job.postedDate || new Date().toISOString(),
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'INSERT', table: 'jobs', payload: dbJob });
            return this.mapDatabaseToJob({ id: `job_tmp_${Date.now()}`, ...dbJob });
        }

        const { data, error } = await supabase
            .from('jobs')
            .insert(dbJob)
            .select()
            .single();

        if (error) {
            console.error('Error adding job:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'INSERT', table: 'jobs', payload: dbJob });
                return this.mapDatabaseToJob({ id: `job_tmp_${Date.now()}`, ...dbJob });
            }
            return null;
        }

        const result = this.mapDatabaseToJob(data);

        AuditService.log('JOB_CREATED', {
            jobId: result.id,
            title: result.title,
            employerId: result.employerId
        });

        return result;
    }

    static async updateJob(updatedJob: Job): Promise<Job | null> {
        const dbUpdate = {
            title: updatedJob.title,
            category: updatedJob.category,
            location: updatedJob.location,
            salary: updatedJob.salaryRange,
            type: updatedJob.type,
            status: updatedJob.status,
            positions: updatedJob.positions,
            description: updatedJob.description,
            requirements: updatedJob.requirements,
            matched_candidate_ids: updatedJob.matchedCandidateIds,
            updated_at: new Date().toISOString(),
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'UPDATE', table: 'jobs', payload: { id: updatedJob.id, ...dbUpdate } });
            return this.mapDatabaseToJob({ id: updatedJob.id, ...dbUpdate });
        }

        const { data, error } = await supabase
            .from('jobs')
            .update(dbUpdate)
            .eq('id', updatedJob.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating job:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'UPDATE', table: 'jobs', payload: { id: updatedJob.id, ...dbUpdate } });
                return this.mapDatabaseToJob({ id: updatedJob.id, ...dbUpdate });
            }
            return null;
        }

        const result = this.mapDatabaseToJob(data);

        AuditService.log('JOB_UPDATED', {
            jobId: result.id,
            title: result.title,
            status: result.status
        });

        return result;
    }

    static async deleteJob(id: string): Promise<boolean> {
        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'DELETE', table: 'jobs', payload: { id } });
            return true;
        }

        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting job:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'DELETE', table: 'jobs', payload: { id } });
                return true;
            }
            return false;
        }
        AuditService.log('JOB_DELETED', {
            jobId: id
        });

        return true;
    }

    private static mapDatabaseToJob(dbRecord: any): Job {
        return {
            id: dbRecord.id,
            title: dbRecord.title || '',
            company: 'Unknown', // We might need to join/fetch employer name, or store it denormalized
            location: dbRecord.location || '',
            salaryRange: dbRecord.salary || '',
            type: (dbRecord.type as any) || 'Full-time',
            description: dbRecord.description || '',
            status: (dbRecord.status as JobStatus) || JobStatus.OPEN,
            postedDate: dbRecord.created_at,
            requirements: dbRecord.requirements || [],
            matchedCandidateIds: dbRecord.matched_candidate_ids || [],
            employerId: dbRecord.employer_id,
            demandOrderId: dbRecord.demand_order_id,
            category: dbRecord.category,
            positions: dbRecord.positions || 1,
            filledPositions: 0, // Need to calculate or store
            // Add missing fields from data jsonb if needed
        };
    }
}
