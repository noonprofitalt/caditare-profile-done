import { MOCK_CANDIDATES } from './mockData';
import { WorkflowStage, Candidate } from '../types';
import { getSLAStatus } from './workflowEngine';

export interface DashboardMetrics {
  totalCandidates: number;
  activeJobs: number; // Mocked
  placements: number; // Mocked
  delayedCases: number;
  criticalAlerts: number;
  stageDistribution: Record<string, number>;
  recentAlerts: Candidate[];
}

export const getDashboardMetrics = (): DashboardMetrics => {
  let delayed = 0;
  let critical = 0;
  const dist: Record<string, number> = {};
  const alerts: Candidate[] = [];

  MOCK_CANDIDATES.forEach(c => {
    // Distribution
    dist[c.stage] = (dist[c.stage] || 0) + 1;

    // Delays
    const sla = getSLAStatus(c);
    if (sla.overdue) {
      delayed++;
      alerts.push(c);
    }

    // Critical Alerts (Mock logic: if delay > 5 days)
    if (sla.daysInStage > sla.slaLimit + 5) {
      critical++;
    }
  });

  return {
    totalCandidates: MOCK_CANDIDATES.length,
    activeJobs: 45,
    placements: 328,
    delayedCases: delayed,
    criticalAlerts: critical,
    stageDistribution: dist,
    recentAlerts: alerts
  };
};

 
export const getAverageTimeInStage = (_stage: WorkflowStage): number => {
  // Mock calculation - in real app would aggregate from timeline_events
  return Math.floor(Math.random() * 5) + 1;
};
