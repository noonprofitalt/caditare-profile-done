import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskEngine } from '../services/taskEngine';
import { WorkflowEngine } from '../services/workflowEngine.v2';
import { Candidate, WorkflowStage, ComplianceFlag, PassportStatus, PCCStatus } from '../types';

describe('TaskEngine', () => {
    let candidate: Candidate;

    beforeEach(() => {
        candidate = {
            id: 'test-candidate-1',
            name: 'Test User',
            stage: WorkflowStage.REGISTERED,
            complianceFlags: [],
            documents: [],
            passportData: { status: PassportStatus.VALID } as any,
            pccData: { status: PCCStatus.VALID } as any,
            stageHistory: [], // For SLA calc
        } as Candidate;

        // Mock SLA to be ON_TIME by default
        vi.spyOn(WorkflowEngine, 'calculateSLAStatus').mockReturnValue({
            status: 'ON_TIME',
            daysElapsed: 1
        } as any);
    });

    it('should generate CRITICAL task for CRITICAL compliance flag', () => {
        candidate.complianceFlags = [{
            id: 'f1',
            type: 'LEGAL',
            severity: 'CRITICAL',
            reason: 'Blacklisted',
            isResolved: false,
            createdBy: 'Sys'
        }];

        const tasks = TaskEngine.generateWorkQueue([candidate]);

        const flagTask = tasks.find(t => t.id.includes('task-flag-crit'));
        expect(flagTask).toBeDefined();
        expect(flagTask?.priority).toBe('Critical');
        expect(flagTask?.title).toBe('Critical Compliance Issue');
    });

    it('should generate MEDIUM task for WARNING compliance flag', () => {
        candidate.complianceFlags = [{
            id: 'f2',
            type: 'BEHAVIORAL',
            severity: 'WARNING',
            reason: 'Rude',
            isResolved: false,
            createdBy: 'Sys'
        }];

        const tasks = TaskEngine.generateWorkQueue([candidate]);

        const flagTask = tasks.find(t => t.id.includes('task-flag-warn'));
        expect(flagTask).toBeDefined();
        expect(flagTask?.priority).toBe('Medium');
        expect(flagTask?.title).toBe('Compliance Warning');
    });

    it('should generate ALERTS for expired passport', () => {
        candidate.passportData = { status: PassportStatus.EXPIRED } as any;

        const alerts = TaskEngine.generateAlerts([candidate]);

        const pptAlert = alerts.find(a => a.id === 'alert-ppt-exp');
        expect(pptAlert).toBeDefined();
        expect(pptAlert?.count).toBe(1);
    });

    it('should generate ALERTS for expired PCC', () => {
        candidate.pccData = { status: PCCStatus.EXPIRED } as any;

        const alerts = TaskEngine.generateAlerts([candidate]);

        const pccAlert = alerts.find(a => a.id === 'alert-pcc-exp');
        expect(pccAlert).toBeDefined();
        expect(pccAlert?.count).toBe(1);
    });
});
