# 🏢 Enterprise ERP Candidate Management System - Implementation Plan

## 📋 Executive Summary

Transform the existing candidate management system into a **production-grade ERP system** for a Sri Lankan Foreign Employment Agency with:
- ✅ Dual data entry forms (Quick Add + Full Application) - **EXISTING**
- ✅ Compliance enforcement - **EXISTING (needs enhancement)**
- ✅ Workflow control - **EXISTING (needs enhancement)**
- 🔨 Data integrity - **NEEDS IMPLEMENTATION**
- 🔨 Real-world operational usability - **NEEDS ENHANCEMENT**

---

## 🎯 PHASE 1: DATABASE & DATA MODEL ENHANCEMENT

### 1.1 Enhanced Candidate Schema (types.ts)

**Status:** Partially complete - needs normalization

**Actions:**
1. ✅ Review existing `Candidate` interface in `types.ts`
2. 🔨 Add missing enterprise fields:
   - `candidateCode` (auto-generated unique identifier)
   - `profileType: 'QUICK' | 'FULL'`
   - `age` (calculated from DOB)
   - `bloodGroup`
   - `allergies`
   - Enhanced emergency contact structure
   - SLBFE compliance fields
   - Version control for optimistic locking

3. 🔨 Normalize nested structures:
   ```typescript
   personalInfo: {
     fullName, nic, dob, age, gender, maritalStatus, religion,
     address, district, divisionalSecretariat, gsDivision
   }
   
   contactInfo: {
     primaryPhone, whatsappPhone, additionalPhones[],
     email, emergencyContact: { name, phone, relation, address }
   }
   
   passportData: {
     passportNo, country, issuedDate, expiryDate, status, daysRemaining
   }
   
   pccData: {
     issuedDate, lastInspectionDate, status, ageInDays
   }
   
   medicalData: {
     status, scheduledDate, completedDate, notes, bloodGroup, allergies
   }
   
   professionalProfile: {
     jobRoles[], skills[], educationLevels[],
     educationHistory[], localExperience[], foreignExperience[]
   }
   
   slbfeData: {
     registrationNumber, trainingCompletedDate,
     insurancePolicyNumber, insuranceExpiryDate
   }
   
   workflow: {
     stage, stageEnteredAt, workflowHistory[]
   }
   
   audit: {
     createdAt, createdBy, updatedAt, updatedBy, deletedAt, version
   }
   ```

### 1.2 Backend Data Layer (Future: PostgreSQL + Prisma)

**Current:** LocalStorage-based mock data
**Future:** Production database

**Prisma Schema Design:**
```prisma
model Candidate {
  id                    String   @id @default(uuid())
  candidateCode         String   @unique
  profileType           ProfileType
  profileCompletion     Int      @default(0)
  
  // Personal Info (embedded JSON or separate table)
  personalInfo          Json
  contactInfo           Json
  passportData          Json?
  pccData               Json?
  medicalData           Json?
  professionalProfile   Json
  preferences           Json
  slbfeData             Json?
  
  // Workflow
  stage                 WorkflowStage
  stageEnteredAt        DateTime
  
  // Relations
  documents             Document[]
  timelineEvents        TimelineEvent[]
  workflowLogs          WorkflowLog[]
  comments              Comment[]
  
  // Audit
  createdAt             DateTime  @default(now())
  createdBy             String
  updatedAt             DateTime  @updatedAt
  updatedBy             String
  deletedAt             DateTime?
  version               Int       @default(1)
  
  @@index([candidateCode])
  @@index([stage])
  @@index([createdAt])
}

enum ProfileType {
  QUICK
  FULL
}

enum WorkflowStage {
  REGISTERED
  VERIFIED
  APPLIED
  OFFER_RECEIVED
  WP_RECEIVED
  EMBASSY_APPLIED
  VISA_RECEIVED
  SLBFE_REGISTRATION
  TICKET
  DEPARTED
}
```

---

## 🎯 PHASE 2: DUAL FORM SYSTEM REFINEMENT

### 2.1 Quick Add Form Enhancement

**File:** `components/QuickAddForm.tsx`

**Current Status:** ✅ Implemented

**Enhancements Needed:**
1. 🔨 Add dynamic phone number component with validation
2. 🔨 Implement real-time duplicate detection (NIC, Phone, WhatsApp)
3. 🔨 Add merge/warning dialog for duplicates
4. 🔨 Auto-generate `candidateCode` on save
5. 🔨 Set `profileType = 'QUICK'` and `profileCompletion = 15%`
6. 🔨 Create initial timeline event: "Quick Profile Created"

