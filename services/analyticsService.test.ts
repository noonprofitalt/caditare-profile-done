import { describe, it, expect } from 'vitest';
import { getDashboardMetrics } from './analyticsService';

describe('AnalyticsService', () => {
    it('should return dashboard metrics', () => {
        const metrics = getDashboardMetrics();
        expect(metrics).toBeDefined();
        expect(metrics.totalCandidates).toBeGreaterThanOrEqual(0);
        expect(metrics.activeJobs).toBe(45); // Mocked value
    });
});
