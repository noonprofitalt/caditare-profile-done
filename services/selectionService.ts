import { CandidateSelection, SelectionStage } from '../types';

const STORAGE_KEY = 'caditare_selections';

// Selection stage flow order (for validation)
const STAGE_ORDER: SelectionStage[] = [
    SelectionStage.MATCHED,
    SelectionStage.CV_SUBMITTED,
    SelectionStage.SHORTLISTED,
    SelectionStage.INTERVIEW_SCHEDULED,
    SelectionStage.INTERVIEWED,
    SelectionStage.SELECTED,
    SelectionStage.OFFER_ISSUED,
    SelectionStage.OFFER_ACCEPTED,
];

export class SelectionService {
    static getAll(): CandidateSelection[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Failed to parse selections', e);
            }
        }
        return [];
    }

    static saveAll(selections: CandidateSelection[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    }

    static getById(id: string): CandidateSelection | undefined {
        return this.getAll().find(s => s.id === id);
    }

    static getByDemandOrderId(demandOrderId: string): CandidateSelection[] {
        return this.getAll().filter(s => s.demandOrderId === demandOrderId);
    }

    static getByCandidateId(candidateId: string): CandidateSelection[] {
        return this.getAll().filter(s => s.candidateId === candidateId);
    }

    static getActiveByDemandOrderId(demandOrderId: string): CandidateSelection[] {
        return this.getByDemandOrderId(demandOrderId).filter(
            s => s.stage !== SelectionStage.REJECTED
        );
    }

    static add(selection: CandidateSelection): void {
        const selections = this.getAll();
        // Prevent duplicate: same candidate + same demand order
        const exists = selections.find(
            s => s.candidateId === selection.candidateId && s.demandOrderId === selection.demandOrderId
        );
        if (exists) return;
        selections.push(selection);
        this.saveAll(selections);
    }

    static addBatch(newSelections: CandidateSelection[]): void {
        const selections = this.getAll();
        for (const sel of newSelections) {
            const exists = selections.find(
                s => s.candidateId === sel.candidateId && s.demandOrderId === sel.demandOrderId
            );
            if (!exists) {
                selections.push(sel);
            }
        }
        this.saveAll(selections);
    }

    static update(updated: CandidateSelection): void {
        const selections = this.getAll();
        const index = selections.findIndex(s => s.id === updated.id);
        if (index !== -1) {
            selections[index] = { ...updated, updatedAt: new Date().toISOString() };
            this.saveAll(selections);
        }
    }

    static advanceStage(selectionId: string, toStage: SelectionStage): CandidateSelection | null {
        const selection = this.getById(selectionId);
        if (!selection) return null;

        selection.stage = toStage;
        selection.updatedAt = new Date().toISOString();
        this.update(selection);
        return selection;
    }

    static rejectCandidate(selectionId: string, reason: string): void {
        const selection = this.getById(selectionId);
        if (!selection) return;

        selection.stage = SelectionStage.REJECTED;
        selection.rejectionReason = reason;
        selection.updatedAt = new Date().toISOString();
        this.update(selection);
    }

    static delete(id: string): void {
        const selections = this.getAll().filter(s => s.id !== id);
        this.saveAll(selections);
    }

    static getStageOrder(): SelectionStage[] {
        return [...STAGE_ORDER];
    }

    /** Count candidates at each stage for a given demand order */
    static getStageCounts(demandOrderId: string): Record<SelectionStage, number> {
        const selections = this.getByDemandOrderId(demandOrderId);
        const counts: Record<string, number> = {};
        for (const stage of Object.values(SelectionStage)) {
            counts[stage] = 0;
        }
        for (const sel of selections) {
            counts[sel.stage] = (counts[sel.stage] || 0) + 1;
        }
        return counts as Record<SelectionStage, number>;
    }
}