**Validation Rules:**
- Full Name: Required, min 3 chars
- NIC: Required, valid Sri Lankan NIC format
- Primary Phone: Required, valid format
- WhatsApp: Optional but recommended
- Desired Job Role: Required
- Preferred Countries: At least 1 required

### 2.2 Full Application Form Enhancement

**File:** `components/DigitalApplicationForm.tsx`

**Current Status:** ✅ Implemented (89KB file)

**Enhancements Needed:**
1. 🔨 **Auto-load Quick Add data** if upgrading from QUICK profile
2. 🔨 **Section-by-section validation** with visual indicators
3. 🔨 **Profile completion scoring** (real-time calculation)
4. 🔨 **Compliance enforcement** (passport/PCC validation)
5. 🔨 **Smart UI components:**
   - Multi-phone component (add/remove)
   - Multi-education selector (dropdown + cards)
   - Preferred countries selector (multi-select + cards)
   - Job roles + experience block (dynamic add)
   - Medical status logic (conditional date picker)

**Profile Upgrade Workflow:**
```
QUICK Profile → Click "Complete Profile" → 
Load Full Application Form → 
Pre-fill Quick Add data → 
Complete remaining sections → 
Save → Update profileType to 'FULL' → 
Recalculate profileCompletion
```

---

## 🎯 PHASE 3: PROFILE COMPLETION ENGINE

### 3.1 Enhanced Profile Completion Service

**File:** `services/profileCompletionService.ts`

**Current Status:** ✅ Exists (6KB)

**Enhancement:**
Implement weighted scoring system:

| Section | Weight | Fields |
|---------|--------|--------|
| Personal Info | 15% | fullName, NIC, DOB, gender, maritalStatus, address, district |
| Contact Info | 10% | primaryPhone, whatsappPhone, email, emergencyContact |
| Passport | 15% | passportNo, issuedDate, expiryDate, status |
| PCC | 10% | issuedDate, status |
| Medical | 10% | status, completedDate |
| Professional | 15% | jobRoles (min 1), skills, education |
| Documents | 15% | Mandatory docs uploaded |
| SLBFE | 10% | registrationNumber, trainingDate, insurance |

**Implementation:**
```typescript
export class ProfileCompletionService {
  static calculateCompletion(candidate: Candidate): number {
    const weights = {
      personalInfo: 15,
      contactInfo: 10,
      passport: 15,
      pcc: 10,
      medical: 10,
      professional: 15,
      documents: 15,
      slbfe: 10
    };
    
    let totalScore = 0;
    
    // Personal Info (15%)
    const personalScore = this.calculatePersonalInfoScore(candidate);
    totalScore += (personalScore / 100) * weights.personalInfo;
    
    // ... repeat for each section
    
    return Math.round(totalScore);
  }
  
  static getCompletionBreakdown(candidate: Candidate): SectionScore[] {
    // Return section-by-section scores for UI display
  }
  
  static getMissingFields(candidate: Candidate): MissingField[] {
    // Return list of missing required fields
  }
}
```

### 3.2 Visual Progress Indicators

**Component:** `components/ProfileCompletionWidget.tsx` (NEW)

**Features:**
- Circular progress bar (overall %)
- Section breakdown (accordion)
- Missing fields list
- "Complete Now" action buttons

---

## 🎯 PHASE 4: COMPLIANCE ENFORCEMENT ENGINE

### 4.1 Enhanced Compliance Service

**File:** `services/complianceService.ts`

**Current Status:** ✅ Exists (11KB)

**Enhancements:**

