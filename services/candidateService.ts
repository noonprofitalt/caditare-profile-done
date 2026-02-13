import { Candidate, TimelineEvent, ProfileCompletionStatus, RegistrationSource, WorkflowStage, StageStatus, MedicalStatus, ComplianceFlag } from '../types';
import { MOCK_CANDIDATES } from './mockData';
import { ProfileCompletionService } from './profileCompletionService';
import { ProfileMergeService } from './profileMergeService';
import WorkflowEngine, { WORKFLOW_STAGES } from './workflowEngine.v2';


const STORAGE_KEY = 'globalworkforce_candidates';

export class CandidateService {
    /**
     * Generate a unique candidate code in the format GW-YYYY-XXXX
     */
    static generateCandidateCode(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `GW-${year}-${random}`;
    }

    static getCandidates(): Candidate[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    return parsed.map((c: any) => {
                        // Migration logic to handle both old and new structures
                        const fullName = c.personalInfo?.fullName || c.name || '';
                        const firstName = c.personalInfo?.firstName || c.firstName || '';
                        const middleName = c.personalInfo?.middleName || c.middleName || '';
                        const lastName = c.personalInfo?.lastName || c.lastName || '';
                        const email = c.contactInfo?.email || c.email || '';
                        const primaryPhone = c.contactInfo?.primaryPhone || c.phone || '';
                        const nic = c.personalInfo?.nic || c.nic || '';

                        return {
                            ...c,
                            // Ensure top-level legacy fields exist
                            id: c.id,
                            candidateCode: c.candidateCode || this.generateCandidateCode(),
                            name: fullName,
                            email: email,
                            phone: primaryPhone,
                            nic: nic,
                            stage: c.stage || WorkflowStage.REGISTERED,

                            // Re-normalize if missing
                            personalInfo: c.personalInfo || {
                                fullName,
                                firstName,
                                middleName,
                                lastName,
                                nic,
                                dob: c.dob,
                                gender: c.gender,
                                maritalStatus: c.maritalStatus,
                                religion: c.religion,
                                address: c.address,
                                city: c.city,
                                district: c.district,
                                gsDivision: c.gsDivision,
                                divisionalSecretariat: c.divisionalSecretariat
                            },
                            contactInfo: c.contactInfo || {
                                primaryPhone,
                                whatsappPhone: c.whatsapp,
                                additionalPhones: c.additionalContactNumbers || [],
                                email: email
                            },
                            professionalProfile: c.professionalProfile || {
                                jobRoles: c.jobRoles || (c.role ? [c.role] : []),
                                experienceYears: c.experienceYears || 0,
                                skills: c.skills || [],
                                education: c.education || [],
                                educationalQualifications: c.educationalQualifications || [],
                                employmentHistory: c.employmentHistory || []
                            },
                            medicalData: c.medicalData || {
                                status: c.stageData?.medicalStatus || MedicalStatus.NOT_STARTED,
                                notes: c.stageData?.medicalNotes,
                                scheduledDate: c.stageData?.medicalScheduledDate,
                                completedDate: c.stageData?.medicalCompletedDate
                            },
                            audit: c.audit || {
                                createdAt: c.applicationDate || new Date().toISOString(),
                                createdBy: 'System',
                                updatedAt: new Date().toISOString(),
                                updatedBy: 'System',
                                version: 1
                            },

                            // Collections
                            documents: Array.isArray(c.documents) ? c.documents : [],
                            timelineEvents: Array.isArray(c.timelineEvents) ? c.timelineEvents : [],
                            workflowLogs: Array.isArray(c.workflowLogs) ? c.workflowLogs : [],
                            comments: Array.isArray(c.comments) ? c.comments : [],
                            preferredCountries: Array.isArray(c.preferredCountries) ? c.preferredCountries : [],
                            passports: Array.isArray(c.passports) ? c.passports : []
                        };
                    });
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
            // Update timestamp and version
            updatedCandidate.audit.updatedAt = new Date().toISOString();
            updatedCandidate.audit.version = (updatedCandidate.audit.version || 0) + 1;

            // 1. Sync FROM nested TO top-level (The new source of truth)
            if (updatedCandidate.personalInfo) {
                updatedCandidate.name = updatedCandidate.personalInfo.fullName;
                updatedCandidate.firstName = updatedCandidate.personalInfo.firstName;
                updatedCandidate.middleName = updatedCandidate.personalInfo.middleName;
                updatedCandidate.nic = updatedCandidate.personalInfo.nic;
                updatedCandidate.dob = updatedCandidate.personalInfo.dob;
                updatedCandidate.gender = updatedCandidate.personalInfo.gender;
                updatedCandidate.maritalStatus = updatedCandidate.personalInfo.maritalStatus;
                updatedCandidate.religion = updatedCandidate.personalInfo.religion;
                updatedCandidate.address = updatedCandidate.personalInfo.address;
                updatedCandidate.city = updatedCandidate.personalInfo.city;
                updatedCandidate.gsDivision = updatedCandidate.personalInfo.gsDivision;
                updatedCandidate.divisionalSecretariat = updatedCandidate.personalInfo.divisionalSecretariat;
                updatedCandidate.district = updatedCandidate.personalInfo.district;
                updatedCandidate.province = updatedCandidate.personalInfo.province;
                updatedCandidate.nationality = updatedCandidate.personalInfo.nationality;
                updatedCandidate.drivingLicenseNo = updatedCandidate.personalInfo.drivingLicenseNo;
                updatedCandidate.height = updatedCandidate.personalInfo.height;
                updatedCandidate.weight = updatedCandidate.personalInfo.weight;
                updatedCandidate.fatherName = updatedCandidate.personalInfo.fatherName;
                updatedCandidate.motherName = updatedCandidate.personalInfo.motherName;
                updatedCandidate.spouseName = updatedCandidate.personalInfo.spouseName;
                updatedCandidate.maritalStatus = updatedCandidate.personalInfo.maritalStatus;
                updatedCandidate.religion = updatedCandidate.personalInfo.religion;

                if (updatedCandidate.personalInfo.children) {
                    (updatedCandidate as any).children = updatedCandidate.personalInfo.children;
                    updatedCandidate.numberOfChildren = updatedCandidate.personalInfo.children.length;
                }
            }

            if (updatedCandidate.contactInfo) {
                updatedCandidate.email = updatedCandidate.contactInfo.email;
                updatedCandidate.phone = updatedCandidate.contactInfo.primaryPhone;
                updatedCandidate.whatsapp = updatedCandidate.contactInfo.whatsappPhone;
                updatedCandidate.additionalContactNumbers = updatedCandidate.contactInfo.additionalPhones;
            }

            if (updatedCandidate.professionalProfile) {
                updatedCandidate.experienceYears = updatedCandidate.professionalProfile.experienceYears;
                updatedCandidate.educationalQualifications = updatedCandidate.professionalProfile.educationalQualifications;
                updatedCandidate.employmentHistory = updatedCandidate.professionalProfile.employmentHistory;
                updatedCandidate.trainingDetails = updatedCandidate.professionalProfile.trainingDetails;
                updatedCandidate.specialAchievements = updatedCandidate.professionalProfile.specialAchievements;
                updatedCandidate.school = updatedCandidate.professionalProfile.school;
                updatedCandidate.gceOL = updatedCandidate.professionalProfile.gceOL;
                updatedCandidate.gceAL = updatedCandidate.professionalProfile.gceAL;

                // Note: jobRoles in professionalProfile is more detailed than 'role' or 'position'
                updatedCandidate.role = typeof updatedCandidate.professionalProfile.jobRoles[0] === 'string'
                    ? updatedCandidate.professionalProfile.jobRoles[0] as string
                    : (updatedCandidate.professionalProfile.jobRoles[0] as any)?.title;
            }

            // 2. Sync FROM top-level TO nested (Extra safety for components still using top-level)
            // If the top-level was updated but nested wasn't, we want to capture it
            // This is secondary to the above to favor nested structure
            if (updatedCandidate.firstName && updatedCandidate.personalInfo.firstName !== updatedCandidate.firstName) {
                updatedCandidate.personalInfo.firstName = updatedCandidate.firstName;
            }
            if (updatedCandidate.nic && updatedCandidate.personalInfo.nic !== updatedCandidate.nic) {
                updatedCandidate.personalInfo.nic = updatedCandidate.nic;
            }
            if (updatedCandidate.dob && updatedCandidate.personalInfo.dob !== updatedCandidate.dob) {
                updatedCandidate.personalInfo.dob = updatedCandidate.dob;
            }
            if (updatedCandidate.gender && updatedCandidate.personalInfo.gender !== updatedCandidate.gender) {
                updatedCandidate.personalInfo.gender = updatedCandidate.gender;
            }

            candidates[index] = updatedCandidate;
            this.saveCandidates(candidates);
        }
    }

    static addTimelineEvent(candidateId: string, event: Partial<TimelineEvent>): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === candidateId);
        if (index !== -1) {
            const candidate = candidates[index];
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
            this.updateCandidate(candidate);
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
            this.updateCandidate(candidates[index]);
        }
    }

    /**
     * Soft delete candidate
     */
    static deleteCandidate(id: string, user: string = 'Current User'): void {
        const candidate = this.getCandidateById(id);
        if (candidate) {
            candidate.audit.deletedAt = new Date().toISOString();
            candidate.audit.updatedBy = user;
            this.updateCandidate(candidate);
        }
    }

    /**
     * Get all active candidates (not soft deleted)
     */
    static getActiveCandidates(): Candidate[] {
        return this.getCandidates().filter(c => !c.audit.deletedAt);
    }

    /**
     * Advance candidate to the next stage with strict validation
     */
    static async advanceStage(candidateId: string, userId: string): Promise<{ success: boolean; error?: string; blockers?: string[] }> {
        const candidate = this.getCandidateById(candidateId);
        if (!candidate) return { success: false, error: 'Candidate not found' };

        const nextStage = WorkflowEngine.getNextStage(candidate.stage);
        if (!nextStage) return { success: false, error: 'No next stage available (already at final stage)' };

        // Perform transition using Engine
        const result = WorkflowEngine.performTransition(candidate, nextStage, userId);

        if (!result.success) {
            // Log failed attempt
            this.addTimelineEvent(candidateId, {
                type: 'SYSTEM',
                title: 'Stage Advance Failed',
                description: `Attempt to advance to ${nextStage} blocked.`,
                metadata: { error: result.error }
            });
            return { success: false, error: result.error };
        }

        if (result.event) {
            candidate.stage = nextStage;
            candidate.stageEnteredAt = new Date().toISOString();

            // Add engine generated event
            const timelineEvent: TimelineEvent = {
                id: result.event.id,
                type: 'STAGE_TRANSITION',
                title: `Advanced to ${nextStage}`,
                description: `Successfully advanced from ${result.event.fromStage} to ${nextStage}`,
                timestamp: result.event.timestamp.toISOString(),
                actor: userId,
                stage: nextStage,
                metadata: {
                    slaStatus: result.event.slaStatus,
                    daysInPreviousStage: result.event.daysInPreviousStage
                }
            };

            candidate.timelineEvents = [timelineEvent, ...(candidate.timelineEvents || [])];
            this.updateCandidate(candidate);
        }

        return { success: true };
    }

    /**
     * Rollback candidate to a previous stage
     */
    static async rollbackStage(candidateId: string, targetStage: WorkflowStage, reason: string, userId: string): Promise<{ success: boolean; error?: string }> {
        const candidate = this.getCandidateById(candidateId);
        if (!candidate) return { success: false, error: 'Candidate not found' };

        // Perform transition using Engine (it handles rollback validation)
        const result = WorkflowEngine.performTransition(candidate, targetStage, userId, reason);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        if (result.event) {
            const previousStage = candidate.stage;
            candidate.stage = targetStage;
            candidate.stageEnteredAt = new Date().toISOString();

            // Add engine generated event
            const timelineEvent: TimelineEvent = {
                id: result.event.id,
                type: 'MANUAL_OVERRIDE',
                title: `Rollback to ${targetStage}`,
                description: `Rolled back from ${previousStage} to ${targetStage}. Reason: ${reason}`,
                timestamp: result.event.timestamp.toISOString(),
                actor: userId,
                stage: targetStage,
                metadata: {
                    reason
                }
            };

            candidate.timelineEvents = [timelineEvent, ...(candidate.timelineEvents || [])];
            this.updateCandidate(candidate);
        }

        return { success: true };
    }

    // Deprecated: Use rollbackStage instead
    static rollbackTransition(candidateId: string, actorName: string = 'Admin User'): void {
        console.warn('rollbackTransition is deprecated. Use rollbackStage instead.');
    }

    static createQuickCandidate(data: any): Candidate {
        const fullName = data.name || `${data.firstName || ''} ${data.middleName || ''}`.trim();
        const candidate: Candidate = {
            id: `cand-${Date.now()}`,
            candidateCode: this.generateCandidateCode(),
            name: fullName,
            email: data.email || '',
            phone: data.phone || '',
            nic: data.nic || '',
            stage: WorkflowStage.REGISTERED,

            personalInfo: {
                fullName,
                firstName: data.firstName,
                middleName: data.middleName,
                nic: data.nic,
                dob: data.dob,
                gender: data.gender,
                address: data.address
            },
            contactInfo: {
                primaryPhone: data.phone || '',
                whatsappPhone: data.whatsapp || data.phone,
                additionalPhones: data.additionalContactNumbers || [],
                email: data.email || ''
            },
            professionalProfile: {
                jobRoles: data.jobRoles || (data.role ? [data.role] : []),
                experienceYears: data.experienceYears || 0,
                skills: data.skills || [],
                education: data.education || []
            },
            medicalData: {
                status: MedicalStatus.NOT_STARTED
            },

            profileType: 'QUICK',
            profileCompletionStatus: ProfileCompletionStatus.QUICK,
            registrationSource: RegistrationSource.QUICK_FORM,
            profileCompletionPercentage: 0,

            stageStatus: StageStatus.PENDING,
            stageEnteredAt: new Date().toISOString(),
            stageData: {},
            workflowLogs: [],
            timelineEvents: [],
            comments: [],
            preferredCountries: data.preferredCountries || [],
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=random`,
            documents: [],
            passports: [],

            audit: {
                createdAt: new Date().toISOString(),
                createdBy: 'System',
                updatedAt: new Date().toISOString(),
                updatedBy: 'System',
                version: 1
            }
        };

        const updatedCandidate = ProfileCompletionService.updateCompletionData(candidate);

        const quickAddEvent: TimelineEvent = {
            id: `evt-quickadd-${Date.now()}`,
            type: 'SYSTEM',
            title: 'Quick Add Registration',
            description: 'Candidate added via Quick Add form',
            timestamp: new Date().toISOString(),
            actor: 'System',
            stage: WorkflowStage.REGISTERED
        };

        updatedCandidate.timelineEvents = [quickAddEvent];
        this.addCandidate(updatedCandidate);
        return updatedCandidate;
    }

    static upgradeToFullProfile(candidateId: string, fullData: Partial<Candidate>): void {
        const candidates = this.getCandidates();
        const index = candidates.findIndex(c => c.id === candidateId);

        if (index !== -1) {
            const existingCandidate = candidates[index];
            const mergedCandidate = ProfileMergeService.mergeProfiles(existingCandidate, fullData);

            if (existingCandidate.profileCompletionStatus === ProfileCompletionStatus.QUICK) {
                mergedCandidate.profileType = 'FULL';
                mergedCandidate.registrationSource = RegistrationSource.FULL_FORM;
            }

            this.updateCandidate(mergedCandidate);
        }
    }
    static async addComplianceFlag(candidateId: string, flagData: Pick<ComplianceFlag, 'type' | 'severity' | 'reason' | 'createdBy'>): Promise<Candidate | null> {
        const candidate = this.getCandidateById(candidateId);
        if (!candidate) return null;

        if (!candidate.complianceFlags) {
            candidate.complianceFlags = [];
        }

        const newFlag: ComplianceFlag = {
            id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...flagData,
            createdAt: new Date().toISOString(),
            isResolved: false
        };

        candidate.complianceFlags.push(newFlag);

        // Audit
        if (!candidate.timelineEvents) candidate.timelineEvents = [];
        candidate.timelineEvents.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            // candidateId removed
            type: 'STATUS_CHANGE',
            title: `Compliance Flag Added: ${flagData.type}`,
            description: `[${flagData.severity}] ${flagData.reason}`,
            timestamp: new Date().toISOString(),
            actor: 'System', // Or flagData.createdBy if we trust it
            stage: candidate.stage,
            metadata: { flagId: newFlag.id, severity: flagData.severity }
        });

        this.updateCandidate(candidate);
        return candidate;
    }

    static async resolveComplianceFlag(candidateId: string, flagId: string, notes: string, resolvedBy: string): Promise<Candidate | null> {
        const candidate = this.getCandidateById(candidateId);
        if (!candidate) return null;
        if (!candidate.complianceFlags) return candidate;

        const flagIndex = candidate.complianceFlags.findIndex(f => f.id === flagId);
        if (flagIndex !== -1) {
            const flag = candidate.complianceFlags[flagIndex];
            flag.isResolved = true;
            flag.resolvedBy = resolvedBy;
            flag.resolvedAt = new Date().toISOString();
            flag.resolutionNotes = notes;

            // Audit
            if (!candidate.timelineEvents) candidate.timelineEvents = [];
            candidate.timelineEvents.push({
                id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                // candidateId removed
                type: 'STATUS_CHANGE',
                title: `Compliance Flag Resolved: ${flag.type}`,
                description: `Resolved by ${resolvedBy}. Notes: ${notes}`,
                timestamp: new Date().toISOString(),
                actor: resolvedBy,
                stage: candidate.stage,
                metadata: { flagId: flag.id }
            });

            this.updateCandidate(candidate);
        }
        return candidate;
    }
}

