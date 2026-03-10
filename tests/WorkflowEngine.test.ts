import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine } from '../services/workflowEngine.v2';
import { WorkflowStage, Candidate, ProfileCompletionStatus, RegistrationSource, DocumentType, DocumentStatus, DocumentCategory, StageStatus } from '../types';
import { AuditService } from '../services/auditService';

// Mock the AuditService
vi.mock('../services/auditService', () => ({
    AuditService: {
        log: vi.fn(),
    }
}));

// Mock the ComplianceEngine inside workflowEngine.v2 if needed, 
// though we can probably just use it as it's pure logic.
vi.mock('../services/compliance/ComplianceEngine', () => ({
    ComplianceEngine: {
        evaluateCandidate: vi.fn(() => ({ results: [], isCompliant: true }))
    }
}));

describe('WorkflowEngine', () => {

    let mockCandidate: Candidate;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a base valid candidate mock
        mockCandidate = {
            id: 'cand-123',
            candidateCode: 'GW-2026-0001',
            regNo: 'TEST-123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            stage: WorkflowStage.REGISTERED,
            profileType: 'FULL',
            profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
            registrationSource: RegistrationSource.FULL_FORM,
            profileCompletionPercentage: 100,
            stageStatus: StageStatus.COMPLETED,
            stageEnteredAt: new Date().toISOString(),
            stageData: {},
            workflowLogs: [],
            timelineEvents: [],
            comments: [],
            preferredCountries: [],
            documents: [],
            avatarUrl: '',
            personalInfo: { fullName: 'John Doe' } as any,
            contactInfo: { primaryPhone: '1234567890', email: 'john@example.com' },
            professionalProfile: { jobRoles: ['Worker'], experienceYears: 2, skills: [], education: ['High School'] },
            medicalData: { status: 'Completed' } as any,
            audit: {
                createdAt: new Date().toISOString(),
                createdBy: 'system',
                updatedAt: new Date().toISOString(),
                updatedBy: 'system',
                version: 1,
            }
        };
    });

    describe('Sequential Navigation', () => {
        it('should correctly identify the next stage', () => {
            expect(WorkflowEngine.getNextStage(WorkflowStage.REGISTERED)).toBe(WorkflowStage.VERIFIED);
            expect(WorkflowEngine.getNextStage(WorkflowStage.VERIFIED)).toBe(WorkflowStage.APPLIED);
            expect(WorkflowEngine.getNextStage(WorkflowStage.DEPARTED)).toBeNull(); // No next stage
        });

        it('should correctly identify the previous stage', () => {
            expect(WorkflowEngine.getPreviousStage(WorkflowStage.VERIFIED)).toBe(WorkflowStage.REGISTERED);
            expect(WorkflowEngine.getPreviousStage(WorkflowStage.REGISTERED)).toBeNull(); // No previous stage
        });

        it('should validate sequential transitions', () => {
            // Forward by 1 is sequential
            expect(WorkflowEngine.isSequentialTransition(WorkflowStage.REGISTERED, WorkflowStage.VERIFIED)).toBe(true);

            // Forward by >1 is NOT sequential
            expect(WorkflowEngine.isSequentialTransition(WorkflowStage.REGISTERED, WorkflowStage.APPLIED)).toBe(false);

            // Backward is sequential (rollback)
            expect(WorkflowEngine.isSequentialTransition(WorkflowStage.APPLIED, WorkflowStage.REGISTERED)).toBe(true);
        });
    });

    describe('Transitions', () => {
        it('should block non-sequential forward transitions', () => {
            const result = WorkflowEngine.validateTransition(mockCandidate, WorkflowStage.APPLIED);
            expect(result.allowed).toBe(false);
            expect(result.blockers[0]).toContain('Non-sequential transition');
        });

        it('should allow rollback transitions with a warning', () => {
            mockCandidate.stage = WorkflowStage.APPLIED;
            const result = WorkflowEngine.validateTransition(mockCandidate, WorkflowStage.VERIFIED);

            expect(result.allowed).toBe(true);
            expect(result.warnings[0]).toContain('rollback');
        });

        describe('REGISTERED to VERIFIED', () => {
            it('should block transition if Passport is missing', () => {
                mockCandidate.documents = [
                    {
                        id: 'doc-cv', type: DocumentType.CV, status: DocumentStatus.APPROVED,
                        category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: []
                    }
                ];

                const result = WorkflowEngine.validateTransition(mockCandidate, WorkflowStage.VERIFIED);
                expect(result.allowed).toBe(false);
                expect(result.missingDocuments).toContain('Passport document');
            });

            it('should block transition if CV is missing', () => {
                mockCandidate.documents = [
                    {
                        id: 'doc-pass', type: DocumentType.PASSPORT, status: DocumentStatus.APPROVED,
                        category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: []
                    }
                ];

                const result = WorkflowEngine.validateTransition(mockCandidate, WorkflowStage.VERIFIED);
                expect(result.allowed).toBe(false);
                expect(result.missingDocuments).toContain('CV/Resume document');
            });

            it('should allow transition if Passport and CV are approved', () => {
                mockCandidate.documents = [
                    {
                        id: 'doc-pass', type: DocumentType.PASSPORT, status: DocumentStatus.APPROVED,
                        category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: []
                    },
                    {
                        id: 'doc-cv', type: DocumentType.CV, status: DocumentStatus.APPROVED,
                        category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: []
                    }
                ];

                const result = WorkflowEngine.validateTransition(mockCandidate, WorkflowStage.VERIFIED);
                expect(result.allowed).toBe(true);
                expect(result.blockers.length).toBe(0);
            });
        });
    });

    describe('performTransition', () => {
        it('should log audit events on success', () => {
            // Setup successful transition scenario
            mockCandidate.documents = [
                { id: '1', type: DocumentType.PASSPORT, status: DocumentStatus.APPROVED, category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: [] },
                { id: '2', type: DocumentType.CV, status: DocumentStatus.APPROVED, category: DocumentCategory.MANDATORY_REGISTRATION, version: 1, logs: [] }
            ];

            const result = WorkflowEngine.performTransition(
                mockCandidate,
                WorkflowStage.VERIFIED,
                'user-123'
            );

            expect(result.success).toBe(true);
            expect(result.event?.transitionType).toBe('FORWARD');
            expect(AuditService.log).toHaveBeenCalledWith(
                'WORKFLOW_TRANSITION',
                expect.any(Object),
                'user-123'
            );
        });

        it('should fail rollback if no reason is provided', () => {
            mockCandidate.stage = WorkflowStage.VERIFIED;

            const result = WorkflowEngine.performTransition(
                mockCandidate,
                WorkflowStage.REGISTERED,
                'user-123'
                // no reason provided
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('requires a reason');
        });
    });
});
