import { WorkflowStage, Candidate } from '../types';
import { WorkflowEngine } from './workflowEngine';

export interface DashboardMetrics {
  totalCandidates: number;
  activeJobs: number; // Mocked
  placements: number; // Mocked
  delayedCases: number;
  criticalAlerts: number;
  stageDistribution: Record<string, number>;
  recentAlerts: Candidate[];
}

export const getDashboardMetrics = (candidates: Candidate[] = []): DashboardMetrics => {
  let delayed = 0;
  let critical = 0;
  const dist: Record<string, number> = {};
  const alerts: Candidate[] = [];

  candidates.forEach(c => {
    // Distribution
    dist[c.stage] = (dist[c.stage] || 0) + 1;

    // Delays
    const sla = WorkflowEngine.calculateSLAStatus(c);
    if (sla.status === 'OVERDUE') {
      delayed++;
      alerts.push(c);
    }

    // Critical Alerts (Mock logic: if delay > 5 days)
    if (sla.daysElapsed > sla.slaDays + 5) {
      critical++;
    }
  });

  return {
    totalCandidates: candidates.length,
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
