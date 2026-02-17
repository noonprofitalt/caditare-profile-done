import { Candidate, WorkflowStage, SystemSnapshot, BottleneckMetric, StaffPerformanceMetric } from '../types';
import { SLA_CONFIG, WORKFLOW_STAGES, WorkflowEngine } from './workflowEngine.v2';
import { CandidateService } from './candidateService';

export class ReportingService {

  /**
   * Generates a complete 360 system snapshot
   */
  static async getSystemSnapshot(): Promise<SystemSnapshot> {
    const candidates = await CandidateService.getCandidates();

    return {
      timestamp: new Date().toISOString(),
      kpi: this.calculateKPIs(candidates),
      stageDistribution: this.calculateStageDistribution(candidates),
      bottlenecks: this.calculateBottlenecks(candidates),
      staffMetrics: this.calculateStaffPerformance(candidates),
      financials: this.calculateFinancials(candidates)
    };
  }

  /**
   * Core KPI Calculation
   */
  private static calculateKPIs(candidates: Candidate[]) {
    const total = candidates.length;
    const completed = candidates.filter(c => c.stage === WorkflowStage.DEPARTED).length;
    const active = total - completed;

    // Critical Delays
    const delays = candidates.filter(c => WorkflowEngine.calculateSLAStatus(c).status === 'OVERDUE').length;

    // Revenue Estimation (Sum of payment history + estimates)
    const revenue = candidates.reduce((sum, c) => {
      const paid = c.stageData?.paymentHistory?.reduce((pSum, rec) => pSum + parseFloat(rec.amount || '0'), 0) || 0;
      return sum + paid;
    }, 0);

    // Average processing time for completed candidates (Registration to Arrival)
    const completedCandidates = candidates.filter(c => c.stage === WorkflowStage.DEPARTED);
    const avgDays = completedCandidates.length > 0
      ? Math.round(completedCandidates.reduce((sum, c) => {
        const start = new Date(c.applicationDate || c.audit?.createdAt || new Date());
        const lastEvent = c.timelineEvents[c.timelineEvents.length - 1]?.timestamp || new Date().toISOString();
        const end = new Date(lastEvent);
        return sum + Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / completedCandidates.length)
      : 0;

    return {
      totalCandidates: total,
      activeProcessing: active,
      completedDepartures: completed,
      criticalDelays: delays,
      revenueEst: revenue,
      avgProcessDays: avgDays || 22,
      projectedDepartures: Math.floor(active * 0.15) // Mock prediction: 15% of active pool
    };
  }

  /**
   * Bottleneck Analysis (Process Mining)
   */
  private static calculateBottlenecks(candidates: Candidate[]): BottleneckMetric[] {
    return WORKFLOW_STAGES.map((stage: WorkflowStage) => {
      const inStage = candidates.filter(c => c.stage === stage);
      const count = inStage.length;

      // Calculate Average Days in this stage for current candidates
      const totalDays = inStage.reduce((sum, c) => sum + WorkflowEngine.calculateSLAStatus(c).daysElapsed, 0);
      const avgDays = count > 0 ? Math.round(totalDays / count) : 0;
      const sla = SLA_CONFIG[stage];

      let status: 'Good' | 'Warning' | 'Critical' = 'Good';
      if (avgDays > sla) status = 'Critical';
      else if (avgDays > sla * 0.8) status = 'Warning';

      return {
        stage,
        count,
        avgDays,
        slaLimit: sla,
        status
      };
    });
  }

  /**
   * Staff Performance Analytics
   * analyzing timeline events to track actor activity
   */
  private static calculateStaffPerformance(candidates: Candidate[]): StaffPerformanceMetric[] {
    const staffMap: Record<string, { actions: number; lastActive: string; stages: Record<string, number> }> = {};

    (candidates || []).forEach(c => {
      (c.timelineEvents || []).forEach(evt => {
        const actor = evt.actor || 'System';
        if (actor === 'System') return;

        if (!staffMap[actor]) {
          staffMap[actor] = { actions: 0, lastActive: evt.timestamp, stages: {} };
        }

        staffMap[actor].actions++;
        if (new Date(evt.timestamp) > new Date(staffMap[actor].lastActive)) {
          staffMap[actor].lastActive = evt.timestamp;
        }

        // Track which stage they work in most
        const stage = evt.stage || 'General';
        staffMap[actor].stages[stage] = (staffMap[actor].stages[stage] || 0) + 1;
      });
    });

    const maxActions = Math.max(...Object.values(staffMap).map(d => d.actions), 1);

    return Object.entries(staffMap).map(([name, data]) => {
      // Find most active stage
      const sortedStages = Object.entries(data.stages).sort((a, b) => b[1] - a[1]);
      const efficiencyScore = Math.round((data.actions / maxActions) * 100);

      return {
        name,
        actionsPerformed: data.actions,
        lastActive: data.lastActive,
        mostActiveStage: sortedStages[0] ? sortedStages[0][0] : 'General',
        efficiencyScore
      };
    }).sort((a, b) => b.actionsPerformed - a.actionsPerformed);
  }

  private static calculateStageDistribution(candidates: Candidate[]) {
    const dist: Record<string, number> = {};
    WORKFLOW_STAGES.forEach((s: WorkflowStage) => dist[s] = 0); // Init 0
    candidates.forEach(c => {
      dist[c.stage] = (dist[c.stage] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }

  private static calculateFinancials(candidates: Candidate[]) {
    let collected = 0;
    let pending = 0;
    let projected = 0;
    let totalPipeline = 0;

    const REVENUE_PER_PLACEMENT = 2500; // Mock avg total revenue per candidate

    candidates.forEach(c => {
      // Collected
      const paid = c.stageData?.paymentHistory?.reduce((pSum: number, rec: any) => pSum + parseFloat(rec.amount || '0'), 0) || 0;
      collected += paid;

      // Pending (Invoiced but not paid)
      if (c.stageData?.paymentStatus === 'Pending' || c.stageData?.paymentStatus === 'Partial') {
        pending += 500;
      }

      // Projected (High probability - Visa Received or Ticket Issued)
      if (c.stage === WorkflowStage.VISA_RECEIVED || c.stage === WorkflowStage.TICKET_ISSUED) {
        projected += REVENUE_PER_PLACEMENT;
      }

      // Pipeline (Total potential)
      if (c.stage && c.stage !== WorkflowStage.DEPARTED) {
        totalPipeline += REVENUE_PER_PLACEMENT;
      }
    });

    return {
      totalCollected: collected,
      pendingCollection: pending,
      projectedRevenue: projected,
      pipelineValue: totalPipeline,
      revenueByStage: this.calculateRevenueByStage(candidates)
    };
  }

  private static calculateRevenueByStage(candidates: Candidate[]) {
    const revenueMap: Record<string, number> = {};
    WORKFLOW_STAGES.forEach(s => revenueMap[s] = 0);

    candidates.forEach(c => {
      const paid = c.stageData?.paymentHistory?.reduce((pSum: number, rec: any) => pSum + parseFloat(rec.amount || '0'), 0) || 0;
      revenueMap[c.stage] += paid;
    });

    return Object.entries(revenueMap).map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      value
    }));
  }

  /**
   * Generates a downloadable CSV string for a single candidate
   */
  static generateCandidateCSV(candidate: Candidate): string {
    const headers = [
      "Field,Value",
      `Name,${candidate.name}`,
      `Passport,${candidate.nic}`,
      `Role,${candidate.role}`,
      `Current Stage,${candidate.stage}`,
      `Status,${candidate.stageStatus}`,
      `Total Paid,${candidate.stageData?.paymentHistory?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0}`,
      `Address,${candidate.location}`
    ].join('\n');

    const eventsHeader = "\n\nTimeline History\nDate,Event,Actor,Description";
    const events = (candidate.timelineEvents || []).map(e =>
      `${new Date(e.timestamp || Date.now()).toLocaleDateString()},${e.title || 'Event'},${e.actor || 'System'},${(e.description || '').replace(/,/g, ' ')}`
    ).join('\n');

    return headers + eventsHeader + events;
  }

  /**
   * Generates a full system report CSV for all candidates
   */
  static async generateFullSystemCSV(): Promise<string> {
    const candidates = await CandidateService.getCandidates();
    const header = [
      "Candidate ID",
      "Name",
      "Role",
      "Location",
      "Stage",
      "Stage Status",
      "Days in Stage",
      "SLA Status",
      "Employer Status",
      "Medical Status",
      "Police Status",
      "Visa Status",
      "Payment Status",
      "Total Paid",
      "Last Active"
    ].join(",");

    const rows = (candidates || []).map(c => {
      const sla = WorkflowEngine.calculateSLAStatus(c);
      const totalPaid = c.stageData?.paymentHistory?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;
      const lastEvent = c.timelineEvents?.[0]?.timestamp || c.stageEnteredAt || new Date().toISOString();

      // Escape quotes in strings
      const safeName = `"${(c.name || 'Unknown').replace(/"/g, '""')}"`;
      const safeRole = `"${(c.role || 'N/A').replace(/"/g, '""')}"`;
      const safeLoc = `"${(c.location || 'N/A').replace(/"/g, '""')}"`;

      return [
        c.id || 'unknown',
        safeName,
        safeRole,
        safeLoc,
        c.stage || 'General',
        c.stageStatus || 'Pending',
        sla?.daysElapsed || 0,
        sla?.status === 'OVERDUE' ? "OVERDUE" : "On Track",
        c.stageData?.employerStatus || "-",
        c.stageData?.medicalStatus || "-",
        c.stageData?.policeStatus || "-",
        c.stageData?.visaStatus || "-",
        c.stageData?.paymentStatus || "-",
        totalPaid || 0,
        lastEvent ? new Date(lastEvent).toLocaleDateString() : '-'
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }
}