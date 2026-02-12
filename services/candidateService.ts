import { Candidate, TimelineEvent, ProfileCompletionStatus, RegistrationSource, WorkflowStage, StageStatus } from '../types';
import { MOCK_CANDIDATES } from './mockData';
import { ProfileCompletionService } from './profileCompletionService';
import { ProfileMergeService } from './profileMergeService';


const STORAGE_KEY = 'globalworkforce_candidates';

export class CandidateService {
    static getCandidates(): Candidate[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const candidates = parsed.map((c: Candidate) => ({
                        ...c,
                        documents: Array.isArray(c.documents) ? c.documents : [],
                        timelineEvents: Array.isArray(c.timelineEvents) ? c.timelineEvents : [],
                        stageData: c.stageData || {},
                        skills: Array.isArray(c.skills) ? c.skills : [],
                        education: Array.isArray(c.education) ? c.education : [],
                        workflowLogs: Array.isArray(c.workflowLogs) ? c.workflowLogs : [],
                        preferredCountries: Array.isArray(c.preferredCountries) ? c.preferredCountries : [],
                        jobRoles: Array.isArray(c.jobRoles) ? c.jobRoles : [],
                        // Auto-migrate legacy candidates
                        profileCompletionStatus: c.profileCompletionStatus || ProfileCompletionStatus.COMPLETE,
                        registrationSource: c.registrationSource || RegistrationSource.FULL_FORM,
                        profileCompletionPercentage: c.profileCompletionPercentage ?? 100,
                        additionalContactNumbers: c.additionalContactNumbers || []
                    }));
                    return candidates;
                }
                return [];
            } catch (e) {
                console.error("Failed to parse stored candidates", e);
            }
        }

        // Seed with mock data if empty
        this.saveCandidates(MOCK_CANDIDATES);
        return MOCK_CANDIDATES;
    }

    static getCandidateById(id: string): Candidate | undefined {
        const candidates = this.getCandidates();
        return candidates.find(c => c.id === id);
    }

    static saveCandidates(candidates: Candidate[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    }

    static updateCandidate(updatedCandidate: Candidate): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === updatedCandidate.id);
        if (index !== -1) {
            candidates[index] = updatedCandidate;
            this.saveCandidates(candidates);
        }
    }

    static addCandidate(candidate: Candidate): void {
        const candidates = this.getCandidates();
        candidates.push(candidate);
        this.saveCandidates(candidates);
    }

    static addComment(candidateId: string, author: string, text: string, isInternal: boolean = true): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === candidateId);
        if (index !== -1) {
            if (!candidates[index].comments) {
                candidates[index].comments = [];
            }
            candidates[index].comments.push({
                id: `comm-${Date.now()}`,
                candidateId,
                author,
                text,
                timestamp: new Date().toISOString(),
                isInternal
            });
            this.saveCandidates(candidates);
        }
    }

    static deleteCandidate(id: string): void {
        const candidates = this.getCandidates();
        const filtered = candidates.filter(c => c.id !== id);
        this.saveCandidates(filtered);
    }

    static rollbackTransition(candidateId: string, actorName: string = 'Admin User'): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === candidateId);
        if (index !== -1) {
            const candidate = candidates[index];
            // Find the last stage from workflow logs
            if (candidate.timelineEvents && candidate.timelineEvents.length > 1) {
                // The current stage event is likely the first one in the sorted list (if sorted desc)
                // Filter for STAGE_TRANSITION or MANUAL_OVERRIDE events
                const transitionEvents = candidate.timelineEvents.filter(e =>
                    e.type === 'STAGE_TRANSITION' || e.type === 'SYSTEM' || e.type === 'MANUAL_OVERRIDE'
                );

                if (transitionEvents.length > 1) {
                    // The "current" is transitionEvents[0], the "previous" is transitionEvents[1]
                    const previousEvent = transitionEvents[1];
                    const previousStage = previousEvent.stage;

                    // Create a rollback event
                    const rollbackEvent: TimelineEvent = {
                        id: `evt-rollback-${Date.now()}`,
                        type: 'MANUAL_OVERRIDE',
                        title: `Rollback to ${previousStage}`,
                        description: `Administrator rolled back the last stage transition from ${candidate.stage} to ${previousStage}.`,
                        timestamp: new Date().toISOString(),
                        actor: actorName,
                        stage: previousStage
                    };

                    candidate.stage = previousStage;
                    candidate.stageEnteredAt = new Date().toISOString();
                    candidate.timelineEvents = [rollbackEvent, ...candidate.timelineEvents];

                    this.saveCandidates(candidates);
                }
            }
        }
    }

    // ===== DUAL-FORM SYSTEM METHODS =====

    /**
     * Create a Quick Add candidate with minimal required fields
     * @param data - Minimal candidate data from Quick Add form
     * @returns Created candidate
     */
    static createQuickCandidate(data: Partial<Candidate>): Candidate {
        const candidate: Candidate = {
            id: `cand-${Date.now()}`,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp,
            nic: data.nic,
            role: data.role || 'Not Specified',
            experienceYears: data.experienceYears || 0,
            skills: data.skills || [],
            location: data.location || '',
            preferredCountries: data.preferredCountries || [],
            jobRoles: data.jobRoles || [],
            avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random`,

            // Profile Completion Tracking
            profileCompletionStatus: ProfileCompletionStatus.QUICK,
            registrationSource: RegistrationSource.QUICK_FORM,
            profileCompletionPercentage: 0, // Will be calculated

            // Workflow
            stage: WorkflowStage.REGISTRATION,
            stageStatus: StageStatus.PENDING,
            stageEnteredAt: new Date().toISOString(),
            stageData: {},
            workflowLogs: [],

            // Arrays
            documents: [],
            timelineEvents: [],
            comments: [],
            additionalContactNumbers: data.additionalContactNumbers || []
        };

        // Calculate initial completion percentage
        const updatedCandidate = ProfileCompletionService.updateCompletionData(candidate);

        // Create timeline event
        const quickAddEvent: TimelineEvent = {
            id: `evt-quickadd-${Date.now()}`,
            type: 'SYSTEM',
            title: 'Quick Add Registration',
            description: 'Candidate added via Quick Add form',
            timestamp: new Date().toISOString(),
            actor: 'System',
            stage: WorkflowStage.REGISTRATION,
            metadata: {}
        };

        updatedCandidate.timelineEvents = [quickAddEvent];

        this.addCandidate(updatedCandidate);
        return updatedCandidate;
    }

    /**
     * Upgrade a Quick Add profile to Full Application
     * @param candidateId - ID of candidate to upgrade
     * @param fullData - Complete data from Full Application form
     */
    static upgradeToFullProfile(candidateId: string, fullData: Partial<Candidate>): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === candidateId);

        if (index !== -1) {
            const existingCandidate = candidates[index];
            const mergedCandidate = ProfileMergeService.mergeProfiles(existingCandidate, fullData);

            // Update registration source if upgrading from Quick
            if (existingCandidate.profileCompletionStatus === ProfileCompletionStatus.QUICK) {
                mergedCandidate.registrationSource = RegistrationSource.FULL_FORM;
            }

            candidates[index] = mergedCandidate;
            this.saveCandidates(candidates);
        }
    }

    /**
     * Get all incomplete candidates (QUICK or PARTIAL)
     * @returns Array of incomplete candidates
     */
    static getIncompleteCandidates(): Candidate[] {
        const candidates = this.getCandidates();
        return candidates.filter(c =>
            c.profileCompletionStatus === ProfileCompletionStatus.QUICK ||
            c.profileCompletionStatus === ProfileCompletionStatus.PARTIAL
        );
    }

    /**
     * Get candidates by completion status
     * @param status - ProfileCompletionStatus to filter by
     * @returns Array of matching candidates
     */
    static getCandidatesByCompletionStatus(status: ProfileCompletionStatus): Candidate[] {
        const candidates = this.getCandidates();
        return candidates.filter(c => c.profileCompletionStatus === status);
    }
}
