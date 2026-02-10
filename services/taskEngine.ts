import { Candidate, WorkTask, SystemAlert, WorkflowStage, StageStatus, DocumentStatus } from '../types';
import { getSLAStatus } from './workflowEngine';

export class TaskEngine {
  
  /**
   * Scans all candidates and generates a prioritized To-Do list for the staff.
   */
  static generateWorkQueue(candidates: Candidate[]): WorkTask[] {
    const tasks: WorkTask[] = [];

    candidates.forEach(c => {
      const sla = getSLAStatus(c);

      // 1. CRITICAL: SLA Breaches
      if (sla.overdue) {
        tasks.push({
          id: `task-sla-${c.id}`,
          title: `SLA Breach: ${c.stage}`,
          description: `Candidate stuck in ${c.stage} for ${sla.daysInStage} days. Immediate action required.`,
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
      if (c.stage === WorkflowStage.VERIFICATION && c.stageStatus === StageStatus.PENDING) {
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
      if (c.stage === WorkflowStage.TICKET && c.stageData.paymentStatus !== 'Completed') {
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

      // 5. MEDIUM: Job Matching
      if (c.stage === WorkflowStage.JOB_MATCHING && c.stageData.employerStatus === 'Pending') {
         tasks.push({
          id: `task-match-${c.id}`,
          title: 'Submit to Employers',
          description: 'Profile ready for job matching.',
          priority: 'Medium',
          candidateId: c.id,
          candidateName: c.name,
          stage: c.stage,
          dueDate: 'This Week',
          actionLabel: 'Match Job',
          type: 'APPROVAL'
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
    const overdueCount = candidates.filter(c => getSLAStatus(c).overdue).length;
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
    const newReg = candidates.filter(c => c.stage === WorkflowStage.REGISTRATION && c.stageStatus === StageStatus.PENDING).length;
    if (newReg > 0) {
      alerts.push({
        id: 'alert-new',
        type: 'INFO',
        message: `${newReg} new registrations waiting for review.`,
        timestamp: new Date().toISOString(),
        count: newReg
      });
    }

    return alerts;
  }
}