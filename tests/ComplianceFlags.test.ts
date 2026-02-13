import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateService } from '../services/candidateService';
import WorkflowEngine, { WORKFLOW_STAGES } from '../services/workflowEngine.v2';
import { ComplianceEngine } from '../services/compliance/ComplianceEngine';
import { Candidate, WorkflowStage, ComplianceFlag } from '../types';

describe('Compliance Flags & Workflow Blocking', () => {
    let candidate: Candidate;

    beforeEach(() => {
        // Mock candidate
        candidate = {
            id: 'test-candidate-1',
            name: 'Test User',
            stage: WorkflowStage.REGISTERED,
            complianceFlags: [],
            documents: [],
            personalInfo: {} as any,
            contactInfo: {} as any,
            professionalProfile: {} as any
        } as Candidate;

        // Mock CandidateService.getCandidateById
        vi.spyOn(CandidateService, 'getCandidateById').mockReturnValue(candidate);
        vi.spyOn(CandidateService, 'updateCandidate').mockImplementation((c) => {
            candidate = c; // Update local mock
        });
    });

    it('should add a compliance flag', async () => {
        await CandidateService.addComplianceFlag(candidate.id, {
            type: 'BEHAVIORAL',
            severity: 'WARNING',
            reason: 'Rude behavior',
            createdBy: 'Admin'
        });

        expect(candidate.complianceFlags).toHaveLength(1);
        expect(candidate.complianceFlags[0].type).toBe('BEHAVIORAL');
        expect(candidate.complianceFlags[0].severity).toBe('WARNING');
        expect(candidate.complianceFlags[0].isResolved).toBe(false);
    });

    it('should resolve a compliance flag', async () => {
        // Add flag first
        await CandidateService.addComplianceFlag(candidate.id, {
            type: 'LEGAL',
            severity: 'CRITICAL',
            reason: 'Blacklisted',
            createdBy: 'Admin'
        });

        const flagId = candidate.complianceFlags[0].id;

        await CandidateService.resolveComplianceFlag(candidate.id, flagId, 'Cleared by manager', 'Manager');

        expect(candidate.complianceFlags[0].isResolved).toBe(true);
        expect(candidate.complianceFlags[0].resolutionNotes).toBe('Cleared by manager');
    });

    it('should block workflow transition if CRITICAL flag is active', async () => {
        // Add CRITICAL flag
        candidate.complianceFlags = [{
            id: 'flag1',
            type: 'LEGAL',
            severity: 'CRITICAL',
            reason: 'Pending Case',
            createdBy: 'System',
            createdAt: new Date().toISOString(),
            isResolved: false
        }];

        // Attempt transition
        const result = WorkflowEngine.validateTransition(candidate, WorkflowStage.VERIFIED);

        expect(result.allowed).toBe(false);
        expect(result.blockers).toContain('[COMPLIANCE] Compliance Flag: Pending Case');
    });

    it('should allow workflow transition if CRITICAL flag is RESOLVED', async () => {
        // Add RESOLVED CRITICAL flag
        candidate.complianceFlags = [{
            id: 'flag1',
            type: 'LEGAL',
            severity: 'CRITICAL',
            reason: 'Pending Case',
            createdBy: 'System',
            createdAt: new Date().toISOString(),
            isResolved: true,
            resolvedBy: 'Admin',
            resolvedAt: new Date().toISOString(),
            resolutionNotes: 'Cleared'
        }];

        // Assuming other requirements are met (we might need to mock them or ignore strict checks for this test if possible,
        // but WorkflowEngine checks documents too. We expect blockers to NOT contain compliance flag).

        // WorkflowEngine.validateTransition checks everything.
        // We know REGISTERED->VERIFIED requires Passport/CV.
        // We expect allowed=false (due to missing docs) but NO compliance blockers.

        const result = WorkflowEngine.validateTransition(candidate, WorkflowStage.VERIFIED);

        // It might be false, but blockers should NOT contain compliance flag.
        const complianceBlockers = result.blockers.filter(b => b.includes('Compliance Flag:'));
        expect(complianceBlockers).toHaveLength(0);
    });

    it('should not block workflow transition for WARNING flag', async () => {
        // Add WARNING flag
        candidate.complianceFlags = [{
            id: 'flag1',
            type: 'BEHAVIORAL',
            severity: 'WARNING',
            reason: 'Late arrival',
            createdBy: 'System',
            createdAt: new Date().toISOString(),
            isResolved: false
        }];

        const result = WorkflowEngine.validateTransition(candidate, WorkflowStage.VERIFIED);

        // Should not block based on flag
        const complianceBlockers = result.blockers.filter(b => b.includes('Compliance Flag:'));
        expect(complianceBlockers).toHaveLength(0);
    });
});
