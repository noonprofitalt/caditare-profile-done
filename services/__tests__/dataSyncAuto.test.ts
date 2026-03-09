import { describe, it, expect } from 'vitest';
import { DataSyncService } from '../dataSyncService';
import { Candidate, WorkflowStage, StageStatus } from '../../types';

describe('DataSyncService Integration', () => {
    it('should synchronize targetCountry and position bidirectionally', () => {
        const initialCandidate: Partial<Candidate> = {
            targetCountry: 'Romania',
            position: 'General Worker',
            personalInfo: {
                fullName: 'Test User',
                nic: '123456789V'
            } as any
        };

        // Sync to nested
        const synced = DataSyncService.fullSync(initialCandidate);

        // Assert flat fields preserved
        expect(synced.targetCountry).toBe('Romania');
        expect(synced.position).toBe('General Worker');

        // Assert role and country aliases updated
        expect(synced.role).toBe('General Worker');
        expect((synced as any).country).toBe('Romania');

        // Assert professionalProfile updated
        expect(synced.professionalProfile?.jobRoles[0]).toBe('General Worker');
    });

    it('should maintain backward compatibility between country/targetCountry and role/position', () => {
        const legacyCandidate: any = {
            country: 'UAE',
            role: 'Driver',
            personalInfo: { fullName: 'Legacy User' }
        };

        const synced = DataSyncService.fullSync(legacyCandidate);

        expect(synced.targetCountry).toBe('UAE');
        expect(synced.position).toBe('Driver');
    });
});
