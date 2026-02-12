import { Candidate, TimelineEvent } from '../types';
import { ProfileCompletionService } from './profileCompletionService';

/**
 * Profile Merge Service
 * Safely merges Quick Add data with Full Application data
 */
export class ProfileMergeService {
    /**
     * Merge existing candidate profile with new data from Full Application
     * Preserves critical data like notes, payments, timeline, and documents
     * @param existingCandidate - Current candidate record
     * @param newData - New data from Full Application form
     * @returns Merged candidate object
     */
    static mergeProfiles(existingCandidate: Candidate, newData: Partial<Candidate>): Candidate {
        // Fields to preserve (never overwrite)
        const preservedFields = {
            id: existingCandidate.id,
            comments: existingCandidate.comments || [],
            timelineEvents: existingCandidate.timelineEvents || [],
            workflowLogs: existingCandidate.workflowLogs || [],
            documents: existingCandidate.documents || [],
            stageData: {
                ...existingCandidate.stageData,
                paymentHistory: existingCandidate.stageData?.paymentHistory || [],
                ...newData.stageData
            }
        };

        // Merge all other fields from newData
        const merged: Candidate = {
            ...existingCandidate,
            ...newData,
            ...preservedFields
        };

        // Recalculate profile completion
        const updatedCandidate = ProfileCompletionService.updateCompletionData(merged);

        // Create timeline event if status changed
        if (existingCandidate.profileCompletionStatus !== updatedCandidate.profileCompletionStatus) {
            const upgradeEvent: TimelineEvent = {
                id: `evt-upgrade-${Date.now()}`,
                type: 'STAGE_TRANSITION',
                title: 'Profile Completed',
                description: `Profile upgraded from ${existingCandidate.profileCompletionStatus} to ${updatedCandidate.profileCompletionStatus}`,
                timestamp: new Date().toISOString(),
                actor: 'System',
                stage: updatedCandidate.stage,
                metadata: {
                    oldStatus: existingCandidate.profileCompletionStatus,
                    newStatus: updatedCandidate.profileCompletionStatus
                }
            };

            updatedCandidate.timelineEvents = [upgradeEvent, ...updatedCandidate.timelineEvents];
        }

        return updatedCandidate;
    }

    /**
     * Safely update specific fields without full merge
     * @param candidate - Candidate to update
     * @param updates - Partial updates to apply
     * @returns Updated candidate
     */
    static updateFields(candidate: Candidate, updates: Partial<Candidate>): Candidate {
        const updated = {
            ...candidate,
            ...updates
        };

        // Recalculate completion if data changed
        return ProfileCompletionService.updateCompletionData(updated);
    }

    /**
     * Validate merge operation
     * Ensures critical data won't be lost
     * @param existingCandidate - Current candidate
     * @param newData - New data to merge
     * @returns Validation result with warnings
     */
    static validateMerge(existingCandidate: Candidate, newData: Partial<Candidate>): {
        isValid: boolean;
        warnings: string[];
    } {
        const warnings: string[] = [];

        // Check if we're losing payment history
        if ((existingCandidate.stageData?.paymentHistory?.length ?? 0) > 0 &&
            !newData.stageData?.paymentHistory) {
            warnings.push('Payment history will be preserved from existing record');
        }

        // Check if we're losing comments
        if (existingCandidate.comments?.length > 0) {
            warnings.push(`${existingCandidate.comments.length} existing comments will be preserved`);
        }

        // Check if we're losing timeline events
        if (existingCandidate.timelineEvents?.length > 0) {
            warnings.push(`${existingCandidate.timelineEvents.length} timeline events will be preserved`);
        }

        // Check if we're losing documents
        if (existingCandidate.documents?.length > 0) {
            warnings.push(`${existingCandidate.documents.length} existing documents will be preserved`);
        }

        return {
            isValid: true,
            warnings
        };
    }
}