```typescript
export class ComplianceService {
  // Passport Rules
  static validatePassport(expiryDate: string): PassportValidation {
    const daysRemaining = this.calculateDaysRemaining(expiryDate);
    
    if (daysRemaining < 0) {
      return {
        status: 'EXPIRED',
        severity: 'CRITICAL',
        message: 'Passport expired',
        blocksStages: ['EMBASSY_APPLIED', 'VISA_RECEIVED', 'SLBFE_REGISTRATION', 'DEPARTURE']
      };
    }
    
    if (daysRemaining < 180) {
      return {
        status: 'EXPIRING',
        severity: 'WARNING',
        message: `Passport expires in ${daysRemaining} days`,
        blocksStages: ['VISA_RECEIVED', 'SLBFE_REGISTRATION', 'DEPARTURE']
      };
    }
    
    return { status: 'VALID', severity: 'OK', message: 'Passport valid' };
  }
  
  // PCC Rules
  static validatePCC(issuedDate: string): PCCValidation {
    const ageDays = this.calculateAgeDays(issuedDate);
    
    if (ageDays > 180) {
      return {
        status: 'EXPIRED',
        severity: 'CRITICAL',
        message: 'PCC expired (>180 days)',
        blocksStages: ['EMBASSY_APPLIED', 'VISA_RECEIVED', 'SLBFE_REGISTRATION']
      };
    }
    
    if (ageDays > 150) {
      return {
        status: 'EXPIRING',
        severity: 'WARNING',
        message: `PCC expiring soon (${ageDays} days old)`,
        blocksStages: []
      };
    }
    
    return { status: 'VALID', severity: 'OK', message: 'PCC valid' };
  }
  
  // Medical Rules
  static validateMedical(medicalData: MedicalData): MedicalValidation {
    if (medicalData.status !== 'COMPLETED') {
      return {
        status: 'INCOMPLETE',
        severity: 'CRITICAL',
        message: 'Medical not completed',
        blocksStages: ['EMBASSY_APPLIED', 'VISA_RECEIVED', 'SLBFE_REGISTRATION']
      };
    }
    
    return { status: 'VALID', severity: 'OK', message: 'Medical completed' };
  }
  
  // Workflow Blocker
  static canTransitionToStage(
    candidate: Candidate,
    targetStage: WorkflowStage
  ): { allowed: boolean; reasons: string[] } {
    const blockers: string[] = [];
    
    const passportValidation = this.validatePassport(candidate.passportData?.expiryDate);
    if (passportValidation.blocksStages?.includes(targetStage)) {
      blockers.push(passportValidation.message);
    }
    
    const pccValidation = this.validatePCC(candidate.pccData?.issuedDate);
    if (pccValidation.blocksStages?.includes(targetStage)) {
      blockers.push(pccValidation.message);
    }
    
    const medicalValidation = this.validateMedical(candidate.medicalData);
    if (medicalValidation.blocksStages?.includes(targetStage)) {
      blockers.push(medicalValidation.message);
    }
    
    // Profile completion check
    if (candidate.profileCompletion < 80 && targetStage !== 'REGISTERED') {
      blockers.push('Profile completion must be at least 80%');
    }
    
    return {
      allowed: blockers.length === 0,
      reasons: blockers
    };
  }
}
```

### 4.2 Compliance Dashboard Widget

**Component:** `components/ComplianceWidget.tsx`

**Current Status:** ✅ Exists

**Enhancements:**
- Real-time validation status
- Visual severity indicators (red/yellow/green)
- Blocked stages list
- Quick action buttons (e.g., "Update Passport")

---

## 🎯 PHASE 5: WORKFLOW INTEGRATION

### 5.1 Enhanced Workflow Engine

**File:** `services/workflowEngine.ts`

**Current Status:** ✅ Exists (7KB)

**Enhancements:**

```typescript
export class WorkflowEngine {
  static transitionStage(
    candidate: Candidate,
    targetStage: WorkflowStage,
    user: string
  ): { success: boolean; candidate?: Candidate; errors?: string[] } {
    // 1. Validate compliance
    const complianceCheck = ComplianceService.canTransitionToStage(candidate, targetStage);
    if (!complianceCheck.allowed) {
      return { success: false, errors: complianceCheck.reasons };
    }
    
    // 2. Validate required documents
    const docCheck = this.validateRequiredDocuments(candidate, targetStage);
    if (!docCheck.valid) {
      return { success: false, errors: docCheck.missingDocs };
    }
    
    // 3. Validate profile completion
    if (candidate.profileCompletion < 80) {
      return { success: false, errors: ['Profile must be at least 80% complete'] };
    }
    
    // 4. Perform transition
    const updatedCandidate = {
      ...candidate,
      stage: targetStage,
      stageEnteredAt: new Date().toISOString(),
      workflowLogs: [
        ...candidate.workflowLogs,
        {
          id: generateId(),
          fromStage: candidate.stage,
          toStage: targetStage,
          timestamp: new Date().toISOString(),
          user
        }
      ],
      timelineEvents: [
        {
          id: generateId(),
          type: 'STAGE_TRANSITION',
          title: `Stage changed to ${targetStage}`,
          timestamp: new Date().toISOString(),
          actor: user,
          stage: targetStage
        },
        ...candidate.timelineEvents
      ],
      audit: {
        ...candidate.audit,
        updatedAt: new Date().toISOString(),
        updatedBy: user,
        version: candidate.audit.version + 1
      }
    };
    
    // 5. Generate system event
    NotificationService.createNotification({
      type: 'SUCCESS',
      title: 'Stage Transition',
      message: `${candidate.name} moved to ${targetStage}`,
      candidateId: candidate.id
    });
    
    return { success: true, candidate: updatedCandidate };
  }
}
```

