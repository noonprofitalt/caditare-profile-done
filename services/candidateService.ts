import {
    Candidate,
    WorkflowStage,
    StageStatus,
    TimelineEvent,
    CandidateComment,
    ComplianceFlag
} from '../types';
import { supabase } from './supabase';
import { logger } from './loggerService';
import WorkflowEngine from './workflowEngine.v2';
import { OfflineSyncService } from './offlineSyncService';
import { AuditService } from './auditService';
import { DataSyncService } from './dataSyncService';


export class CandidateService {

    // Fetch all candidates from Supabase (Used for Dashboard/Pipeline where aggregations are needed)
    static async getCandidates(): Promise<Candidate[]> {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            logger.error('Error fetching candidates:', error);
            return [];
        }

        return (data || []).map(row => this.mapRowToCandidate(row));
    }

    // Server-side paginated & filtered search for CandidateList
    static async searchCandidates(
        limit: number = 50,
        offset: number = 0,
        filters?: {
            status?: string | 'ALL',
            stage?: WorkflowStage | 'ALL',
            query?: string,
            countries?: string[]
        }
    ): Promise<{ candidates: Candidate[], count: number }> {
        let queryBuilder = supabase
            .from('candidates')
            .select('*', { count: 'exact' });

        if (filters?.stage && filters.stage !== 'ALL') {
            queryBuilder = queryBuilder.eq('stage', filters.stage);
        }

        if (filters?.status && filters.status !== 'ALL') {
            // querying inside the JSONB 'data' column
            queryBuilder = queryBuilder.contains('data', { profileCompletionStatus: filters.status });
        }

        if (filters?.query) {
            const searchTerm = `%${filters.query}%`;
            // Searching name, email, phone, nic, and candidate_code (which maps to regNo)
            queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},nic.ilike.${searchTerm},candidate_code.ilike.${searchTerm}`);
        }

        if (filters?.countries && filters.countries.length > 0) {
            // Use 'OR' logic for countries: show candidates matching ANY of the selected countries
            const orFilter = filters.countries
                .map(country => `data->preferredCountries.cs.["${country}"]`)
                .join(',');
            queryBuilder = queryBuilder.or(orFilter);
        }

        const { data, error, count } = await queryBuilder
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error('Error in searchCandidates:', error);
            return { candidates: [], count: 0 };
        }

        return {
            candidates: (data || []).map(row => this.mapRowToCandidate(row)),
            count: count || 0
        };
    }

    static async getCandidate(id: string): Promise<Candidate | undefined> {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            logger.error('Error fetching candidate (Supabase):', {
                code: error.code,
                message: error.message,
                details: error.details,
                id
            });
            return undefined;
        }

        return this.mapRowToCandidate(data);
    }

    // Alias for backward compatibility
    static async getCandidateById(id: string): Promise<Candidate | undefined> {
        return this.getCandidate(id);
    }
    static async createCandidate(candidateData: Partial<Candidate>): Promise<Candidate | null> {
        const id = candidateData.id || crypto.randomUUID();
        const candidateCode = candidateData.candidateCode || this.generateCandidateCode();

        const fullCandidate = {
            ...candidateData,
            id,
            candidateCode,
            regNo: candidateData.regNo || candidateCode, // REG NO defaults to candidateCode if not provided
            regDate: candidateData.regDate || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Standardize data structure before saving
        const syncedCandidate = DataSyncService.fullSync(fullCandidate as any);

        const row = {
            id,
            candidate_code: candidateCode,
            name: syncedCandidate.name,
            email: syncedCandidate.email || null,
            phone: syncedCandidate.phone,
            stage: syncedCandidate.stage || WorkflowStage.REGISTERED,
            stage_status: syncedCandidate.stageStatus || StageStatus.PENDING,
            nic: syncedCandidate.nic || null,
            dob: syncedCandidate.dob || null,
            gender: syncedCandidate.gender || null,
            data: syncedCandidate,
            updated_at: new Date().toISOString()
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'INSERT', table: 'candidates', payload: row });
            return this.mapRowToCandidate(row);
        }

        const { data, error } = await supabase
            .from('candidates')
            .insert(row)
            .select()
            .single();

        if (error) {
            logger.error('Error creating candidate:', error, { candidateData });
            // Fallback to queue if it's a network-level fetch failure
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'INSERT', table: 'candidates', payload: row });
                return this.mapRowToCandidate(row);
            }
            throw error;
        }

        // SYSLOG: Track Audit
        AuditService.log('CANDIDATE_CREATED', { candidateId: id, name: candidateData.name, candidateCode });

        return this.mapRowToCandidate(data);
    }

    // Alias for backward compatibility
    static async addCandidate(candidate: Candidate): Promise<Candidate | null> {
        return this.createCandidate(candidate);
    }

    // Specialized quick add creation
    static async createQuickCandidate(formData: any): Promise<Candidate | null> {
        const candidateData: Partial<Candidate> = {
            ...formData,
            stage: WorkflowStage.REGISTERED,
            stageStatus: StageStatus.PENDING,
            registrationSource: 'QUICK_ADD' as any
        };
        return this.createCandidate(candidateData);
    }

    static async updateCandidate(candidate: Candidate): Promise<void> {
        // Ensure data parity before update
        const syncedCandidate = DataSyncService.fullSync(candidate);
        const row = this.mapCandidateToRow(syncedCandidate);

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'UPDATE', table: 'candidates', payload: { id: candidate.id, ...row } });
            return;
        }

        const { error } = await supabase
            .from('candidates')
            .upsert(row)
            .eq('id', candidate.id);

        if (error) {
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'UPDATE', table: 'candidates', payload: { id: candidate.id, ...row } });
                return;
            }
            throw error;
        }

        // SYSLOG: Track Audit
        AuditService.log('CANDIDATE_UPDATED', {
            candidateId: candidate.id,
            name: candidate.name,
            candidateCode: candidate.candidateCode,
            stage: candidate.stage,
            completionRate: candidate.profileCompletionPercentage
        });
    }

    static async saveCandidates(candidates: Candidate[]): Promise<void> {
        const rows = candidates.map(c => this.mapCandidateToRow(c));
        const { error } = await supabase
            .from('candidates')
            .upsert(rows);

        if (error) {
            throw error;
        }
    }

    static async deleteCandidate(id: string): Promise<void> {
        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'DELETE', table: 'candidates', payload: { id } });
            return;
        }

        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'DELETE', table: 'candidates', payload: { id } });
                return;
            }
            throw error;
        }

        // SYSLOG: Track Audit
        AuditService.log('CANDIDATE_DELETED', { candidateId: id });
    }

    // --- Helpers for mapping between JSONB and Typed Object ---

    private static mapRowToCandidate(row: any): Candidate {
        if (!row) return {} as Candidate;

        // The 'data' column holds the complex nested structure
        const json = row.data || {};

        // Extract top-level flat fields with row-level overrides
        const name = row.name || json.name || 'Unknown Candidate';
        const email = row.email || json.email || '';
        const phone = row.phone || json.phone || '';
        const nic = row.nic || json.nic || '';
        const dob = row.dob || json.dob || '';
        const gender = row.gender || json.gender || '';

        // Construct personalInfo with fallbacks from flat fields
        const personalInfo = {
            fullName: name,
            firstName: json.firstName || '',
            middleName: json.middleName || '',
            nic,
            dob,
            gender,
            address: json.address || '',
            city: json.city || '',
            district: json.district || '',
            province: json.province || '',
            divisionalSecretariat: json.divisionalSecretariat || '',
            gsDivision: json.gsDivision || '',
            drivingLicenseNo: json.drivingLicenseNo || '',
            height: json.height,
            weight: json.weight,
            religion: json.religion || '',
            maritalStatus: json.maritalStatus || 'Single',
            spouseName: json.spouseName || '',
            fatherName: json.fatherName || '',
            motherName: json.motherName || '',
            school: json.school || '',
            ...(json.personalInfo || {}),
        };

        // Construct contactInfo with fallbacks from flat fields
        const contactInfo = {
            primaryPhone: phone,
            whatsappPhone: json.whatsapp || '',
            email,
            additionalPhones: Array.isArray(json.additionalContactNumbers) ? json.additionalContactNumbers : [],
            ...(json.contactInfo || {}),
        };

        // Construct professionalProfile with fallbacks from flat fields
        const professionalProfile = {
            jobRoles: Array.isArray(json.jobRoles) ? json.jobRoles : [],
            experienceYears: json.experienceYears || 0,
            skills: Array.isArray(json.skills) ? json.skills : [],
            education: Array.isArray(json.education) ? json.education : [],
            educationalQualifications: Array.isArray(json.educationalQualifications) ? json.educationalQualifications : [],
            employmentHistory: Array.isArray(json.employmentHistory) ? json.employmentHistory : [],
            school: json.school || '',
            ...(json.professionalProfile || {}),
        };

        const candidate = {
            ...json,
            id: row.id,
            candidateCode: row.candidate_code || json.candidateCode || 'N/A',
            regNo: json.regNo || row.candidate_code || json.candidateCode || 'N/A',
            regDate: json.regDate || row.created_at || new Date().toISOString(),
            name,
            email,
            phone,
            nic,
            dob,
            gender,
            stage: (row.stage || json.stage || WorkflowStage.REGISTERED) as WorkflowStage,
            stageStatus: (row.stage_status || json.stageStatus || StageStatus.PENDING) as StageStatus,

            // Normalized nested objects (with flat fallbacks baked in)
            personalInfo,
            contactInfo,
            professionalProfile,

            // Ensure nested objects exist
            skills: Array.isArray(json.skills) ? json.skills : [],
            preferredCountries: Array.isArray(json.preferredCountries) ? json.preferredCountries : [],
            jobRoles: Array.isArray(json.jobRoles) ? json.jobRoles : [],
            documents: Array.isArray(json.documents) ? json.documents : [],
            avatarUrl: json.avatarUrl || (Array.isArray(json.documents) ? json.documents.find((d: any) => d.type === 'Full Photo (1)' && d.status === 'Approved')?.url : undefined) || '',
            timelineEvents: Array.isArray(json.timelineEvents) ? json.timelineEvents : [],

            // Reconstruct nested stageData if missing
            stageData: {
                paymentHistory: [],
                ...(json.stageData || {})
            },

            // Ensure ID matches and audit dates are fresh from DB
            audit: {
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString(),
                ...(json.audit || {})
            }
        };

        // FINAL SYNC PASS: Ensure any mismatches between row and json are resolved
        return DataSyncService.fullSync(candidate);
    }

    private static mapCandidateToRow(candidate: Candidate): any {
        return {
            id: candidate.id,
            candidate_code: candidate.candidateCode,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            stage: candidate.stage,
            stage_status: candidate.stageStatus,
            nic: candidate.nic || null,
            dob: candidate.dob || null,
            gender: candidate.gender || null,
            data: candidate, // Store full object in JSONB for schema flexibility
            updated_at: new Date().toISOString()
        };
    }

    // --- Helper for generating codes ---
    static generateCandidateCode(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `GW-${year}-${random}`;
    }

    static async addComment(candidateId: string, author: string, text: string, isInternal: boolean = true): Promise<void> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return;

        const newComment: CandidateComment = {
            id: `msg-${Date.now()}`,
            candidateId,
            author,
            text,
            timestamp: new Date().toISOString(),
            isInternal
        };

        candidate.comments = [newComment, ...(candidate.comments || [])];
        await this.updateCandidate(candidate);

        // Also log as timeline event for audit trail
        await this.addTimelineEvent(candidateId, {
            type: 'SYSTEM',
            title: isInternal ? 'Internal Comment Added' : 'Comment Added',
            description: `Author: ${author} - Content: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
            actor: author
        });
    }

    static async addComplianceFlag(candidateId: string, flag: Partial<ComplianceFlag>): Promise<void> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return;

        const newFlag: ComplianceFlag = {
            id: `flag-${Date.now()}`,
            type: flag.type || 'OTHER',
            severity: flag.severity || 'WARNING',
            reason: flag.reason || 'No reason provided',
            createdBy: flag.createdBy || 'System',
            createdAt: new Date().toISOString(),
            isResolved: false,
            ...flag
        } as ComplianceFlag;

        candidate.complianceFlags = [newFlag, ...(candidate.complianceFlags || [])];
        await this.updateCandidate(candidate);

        // Also log as timeline event
        await this.addTimelineEvent(candidateId, {
            type: flag.severity === 'CRITICAL' ? 'ALERT' : 'SYSTEM',
            title: `Compliance Flag Added: ${flag.type}`,
            description: flag.reason,
            actor: flag.createdBy,
            isCritical: flag.severity === 'CRITICAL'
        });
    }

    static async resolveComplianceFlag(candidateId: string, flagId: string, notes: string, resolvedBy: string): Promise<void> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return;

        candidate.complianceFlags = (candidate.complianceFlags || []).map(f => {
            if (f.id === flagId) {
                return {
                    ...f,
                    isResolved: true,
                    resolvedAt: new Date().toISOString(),
                    resolvedBy,
                    resolutionNotes: notes
                };
            }
            return f;
        });

        await this.updateCandidate(candidate);

        // Also log as timeline event
        await this.addTimelineEvent(candidateId, {
            type: 'SYSTEM',
            title: `Compliance Flag Resolved`,
            description: notes,
            actor: resolvedBy
        });
    }

    // --- Helper for adding timeline events ---
    static async addTimelineEvent(candidateId: string, event: Partial<TimelineEvent>): Promise<void> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return;

        const newEvent: TimelineEvent = {
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: event.type || 'SYSTEM',
            title: event.title || 'Action Performed',
            description: event.description || '',
            actor: event.actor || 'System',
            userId: event.userId,
            stage: candidate.stage,
            metadata: event.metadata
        };

        candidate.timelineEvents = [newEvent, ...(candidate.timelineEvents || [])];
        await this.updateCandidate(candidate);
    }

    // --- Workflow Integration methods ---

    static async advanceStage(candidateId: string, userId: string, reason?: string): Promise<{ success: boolean, error?: string }> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return { success: false, error: 'Candidate not found' };

        const nextStage = WorkflowEngine.getNextStage(candidate.stage);
        if (!nextStage) return { success: false, error: 'No next stage available' };

        const result = WorkflowEngine.performTransition(candidate, nextStage, userId, reason);
        if (!result.success) return { success: false, error: result.error };

        candidate.stage = nextStage;
        candidate.stageEnteredAt = new Date().toISOString();
        if (result.event) {
            candidate.timelineEvents = [result.event as any, ...(candidate.timelineEvents || [])];
        }
        await this.updateCandidate(candidate);
        return { success: true };
    }

    static async rollbackStage(candidateId: string, toStage: WorkflowStage, userId: string, reason: string): Promise<{ success: boolean, error?: string }> {
        const candidate = await this.getCandidate(candidateId);
        if (!candidate) return { success: false, error: 'Candidate not found' };

        const result = WorkflowEngine.performTransition(candidate, toStage, userId, reason);
        if (!result.success) return { success: false, error: result.error };

        candidate.stage = toStage;
        candidate.stageEnteredAt = new Date().toISOString();
        if (result.event) {
            candidate.timelineEvents = [result.event as any, ...(candidate.timelineEvents || [])];
        }
        await this.updateCandidate(candidate);
        return { success: true };
    }
}
