import { MOCK_CANDIDATES } from './mockData';
import { Candidate, WorkflowStage, SystemSnapshot, BottleneckMetric, StaffPerformanceMetric, StageStatus } from '../types';
import { SLA_CONFIG, STAGE_ORDER, getSLAStatus } from './workflowEngine';

// ESTIMATED FEES for Financial Projections (Mock Data)
const ESTIMATED_FEES: Record<string, number> = {
  [WorkflowStage.REGISTRATION]: 50,
  [WorkflowStage.MEDICAL]: 150,
  [WorkflowStage.VISA]: 500,
  [WorkflowStage.TICKET]: 400,
};

export class ReportingService {
  
  /**
   * Generates a complete 360 system snapshot
   */
  static getSystemSnapshot(): SystemSnapshot {
    const candidates = MOCK_CANDIDATES;
    
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
    const completed = candidates.filter(c => c.stage === WorkflowStage.DEPARTURE).length;
    const active = total - completed;
    
    // Critical Delays
    const delays = candidates.filter(c => getSLAStatus(c).overdue).length;

    // Revenue Estimation (Sum of payment history + estimates)
    const revenue = candidates.reduce((sum, c) => {
       const paid = c.stageData.paymentHistory?.reduce((pSum, rec) => pSum + parseFloat(rec.amount || '0'), 0) || 0;
       return sum + paid;
    }, 0);

    return {
      totalCandidates: total,
      activeProcessing: active,
      completedDepartures: completed,
      criticalDelays: delays,
      revenueEst: revenue,
      avgProcessDays: 24, // Mock average
    };
  }

  /**
   * Bottleneck Analysis (Process Mining)
   */
  private static calculateBottlenecks(candidates: Candidate[]): BottleneckMetric[] {
    return STAGE_ORDER.map(stage => {
      const inStage = candidates.filter(c => c.stage === stage);
      const count = inStage.length;
      
      // Calculate Average Days in this stage for current candidates
      const totalDays = inStage.reduce((sum, c) => sum + getSLAStatus(c).daysInStage, 0);
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

    candidates.forEach(c => {
      c.timelineEvents.forEach(evt => {
        const actor = evt.actor;
        if (actor === 'System' || actor === 'Admin User' && false) return; // Optional filter

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

    return Object.entries(staffMap).map(([name, data]) => {
       // Find most active stage
       const sortedStages = Object.entries(data.stages).sort((a, b) => b[1] - a[1]);
       
       return {
         name,
         actionsPerformed: data.actions,
         lastActive: data.lastActive,
         mostActiveStage: sortedStages[0] ? sortedStages[0][0] : 'General'
       };
    }).sort((a, b) => b.actionsPerformed - a.actionsPerformed);
  }

  private static calculateStageDistribution(candidates: Candidate[]) {
    const dist: Record<string, number> = {};
    STAGE_ORDER.forEach(s => dist[s] = 0); // Init 0
    candidates.forEach(c => {
      dist[c.stage] = (dist[c.stage] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }

  private static calculateFinancials(candidates: Candidate[]) {
     let collected = 0;
     let pending = 0;

     candidates.forEach(c => {
        // Collected
        const paid = c.stageData.paymentHistory?.reduce((pSum, rec) => pSum + parseFloat(rec.amount || '0'), 0) || 0;
        collected += paid;

        // Pending (Logic: If stage passed but no payment recorded, assume pending fee)
        // This is a rough estimation logic for the dashboard
        if (c.stageData.paymentStatus === 'Pending' || c.stageData.paymentStatus === 'Partial') {
            pending += 500; // Mock average pending per candidate
        }
     });

     return {
       totalCollected: collected,
       pendingCollection: pending
     };
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
        `Total Paid,${candidate.stageData.paymentHistory?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0}`,
        `Address,${candidate.location}`
    ].join('\n');
    
    const eventsHeader = "\n\nTimeline History\nDate,Event,Actor,Description";
    const events = candidate.timelineEvents.map(e => 
        `${new Date(e.timestamp).toLocaleDateString()},${e.title},${e.actor},${e.description?.replace(/,/g, ' ')}`
    ).join('\n');

    return headers + eventsHeader + events;
  }

  /**
   * Generates a full system report CSV for all candidates
   */
  static generateFullSystemCSV(): string {
    const candidates = MOCK_CANDIDATES;
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

    const rows = candidates.map(c => {
      const sla = getSLAStatus(c);
      const totalPaid = c.stageData.paymentHistory?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
      const lastEvent = c.timelineEvents[0]?.timestamp || c.stageEnteredAt;

      // Escape quotes in strings
      const safeName = `"${c.name.replace(/"/g, '""')}"`;
      const safeRole = `"${c.role.replace(/"/g, '""')}"`;
      const safeLoc = `"${c.location.replace(/"/g, '""')}"`;

      return [
        c.id,
        safeName,
        safeRole,
        safeLoc,
        c.stage,
        c.stageStatus,
        sla.daysInStage,
        sla.overdue ? "OVERDUE" : "On Track",
        c.stageData.employerStatus || "-",
        c.stageData.medicalStatus || "-",
        c.stageData.policeStatus || "-",
        c.stageData.visaStatus || "-",
        c.stageData.paymentStatus || "-",
        totalPaid,
        new Date(lastEvent).toLocaleDateString()
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }
}