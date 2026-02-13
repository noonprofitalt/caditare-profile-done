# 🔄 Enterprise Workflow Engine v2.0 - Complete Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Finite State Machine Design](#finite-state-machine-design)
3. [Workflow Stages](#workflow-stages)
4. [Transition Rules](#transition-rules)
5. [SLA Configuration](#sla-configuration)
6. [Implementation Guide](#implementation-guide)
7. [API Reference](#api-reference)
8. [Testing Strategy](#testing-strategy)

---

## 🎯 System Overview

### Purpose
Strict workflow control engine for Foreign Employment Agency ERP System using Finite State Machine (FSM) pattern.

### Key Features
✅ **Sequential Enforcement** - No stage skipping allowed  
✅ **Compliance Validation** - Passport, PCC, Medical checks  
✅ **SLA Tracking** - Per-stage deadline monitoring  
✅ **Rollback Support** - Backward movement with audit reason  
✅ **Audit Logging** - Complete transition history  
✅ **Zero Illegal Transitions** - FSM guarantees valid states  

### Design Principles
- **Compliance First** - Legal requirements enforced at code level
- **Zero Trust** - Every transition validated
- **Audit Grade** - Complete event logging
- **Enterprise Scale** - Handles thousands of candidates

---

## 🔀 Finite State Machine Design

### State Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FOREIGN EMPLOYMENT WORKFLOW FSM                       │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  REGISTERED  │ ← Entry Point
    └──────┬───────┘
           │ ✓ Passport + CV uploaded & approved
           ▼
    ┌──────────────┐
    │   VERIFIED   │
    └──────┬───────┘
           │ ✓ Profile ≥90% + Education + Job Role
           ▼
    ┌──────────────┐
    │   APPLIED    │
    └──────┬───────┘
           │ ✓ Offer letter uploaded & approved
           ▼
    ┌──────────────┐
    │OFFER RECEIVED│
    └──────┬───────┘
           │ ✓ Signed offer + Employer confirmed
           ▼
    ┌──────────────┐
    │ WP RECEIVED  │
    └──────┬───────┘
           │ ✓ Passport VALID + PCC VALID + Medical COMPLETED
           ▼
    ┌──────────────┐
    │EMBASSY APPLIED│
    └──────┬───────┘
           │ ✓ Embassy submission confirmed
           ▼
    ┌──────────────┐
    │VISA RECEIVED │
    └──────┬───────┘
           │ ✓ Visa + Agreement uploaded + Medical/PCC still valid
           ▼
    ┌──────────────┐
    │SLBFE REGISTER│
    └──────┬───────┘
           │ ✓ SLBFE# + Insurance + Training completed
           ▼
    ┌──────────────┐
    │TICKET ISSUED │
    └──────┬───────┘
           │ ✓ Ticket uploaded + Final compliance check
           ▼
    ┌──────────────┐
    │   DEPARTED   │ ← Final State
    └──────────────┘

Legend:
→ Forward transition (requires validation)
← Rollback allowed (requires reason)
✓ Entry conditions
```

---

## 📊 Workflow Stages

### Stage Definitions

| # | Stage | Description | SLA (days) | Critical? |
|---|-------|-------------|------------|-----------|
| 1 | **REGISTERED** | Initial candidate registration | 2 | ⚠️ |
| 2 | **VERIFIED** | Documents verified, profile complete | 7 | ⚠️ |
| 3 | **APPLIED** | Applied to employer/job | 14 | ⚠️ |
| 4 | **OFFER_RECEIVED** | Job offer received | 7 | ⚠️ |
| 5 | **WP_RECEIVED** | Work permit received | 14 | 🔴 |
| 6 | **EMBASSY_APPLIED** | Embassy visa application submitted | 21 | 🔴 |
| 7 | **VISA_RECEIVED** | Visa approved and received | 7 | 🔴 |
| 8 | **SLBFE_REGISTRATION** | SLBFE registered | 5 | 🔴 |
| 9 | **TICKET_ISSUED** | Flight ticket issued | 3 | 🔴 |
| 10 | **DEPARTED** | Candidate departed to destination | 0 | ✅ |

**Legend:**
- ⚠️ Warning - Important stage
- 🔴 Critical - Compliance-heavy stage
- ✅ Complete - Final state

---

## 🔐 Transition Rules

### Rule Matrix

| From Stage | To Stage | Type | Validation Required | Rollback Allowed |
|------------|----------|------|---------------------|------------------|
| REGISTERED | VERIFIED | Forward | Passport + CV approved | ✅ |
| VERIFIED | APPLIED | Forward | Profile ≥90% + Education + Job | ✅ |
| APPLIED | OFFER_RECEIVED | Forward | Offer letter approved | ✅ |
| OFFER_RECEIVED | WP_RECEIVED | Forward | Signed offer + Employer | ✅ |
| WP_RECEIVED | EMBASSY_APPLIED | Forward | **Passport + PCC + Medical** | ✅ |
| EMBASSY_APPLIED | VISA_RECEIVED | Forward | Embassy confirmation | ✅ |
| VISA_RECEIVED | SLBFE_REGISTRATION | Forward | Visa + Agreement + Compliance | ✅ |
| SLBFE_REGISTRATION | TICKET_ISSUED | Forward | SLBFE# + Insurance + Training | ✅ |
| TICKET_ISSUED | DEPARTED | Forward | Ticket + Final compliance | ✅ |

### Transition Validation Logic

#### 1. REGISTERED → VERIFIED

**Requirements:**
```typescript
✓ Passport document uploaded
✓ Passport document status = APPROVED
✓ CV/Resume document uploaded
✓ CV/Resume document status = APPROVED
```

**Blockers:**
- Missing passport document
- Missing CV document
- Documents not approved

---

#### 2. VERIFIED → APPLIED

**Requirements:**
```typescript
✓ Profile completion ≥ 90%
✓ Education qualifications entered (min 1)
✓ Job roles specified (min 1)
```

**Blockers:**
- Profile completion < 90%
- No education qualifications
- No job roles

---

#### 3. APPLIED → OFFER_RECEIVED

**Requirements:**
```typescript
✓ Offer letter document uploaded
✓ Offer letter status = APPROVED
```

**Blockers:**
- Missing offer letter
- Offer letter not approved

---

#### 4. OFFER_RECEIVED → WP_RECEIVED

**Requirements:**
```typescript
✓ Signed offer letter uploaded
✓ Signed offer status = APPROVED
✓ Employer ID confirmed
```

**Blockers:**
- Missing signed offer
- Signed offer not approved
- Employer not confirmed

---

#### 5. WP_RECEIVED → EMBASSY_APPLIED ⚠️ **CRITICAL**

**Requirements:**
```typescript
✓ Passport status = VALID (≥180 days validity)
✓ PCC status = VALID (≤180 days old)
✓ Medical status = COMPLETED
```

**Blockers:**
- Passport expired or expiring (<180 days)
- PCC expired (>180 days old)
- Medical not completed

**Compliance Issues:**
- This is the MOST CRITICAL transition
- All three compliance items must be VALID
- No exceptions allowed

---

#### 6. EMBASSY_APPLIED → VISA_RECEIVED

**Requirements:**
```typescript
✓ Embassy submission confirmed (optional document)
```

**Warnings:**
- Embassy submission document recommended

---

#### 7. VISA_RECEIVED → SLBFE_REGISTRATION

**Requirements:**
```typescript
✓ Visa document uploaded
✓ Visa status = APPROVED
✓ Employment agreement uploaded
✓ Agreement status = APPROVED
✓ Medical status = COMPLETED (re-check)
✓ PCC status = VALID (re-check)
```

**Blockers:**
- Missing visa document
- Missing employment agreement
- Documents not approved
- Medical or PCC expired

---

#### 8. SLBFE_REGISTRATION → TICKET_ISSUED

**Requirements:**
```typescript
✓ SLBFE registration number entered
✓ Insurance document uploaded
✓ Insurance status = APPROVED
✓ SLBFE training completed (training date entered)
```

**Blockers:**
- No SLBFE registration number
- Missing insurance document
- Insurance not approved
- Training not completed

---

#### 9. TICKET_ISSUED → DEPARTED

**Requirements:**
```typescript
✓ Flight ticket uploaded
✓ Ticket status = APPROVED
✓ Final compliance check:
  - Passport status = VALID
  - PCC status = VALID
  - Medical status = COMPLETED
```

**Blockers:**
- Missing flight ticket
- Ticket not approved
- Any compliance item invalid

---

## ⏱️ SLA Configuration

### SLA Definitions

```typescript
const SLA_CONFIG = {
    REGISTERED: 2 days,           // Quick verification needed
    VERIFIED: 7 days,             // Apply to jobs
    APPLIED: 14 days,             // Wait for offer
    OFFER_RECEIVED: 7 days,       // Process work permit
    WP_RECEIVED: 14 days,         // Apply to embassy
    EMBASSY_APPLIED: 21 days,     // Longest wait (visa processing)
    VISA_RECEIVED: 7 days,        // Register with SLBFE
    SLBFE_REGISTRATION: 5 days,   // Issue ticket
    TICKET_ISSUED: 3 days,        // Depart
    DEPARTED: 0 days              // Final state
};
```

### SLA Status Calculation

```typescript
interface SLAStatus {
    stage: WorkflowStage;
    enteredAt: Date;
    slaDeadline: Date;
    daysElapsed: number;
    daysRemaining: number;
    slaDays: number;
    status: 'ON_TIME' | 'WARNING' | 'OVERDUE';
    percentageElapsed: number;
}
```

**Status Logic:**
- **ON_TIME**: < 80% of SLA elapsed
- **WARNING**: ≥ 80% of SLA elapsed
- **OVERDUE**: Past SLA deadline

---

## 💻 Implementation Guide

### 1. Basic Usage

```typescript
import { WorkflowEngine, WorkflowStage } from '../services/workflowEngine.v2';

// Validate if transition is allowed
const validationResult = WorkflowEngine.validateTransition(
    candidate,
    WorkflowStage.VERIFIED
);

if (validationResult.allowed) {
    console.log('Transition allowed!');
} else {
    console.log('Blockers:', validationResult.blockers);
    console.log('Missing docs:', validationResult.missingDocuments);
    console.log('Compliance issues:', validationResult.complianceIssues);
}
```

### 2. Perform Transition

```typescript
// Forward transition
const result = WorkflowEngine.performTransition(
    candidate,
    WorkflowStage.VERIFIED,
    'user-123' // userId
);

if (result.success) {
    console.log('Transition successful!');
    console.log('Event:', result.event);
    
    // Update candidate
    candidate.stage = WorkflowStage.VERIFIED;
    candidate.stageHistory = [...candidate.stageHistory, {
        stage: WorkflowStage.VERIFIED,
        timestamp: result.event.timestamp,
        userId: result.event.userId
    }];
} else {
    console.error('Transition failed:', result.error);
}
```

### 3. Rollback

```typescript
// Rollback to previous stage
const rollbackResult = WorkflowEngine.performTransition(
    candidate,
    WorkflowStage.VERIFIED, // Going back from APPLIED
    'user-123',
    'Incorrect documents uploaded' // Reason required for rollback
);

if (rollbackResult.success) {
    console.log('Rollback successful');
    console.log('Reason:', rollbackResult.event.reason);
}
```

### 4. SLA Monitoring

```typescript
// Check SLA status
const slaStatus = WorkflowEngine.calculateSLAStatus(candidate);

console.log(`Stage: ${slaStatus.stage}`);
console.log(`Days elapsed: ${slaStatus.daysElapsed}`);
console.log(`Days remaining: ${slaStatus.daysRemaining}`);
console.log(`Status: ${slaStatus.status}`);
console.log(`Progress: ${slaStatus.percentageElapsed}%`);

// Get all overdue candidates
const overdueCandidates = WorkflowEngine.getOverdueCandidates(allCandidates);
console.log(`${overdueCandidates.length} candidates are overdue`);
```

### 5. Workflow Progress

```typescript
// Get workflow progress percentage
const progress = WorkflowEngine.getWorkflowProgress(candidate.stage);
console.log(`Workflow ${progress}% complete`);

// Get remaining stages
const remaining = WorkflowEngine.getRemainingStages(candidate.stage);
console.log(`Remaining stages: ${remaining.join(' → ')}`);
```

---

## 📡 API Reference

### Core Methods

#### `validateTransition(candidate, toStage)`
Validates if a transition is allowed.

**Parameters:**
- `candidate: Candidate` - Current candidate object
- `toStage: WorkflowStage` - Target stage

**Returns:** `TransitionValidationResult`
```typescript
{
    allowed: boolean;
    blockers: string[];
    warnings: string[];
    missingDocuments: string[];
    complianceIssues: string[];
}
```

---

#### `performTransition(candidate, toStage, userId, reason?)`
Performs a workflow transition.

**Parameters:**
- `candidate: Candidate` - Current candidate
- `toStage: WorkflowStage` - Target stage
- `userId: string` - User performing the transition
- `reason?: string` - Required for rollbacks

**Returns:**
```typescript
{
    success: boolean;
    event?: WorkflowTransitionEvent;
    error?: string;
}
```

---

#### `calculateSLAStatus(candidate)`
Calculates SLA status for current stage.

**Returns:** `SLAStatus`

---

#### `getOverdueCandidates(candidates)`
Gets all candidates with overdue SLA.

**Returns:** `Array<{ candidate, sla }>`

---

#### `getWorkflowProgress(stage)`
Gets workflow completion percentage.

**Returns:** `number` (0-100)

---

#### `getRemainingStages(currentStage)`
Gets list of remaining stages.

**Returns:** `WorkflowStage[]`

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('WorkflowEngine', () => {
    describe('validateTransition', () => {
        it('should block REGISTERED → VERIFIED without passport', () => {
            const candidate = createMockCandidate({
                stage: WorkflowStage.REGISTERED,
                documents: [] // No documents
            });
            
            const result = WorkflowEngine.validateTransition(
                candidate,
                WorkflowStage.VERIFIED
            );
            
            expect(result.allowed).toBe(false);
            expect(result.blockers).toContain('Passport document not uploaded');
        });
        
        it('should allow REGISTERED → VERIFIED with valid documents', () => {
            const candidate = createMockCandidate({
                stage: WorkflowStage.REGISTERED,
                documents: [
                    { type: 'Passport', status: DocumentStatus.APPROVED },
                    { type: 'CV', status: DocumentStatus.APPROVED }
                ]
            });
            
            const result = WorkflowEngine.validateTransition(
                candidate,
                WorkflowStage.VERIFIED
            );
            
            expect(result.allowed).toBe(true);
            expect(result.blockers).toHaveLength(0);
        });
    });
    
    describe('SLA tracking', () => {
        it('should mark as OVERDUE when past deadline', () => {
            const candidate = createMockCandidate({
                stage: WorkflowStage.REGISTERED,
                stageHistory: [{
                    stage: WorkflowStage.REGISTERED,
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
                }]
            });
            
            const sla = WorkflowEngine.calculateSLAStatus(candidate);
            
            expect(sla.status).toBe('OVERDUE');
            expect(sla.daysElapsed).toBe(5);
            expect(sla.daysRemaining).toBeLessThan(0);
        });
    });
});
```

---

## 🎯 Best Practices

### 1. Always Validate Before UI
```typescript
// In your UI component
const handleStageChange = async (newStage: WorkflowStage) => {
    // Validate first
    const validation = WorkflowEngine.validateTransition(candidate, newStage);
    
    if (!validation.allowed) {
        // Show error dialog with blockers
        showErrorDialog({
            title: 'Cannot Change Stage',
            blockers: validation.blockers,
            missingDocs: validation.missingDocuments
        });
        return;
    }
    
    // Proceed with transition
    const result = WorkflowEngine.performTransition(candidate, newStage, currentUserId);
    // ...
};
```

### 2. Log All Transitions
```typescript
// After successful transition
if (result.success) {
    // Save to database
    await saveWorkflowEvent(result.event);
    
    // Create timeline entry
    await createTimelineEvent({
        candidateId: candidate.id,
        type: 'WORKFLOW_TRANSITION',
        description: `Stage changed from ${result.event.fromStage} to ${result.event.toStage}`,
        metadata: result.event
    });
}
```

### 3. Monitor SLA Proactively
```typescript
// Daily cron job
const checkOverdueCandidates = async () => {
    const allCandidates = await getAllActiveCandidates();
    const overdue = WorkflowEngine.getOverdueCandidates(allCandidates);
    
    // Send notifications
    for (const { candidate, sla } of overdue) {
        await sendNotification({
            to: candidate.assignedTo,
            subject: `Candidate ${candidate.name} is overdue`,
            message: `Stage ${sla.stage} is ${Math.abs(sla.daysRemaining)} days overdue`
        });
    }
};
```

---

## 📈 Performance Considerations

### Optimization Tips

1. **Cache validation results** for read-heavy operations
2. **Batch SLA calculations** for dashboard views
3. **Index stage history** for fast SLA lookups
4. **Use database triggers** for automatic SLA updates

---

## 🔒 Security Considerations

1. **Role-based access** - Only authorized users can perform transitions
2. **Audit logging** - All transitions logged with user ID
3. **Rollback restrictions** - Require admin role for rollbacks
4. **Compliance enforcement** - Cannot be bypassed

---

**Version:** 2.0.0  
**Last Updated:** 2026-02-13  
**Status:** Production Ready  
**Author:** Enterprise ERP Architect
