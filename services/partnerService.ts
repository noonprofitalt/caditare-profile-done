import { Employer, EmployerStatus, EmployerActivity } from '../types';
import { supabase } from './supabase';
import { OfflineSyncService } from './offlineSyncService';

export class PartnerService {
    static async getEmployers(): Promise<Employer[]> {
        const { data, error } = await supabase
            .from('employers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching employers:', error);
            return [];
        }

        return data.map((e: any) => this.mapDatabaseToEmployer(e));
    }

    static async getEmployerById(id: string): Promise<Employer | undefined> {
        const { data, error } = await supabase
            .from('employers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching employer:', error);
            return undefined;
        }

        return this.mapDatabaseToEmployer(data);
    }

    static async addEmployer(employer: Employer): Promise<Employer | null> {
        const dbEmployer = {
            name: employer.companyName,
            industry: 'N/A', // Default or add to Employer type
            location: employer.country,
            contact_person: employer.contactPerson,
            email: employer.email,
            phone: employer.phone,
            status: employer.status,
            data: {
                regNumber: employer.regNumber,
                website: employer.website,
                joinedDate: employer.joinedDate,
                commissionPerHire: employer.commissionPerHire,
                paymentTermDays: employer.paymentTermDays,
                quotaTotal: employer.quotaTotal,
                quotaUsed: employer.quotaUsed,
                selectionRatio: employer.selectionRatio,
                documents: employer.documents,
                activityLog: employer.activityLog,
                notes: employer.notes
            }
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'INSERT', table: 'employers', payload: dbEmployer });
            return this.mapDatabaseToEmployer({ id: `emp_tmp_${Date.now()}`, ...dbEmployer });
        }

        const { data, error } = await supabase
            .from('employers')
            .insert(dbEmployer)
            .select()
            .single();

        if (error) {
            console.error('Error adding employer:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'INSERT', table: 'employers', payload: dbEmployer });
                return this.mapDatabaseToEmployer({ id: `emp_tmp_${Date.now()}`, ...dbEmployer });
            }
            return null;
        }

        return this.mapDatabaseToEmployer(data);
    }

    static async updateEmployer(updated: Employer): Promise<Employer | null> {
        const dbUpdate = {
            name: updated.companyName,
            location: updated.country,
            contact_person: updated.contactPerson,
            email: updated.email,
            phone: updated.phone,
            status: updated.status,
            updated_at: new Date().toISOString(),
            data: {
                regNumber: updated.regNumber,
                website: updated.website,
                joinedDate: updated.joinedDate,
                commissionPerHire: updated.commissionPerHire,
                paymentTermDays: updated.paymentTermDays,
                quotaTotal: updated.quotaTotal,
                quotaUsed: updated.quotaUsed,
                selectionRatio: updated.selectionRatio,
                documents: updated.documents,
                activityLog: updated.activityLog,
                notes: updated.notes
            }
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'UPDATE', table: 'employers', payload: { id: updated.id, ...dbUpdate } });
            return this.mapDatabaseToEmployer({ id: updated.id, ...dbUpdate });
        }

        const { data, error } = await supabase
            .from('employers')
            .update(dbUpdate)
            .eq('id', updated.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating employer:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'UPDATE', table: 'employers', payload: { id: updated.id, ...dbUpdate } });
                return this.mapDatabaseToEmployer({ id: updated.id, ...dbUpdate });
            }
            return null;
        }

        return this.mapDatabaseToEmployer(data);
    }

    static async deleteEmployer(id: string): Promise<boolean> {
        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'DELETE', table: 'employers', payload: { id } });
            return true;
        }

        const { error } = await supabase
            .from('employers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting employer:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'DELETE', table: 'employers', payload: { id } });
                return true;
            }
            return false;
        }
        return true;
    }

    private static mapDatabaseToEmployer(dbRecord: any): Employer {
        return {
            id: dbRecord.id,
            companyName: dbRecord.name,
            regNumber: dbRecord.data?.regNumber || '',
            country: dbRecord.location || '',
            contactPerson: dbRecord.contact_person || '',
            email: dbRecord.email || '',
            phone: dbRecord.phone || '',
            status: (dbRecord.status as EmployerStatus) || EmployerStatus.ACTIVE,
            joinedDate: dbRecord.data?.joinedDate || dbRecord.created_at,
            website: dbRecord.data?.website,
            commissionPerHire: dbRecord.data?.commissionPerHire,
            paymentTermDays: dbRecord.data?.paymentTermDays,
            quotaTotal: dbRecord.data?.quotaTotal,
            quotaUsed: dbRecord.data?.quotaUsed,
            selectionRatio: dbRecord.data?.selectionRatio,
            documents: dbRecord.data?.documents || [],
            activityLog: dbRecord.data?.activityLog || [],
            notes: dbRecord.data?.notes
        };
    }

    static async addActivity(employerId: string, activity: Omit<EmployerActivity, 'id' | 'timestamp'>): Promise<boolean> {
        const employer = await this.getEmployerById(employerId);
        if (!employer) return false;

        const newActivity: EmployerActivity = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...activity
        };

        employer.activityLog = [...(employer.activityLog || []), newActivity];
        const updated = await this.updateEmployer(employer);
        return updated !== null;
    }
}
