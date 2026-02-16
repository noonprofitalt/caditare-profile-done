import {
    Candidate,
    WorkflowStage,
    StageStatus,
    TimelineEvent
} from '../types';
import { supabase } from './supabase';

export class CandidateService {

    // Fetch all candidates from Supabase
    static async getCandidates(): Promise<Candidate[]> {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching candidates:', error);
            return [];
        }

        return data.map((row: any) => this.mapRowToCandidate(row));
    }

    static async getCandidate(id: string): Promise<Candidate | undefined> {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching candidate:', error);
            return undefined;
        }

        return this.mapRowToCandidate(data);
    }
    static async createCandidate(candidateData: Omit<Candidate, 'id' | 'audit'>): Promise<Candidate | null> {
        // Construct the row manually or reuse mapper with temporary ID
        const row = {
            candidate_code: candidateData.candidateCode,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            stage: candidateData.stage,
            stage_status: candidateData.stageStatus,
            data: candidateData, // Store full object in JSONB
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('candidates')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('Error creating candidate:', error);
            throw error;
        }

        return this.mapRowToCandidate(data);
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
        // The 'data' column holds the complex nested structure
        const json = row.data || {};
        return {
            ...json,
            id: row.id,
            candidateCode: row.candidate_code,
            name: row.name,
            email: row.email,
            phone: row.phone,
            stage: row.stage as WorkflowStage,
            stageStatus: row.stage_status as StageStatus,
            // Ensure ID matches and audit dates are fresh from DB
            audit: {
                ...(json.audit || {}),
                createdAt: row.created_at,
                updatedAt: row.updated_at
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
}
