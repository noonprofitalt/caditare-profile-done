/**
 * Intelligence & Dashboard Types
 * KPI metrics, staff performance, system snapshots, tasks, alerts
 */

import { WorkflowStage } from './workflow.types';

export interface KPIMetrics {
    totalCandidates: number;
    activeProcessing: number;
    completedDepartures: number;
    criticalDelays: number;
    revenueEst: number;
    avgProcessDays: number;
    projectedDepartures?: number;
}

export interface StaffSession {
    loginTime: string;
    logoutTime?: string;
    durationMinutes: number;
}

export interface StaffWorkBreakdown {
    candidatesCreated: number;
    candidatesUpdated: number;
    documentsUploaded: number;
    chatMessagesSent: number;
    usersManaged: number;
    bulkExports: number;
    otherActions: number;
}

export interface StaffDailyActivity {
    date: string;
    actions: number;
}

export interface StaffCandidateSummary {
    id: string;
    name: string;
    stage: string;
    lastActionAt: string;
    latestActionTitle: string;
}

export interface StaffPerformanceMetric {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatarUrl?: string;
    accountCreatedAt: string;
    actionsPerformed: number;
    lastActive: string;
    firstActive: string;
    mostActiveStage: string;
    efficiencyScore: number;
    sessions: StaffSession[];
    totalSessions: number;
    totalUptimeMinutes: number;
    avgSessionMinutes: number;
    workBreakdown: StaffWorkBreakdown;
    candidatesWorkedOn: StaffCandidateSummary[];
    dailyActivity: StaffDailyActivity[];
    stageBreakdown: Record<string, number>;
}

export interface BottleneckMetric {
    stage: string;
    count: number;
    avgDays: number;
    slaLimit: number;
    status: 'Good' | 'Warning' | 'Critical';
}

export interface SystemSnapshot {
    timestamp: string;
    kpi: KPIMetrics;
    stageDistribution: { name: string; value: number }[];
    bottlenecks: BottleneckMetric[];
    staffMetrics: StaffPerformanceMetric[];
    financials: {
        totalCollected: number;
        pendingCollection: number;
        projectedRevenue: number;
        pipelineValue: number;
        revenueByStage: Array<{ name: string; value: number }>;
    };
    aiSummary?: string;
}

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface WorkTask {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    candidateId: string;
    candidateName: string;
    stage: WorkflowStage;
    dueDate: string;
    actionLabel: string;
    type: 'VERIFICATION' | 'APPROVAL' | 'FOLLOW_UP' | 'PAYMENT' | 'ISSUE';
}

export interface SystemAlert {
    id: string;
    type: 'DELAY' | 'INFO' | 'WARNING' | 'SUCCESS';
    message: string;
    timestamp: string;
    count?: number;
}

export interface AppNotification {
    id: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DELAY';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    link?: string;
    candidateId?: string;
}