---

## 🎯 PHASE 6: SMART UI COMPONENTS

### 6.1 Multi-Phone Component

**Component:** `components/ui/MultiPhoneInput.tsx` (NEW)

**Features:**
- Primary phone (required)
- Add additional numbers (+ button)
- Remove numbers (× button)
- Validation (Sri Lankan format)
- Auto duplicate detection

### 6.2 Multi-Education Selector

**Component:** `components/ui/MultiEducationSelector.tsx` (NEW)

**Features:**
- Dropdown with education levels
- Multi-select
- Selected values as removable cards
- Predefined options: O/L, A/L, Diploma, Degree, NVQ, etc.

### 6.3 Preferred Countries Selector

**Component:** `components/ui/PreferredCountriesSelector.tsx` (NEW)

**Features:**
- Multi-select dropdown
- Selected countries as cards
- Auto-apply document templates based on selection

### 6.4 Job Roles + Experience Block

**Component:** `components/JobRoleEntry.tsx`

**Current Status:** ✅ Exists (9KB)

**Enhancements:**
- Dynamic add/remove
- Validation (min 1 role)
- Skill level selector
- Experience years input

### 6.5 Medical Status Logic

**Component:** `components/MedicalStatusInput.tsx` (NEW)

**Logic:**
```typescript
if (status === 'SCHEDULED') {
  // Show date picker
  // Store scheduledDate
  // Display in profile header
  // Alert when overdue
}

if (status === 'COMPLETED') {
  // Show completedDate
  // Show blood group input
  // Show allergies input
}
```

---

## 🎯 PHASE 7: DATA INTEGRITY & AUDIT

### 7.1 Unique Constraints

**Implementation:** `services/candidateService.ts`

**Rules:**
- NIC → UNIQUE (check before save)
- Passport → UNIQUE (check before save)
- Primary Phone → UNIQUE (check before save)
- Candidate Code → UNIQUE (auto-generated)

### 7.2 Soft Delete

**Implementation:**
```typescript
export class CandidateService {
  static deleteCandidate(id: string, user: string): void {
    const candidate = this.getCandidateById(id);
    if (!candidate) return;
    
    const updatedCandidate = {
      ...candidate,
      audit: {
        ...candidate.audit,
        deletedAt: new Date().toISOString(),
        updatedBy: user
      }
    };
    
    // Don't remove from storage, just mark as deleted
    this.updateCandidate(updatedCandidate);
  }
  
  static getAllCandidates(): Candidate[] {
    const all = this.loadFromStorage();
    // Filter out soft-deleted
    return all.filter(c => !c.audit.deletedAt);
  }
}
```

### 7.3 Optimistic Locking

**Implementation:**
```typescript
export class CandidateService {
  static updateCandidate(candidate: Candidate): { success: boolean; error?: string } {
    const existing = this.getCandidateById(candidate.id);
    
    if (existing.audit.version !== candidate.audit.version) {
      return {
        success: false,
        error: 'Candidate was modified by another user. Please refresh and try again.'
      };
    }
    
    const updated = {
      ...candidate,
      audit: {
        ...candidate.audit,
        version: candidate.audit.version + 1,
        updatedAt: new Date().toISOString()
      }
    };
    
    this.saveToStorage(updated);
    return { success: true };
  }
}
```

---

## 🎯 PHASE 8: ADMIN CONTROL FEATURES

### 8.1 Compliance Risk Dashboard

**Component:** `components/admin/ComplianceRiskDashboard.tsx` (NEW)

