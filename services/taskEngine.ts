import { Candidate, WorkTask, SystemAlert, WorkflowStage, StageStatus, DocumentStatus, PassportStatus, PCCStatus } from '../types';
import { WorkflowEngine } from './workflowEngine';

export class TaskEngine {

  /**
   * Scans all candidates and generates a prioritized To-Do list for the staff.
   */
  static generateWorkQueue(candidates: Candidate[]): WorkTask[] {
    const tasks: WorkTask[] = [];

    candidates.forEach(c => {
      const sla = WorkflowEngine.calculateSLAStatus(c);
      // 0. CRITICAL: Compliance Flags (New)
      const criticalFlags = c.complianceFlags?.filter(f => !f.isResolved && f.severity === 'CRITICAL') || [];
      if (criticalFlags.length > 0) {
        tasks.push({
          id: `task-flag-crit-${c.id}`,
          title: 'Critical Compliance Issue',
          description: `Blocking Issue: ${criticalFlags[0].reason}`,
          priority: 'Critical',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'Immediate',
          actionLabel: 'Resolve Flag',
          type: 'ISSUE'
        });
      }

      // 0.5. MEDIUM: Compliance Warnings (New)
      const warningFlags = c.complianceFlags?.filter(f => !f.isResolved && f.severity === 'WARNING') || [];
      if (warningFlags.length > 0) {
        tasks.push({
          id: `task-flag-warn-${c.id}`,
          title: 'Compliance Warning',
          description: `Warning: ${warningFlags[0].reason}`,
          priority: 'Medium',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'This Week',
          actionLabel: 'Review',
          type: 'ISSUE'
        });
      }

      // 1. CRITICAL: SLA Breaches
      if (sla.status === 'OVERDUE') {
        tasks.push({
          id: `task-sla-${c.id}`,
          title: `SLA Breach: ${c.stage}`,
          description: `Candidate stuck in ${c.stage} for ${sla.daysElapsed} days. Immediate action required.`,
          priority: 'Critical',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'Today',
          actionLabel: 'Expedite',
          type: 'ISSUE'
        });
      }

      // 2. HIGH: Pending Verifications
      if (c.stage === WorkflowStage.VERIFIED && c.stageStatus === StageStatus.PENDING) {
        tasks.push({
          id: `task-verify-${c.id}`,
          title: 'Verify Documents',
          description: 'New documents uploaded. Review and approve to proceed.',
          priority: 'High',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'Today',
          actionLabel: 'Review Docs',
          type: 'VERIFICATION'
        });
      }

      // 3. HIGH: Payment Due (Mock logic for Ticket stage)
      if (c.stage === WorkflowStage.TICKET_ISSUED && c.stageData.paymentStatus !== 'Completed') {
        tasks.push({
          id: `task-pay-${c.id}`,
          title: 'Collect Final Payment',
          description: 'Ticket issuance blocked. Collect outstanding balance.',
          priority: 'High',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'ASAP',
          actionLabel: 'Record Payment',
          type: 'PAYMENT'
        });
      }

      // 4. MEDIUM: Document Corrections
      const rejectedDocs = c.documents.filter(d => d.status === DocumentStatus.CORRECTION_REQUIRED);
      if (rejectedDocs.length > 0) {
        tasks.push({
          id: `task-fix-${c.id}`,
          title: 'Follow-up on Corrections',
          description: `${rejectedDocs.length} document(s) need correction from candidate.`,
          priority: 'Medium',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'Tomorrow',
          actionLabel: 'Contact Candidate',
          type: 'FOLLOW_UP'
        });
      }

      // 5. MEDIUM: Application Follow-up
      if (c.stage === WorkflowStage.APPLIED && c.stageData.employerStatus === 'Pending') {
        tasks.push({
          id: `task-match-${c.id}`,
          title: 'Follow-up on Application',
          description: 'Candidate applied but no employer response yet.',
          priority: 'Medium',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'This Week',
          actionLabel: 'Contact Employer',
          type: 'FOLLOW_UP'
        });
      }
    });

    // Sort by priority (Critical > High > Medium > Low)
    const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  /**
   * Generates real-time system alerts
   */
  static generateAlerts(candidates: Candidate[]): SystemAlert[] {
    const alerts: SystemAlert[] = [];

    // SLA Alert
    const overdueCount = candidates.filter(c => WorkflowEngine.calculateSLAStatus(c).status === 'OVERDUE').length;
    if (overdueCount > 0) {
      alerts.push({
        id: 'alert-sla',
        type: 'DELAY',
        message: `${overdueCount} candidates have breached SLA limits.`,
        timestamp: new Date().toISOString(),
        count: overdueCount
      });
    }

    // Pending Reg
    const newReg = candidates.filter(c => c.stage === WorkflowStage.REGISTERED && c.stageStatus === StageStatus.PENDING).length;
    if (newReg > 0) {
      alerts.push({
        id: 'alert-new',
        type: 'INFO',
        message: `${newReg} new registrations waiting for review.`,
        timestamp: new Date().toISOString(),
        count: newReg
      });
    }

    // Compliance Alerts
    const expiringPassports = candidates.filter(c => c.passportData?.status === PassportStatus.EXPIRING).length;
    const expiredPassports = candidates.filter(c => c.passportData?.status === PassportStatus.EXPIRED).length;
    const expiredPCCs = candidates.filter(c => c.pccData?.status === PCCStatus.EXPIRED).length;

    if (expiredPassports > 0) {
      alerts.push({
        id: 'alert-ppt-exp',
        type: 'DELAY',
        message: `${expiredPassports} candidates have EXPIRED Passports.`,
        timestamp: new Date().toISOString(),
        count: expiredPassports
      });
    }

    if (expiringPassports > 0) {
      alerts.push({
        id: 'alert-ppt-soon',
        type: 'WARNING',
        message: `${expiringPassports} passports are expiring within 6 months.`,
        timestamp: new Date().toISOString(),
        count: expiringPassports
      });
    }

    if (expiredPCCs > 0) {
      alerts.push({
        id: 'alert-pcc-exp',
        type: 'WARNING',
        message: `${expiredPCCs} PCCs have expired (> 180 days).`,
        timestamp: new Date().toISOString(),
        count: expiredPCCs
      });
    }

    return alerts;
  }
}