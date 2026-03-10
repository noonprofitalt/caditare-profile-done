/**
 * Workflow Engine — Compatibility Re-export
 * 
 * CONSOLIDATED: This file re-exports from workflowEngine.v2.ts (the canonical engine).
 * v1 was deprecated and merged into v2. All imports from './workflowEngine' now
 * resolve to v2 automatically.
 * 
 * Consumers that used:
 *   import WorkflowEngine, { WORKFLOW_STAGES } from '../services/workflowEngine'
 * will continue to work unchanged.
 */

export {
  default,
  WorkflowEngine,
  WORKFLOW_STAGES,
  SLA_CONFIG,
  type TransitionValidationResult,
  type WorkflowTransitionEvent,
  type SLAStatus,
} from './workflowEngine.v2';

// Backward-compatible aliases
export { WORKFLOW_STAGES as STAGE_ORDER } from './workflowEngine.v2';

// Re-export convenience helper used by WorkflowTracker
import { WorkflowEngine } from './workflowEngine.v2';
export const getNextStage = WorkflowEngine.getNextStage.bind(WorkflowEngine);