**Features:**
- Expired passports count
- Expiring passports (< 180 days)
- Expired PCCs
- Incomplete medicals
- Blocked candidates (can't progress)

### 8.2 Expiry Alerts Panel

**Component:** `components/admin/ExpiryAlertsPanel.tsx` (NEW)

**Features:**
- Real-time alerts
- Grouped by severity (Critical/Warning)
- Quick actions (e.g., "Notify Candidate")

### 8.3 Workflow Bottleneck View

**Component:** `components/admin/WorkflowBottleneckView.tsx` (NEW)

**Features:**
- Stage distribution chart
- Average days in each stage
- SLA violations
- Candidates stuck > X days

### 8.4 System-Generated Reports

**Component:** `components/CandidateReport.tsx`

**Current Status:** ✅ Exists (23KB)

**Enhancements:**
- Add compliance status report
- Add profile completion report
- Add workflow bottleneck report
- Export to Excel/PDF

---

## 🎯 PHASE 9: API ENDPOINTS (Future Backend)

### 9.1 Candidate CRUD

```
POST   /api/candidates              - Create candidate
GET    /api/candidates              - List candidates (with filters)
GET    /api/candidates/:id          - Get candidate by ID
PUT    /api/candidates/:id          - Update candidate
DELETE /api/candidates/:id          - Soft delete candidate
POST   /api/candidates/:id/restore  - Restore deleted candidate
```

### 9.2 Workflow

```
POST   /api/candidates/:id/transition  - Transition to new stage
GET    /api/candidates/:id/workflow    - Get workflow history
POST   /api/candidates/:id/override    - Manual override (admin only)
```

### 9.3 Compliance

```
GET    /api/compliance/risks           - Get compliance risk dashboard
GET    /api/compliance/expiring        - Get expiring documents
POST   /api/compliance/validate        - Validate candidate compliance
```

### 9.4 Reports

```
GET    /api/reports/candidates         - Candidate status report
GET    /api/reports/compliance         - Compliance report
GET    /api/reports/workflow           - Workflow bottleneck report
POST   /api/reports/export             - Export report (Excel/PDF)
```

---

## 🎯 PHASE 10: TESTING & VALIDATION

### 10.1 Unit Tests

**Files to test:**
- `services/complianceService.ts`
- `services/profileCompletionService.ts`
- `services/workflowEngine.ts`
- `services/candidateService.ts`

### 10.2 Integration Tests

**Scenarios:**
- Quick Add → Full Application upgrade
- Workflow transition with compliance blocking
- Duplicate detection
- Profile completion calculation

### 10.3 E2E Tests

**User Flows:**
1. Quick Add candidate → View profile → Complete profile → Submit
2. Admin → View compliance dashboard → Fix expired passport → Transition stage
3. Bulk upload candidates → Detect duplicates → Merge

---

## 📊 IMPLEMENTATION PRIORITY

### 🔥 CRITICAL (Week 1-2)
1. ✅ Enhanced Candidate Schema (types.ts)
2. ✅ Profile Completion Engine
3. ✅ Compliance Enforcement Engine
4. ✅ Workflow Blocking Logic
5. ✅ Data Integrity (unique constraints, soft delete)

### 🚀 HIGH (Week 3-4)
6. ✅ Smart UI Components (multi-phone, multi-education, etc.)
7. ✅ Full Application Form enhancements
8. ✅ Quick Add Form enhancements
9. ✅ Admin Compliance Dashboard
10. ✅ Expiry Alerts Panel

### 📈 MEDIUM (Week 5-6)
11. ✅ Workflow Bottleneck View
12. ✅ Enhanced Reporting
13. ✅ Optimistic Locking
14. ✅ Audit Trail UI

### 🔮 FUTURE (Post-MVP)
15. PostgreSQL + Prisma migration
16. REST API implementation
17. Real-time notifications (WebSocket)
18. Mobile app (React Native)

---

## ✅ SUCCESS CRITERIA

### Enterprise-Grade
- ✅ Normalized data model
- ✅ Audit trail for all changes
- ✅ Version control (optimistic locking)
- ✅ Soft delete only

### Legally Compliant
- ✅ SLBFE compliance fields
- ✅ Passport/PCC/Medical validation
- ✅ Document management
- ✅ Workflow blocking rules

### Workflow-Safe
- ✅ Stage transition validation
- ✅ Compliance enforcement
- ✅ Profile completion checks
- ✅ Audit logging

### Scalable
- ✅ Modular service architecture
- ✅ Reusable UI components
- ✅ Efficient data structures
- ✅ Future-ready for database migration

### Production-Ready
- ✅ No demo logic
- ✅ No mock logic
- ✅ Real validation rules
- ✅ Error handling
- ✅ User feedback

---

## 🚀 NEXT STEPS

1. **Review this plan** with stakeholders
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (Database & Data Model)
4. **Iterate rapidly** with user feedback
5. **Test thoroughly** before production deployment

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Author:** Enterprise Software Architect  
**Status:** Ready for Implementation
