
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateService } from './candidateService';
import { WorkflowEngine } from './workflowEngine.v2';
import { WorkflowStage, Candidate, PassportStatus, DocumentStatus } from '../types';

describe('CandidateService Workflow Integration', () => {
    let mockCandidate: Candidate;
    const mockCandidateId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup a compliant candidate for testing
        mockCandidate = {
            id: mockCandidateId,
            name: 'Test Candidate',
            stage: WorkflowStage.REGISTERED,
            documents: [
                { type: 'Passport', category: 'Mandatory', status: DocumentStatus.APPROVED, url: 'test' },
                { type: 'CV', category: 'Mandatory', status: DocumentStatus.APPROVED, url: 'test' },
            ],
            // ... other necessary fields
        } as any;

        vi.spyOn(CandidateService, 'getCandidate').mockResolvedValue(mockCandidate);
        vi.spyOn(CandidateService, 'updateCandidate').mockResolvedValue(undefined);
    });

    it('should advance stage successfully when valid', async () => {
        // Mock Engine pass
        vi.spyOn(WorkflowEngine, 'performTransition').mockReturnValue({
            success: true,
            event: {
                id: 'evt-1',
                fromStage: WorkflowStage.REGISTERED,
                toStage: WorkflowStage.VERIFIED,
                timestamp: new Date(),
                // ... other event props
            } as any
        });

        const result = await CandidateService.advanceStage(mockCandidateId, 'User');

        expect(result.success).toBe(true);
        expect(CandidateService.updateCandidate).toHaveBeenCalled();
        expect(mockCandidate.stage).toBe(WorkflowStage.VERIFIED);
    });

    it('should fail to advance when engine blocks', async () => {
        // Mock Engine fail
        vi.spyOn(WorkflowEngine, 'performTransition').mockReturnValue({
            success: false,
            error: 'Blocked by missing passport'
        });

        const result = await CandidateService.advanceStage(mockCandidateId, 'User');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Blocked');
        // Should NOT update candidate stage
        expect(mockCandidate.stage).toBe(WorkflowStage.REGISTERED);
    });

    it('should rollback stage successfully with reason', async () => {
        // Mock Engine pass for rollback
        vi.spyOn(WorkflowEngine, 'performTransition').mockReturnValue({
            success: true,
            event: {
                id: 'evt-rollback',
                fromStage: WorkflowStage.VERIFIED,
                toStage: WorkflowStage.REGISTERED,
                timestamp: new Date(),
            } as any
        });

        const result = await CandidateService.rollbackStage(mockCandidateId, WorkflowStage.REGISTERED, 'User', 'Mistake');

        expect(result.success).toBe(true);
        expect(mockCandidate.stage).toBe(WorkflowStage.REGISTERED);
    });
});
