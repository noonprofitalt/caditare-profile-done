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

export class CandidateService {

    // Fetch all candidates from Supabase
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
            updated_at: new Date().toISOString()
        };

        const row = {
            id,
            candidate_code: candidateCode,
            name: candidateData.name,
            email: candidateData.email || null,
            phone: candidateData.phone,
            stage: candidateData.stage || WorkflowStage.REGISTERED,
            stage_status: candidateData.stageStatus || StageStatus.PENDING,
            nic: candidateData.nic || null,
            dob: candidateData.dob || null,
            gender: candidateData.gender || null,
            data: fullCandidate,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('candidates')
            .insert(row)
            .select()
            .single();

        if (error) {
            logger.error('Error creating candidate:', error, { candidateData });
            throw error;
        }

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
        const row = this.mapCandidateToRow(candidate);
        const { error } = await supabase
            .from('candidates')
            .upsert(row)
            .eq('id', candidate.id);

        if (error) {
            throw error;
        }
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
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // --- Helpers for mapping between JSONB and Typed Object ---

    private static mapRowToCandidate(row: any): Candidate {
        if (!row) return {} as Candidate;

        // The 'data' column holds the complex nested structure
        const json = row.data || {};

        return {
            ...json,
            id: row.id,
            candidateCode: row.candidate_code || json.candidateCode || 'N/A',
            name: row.name || json.name || 'Unknown Candidate',
            email: row.email || json.email || '',
            phone: row.phone || json.phone || '',
            nic: row.nic || json.nic || '',
            dob: row.dob || json.dob || '',
            gender: row.gender || json.gender || '',
            stage: (row.stage || json.stage || WorkflowStage.REGISTERED) as WorkflowStage,
            stageStatus: (row.stage_status || json.stageStatus || StageStatus.PENDING) as StageStatus,

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
