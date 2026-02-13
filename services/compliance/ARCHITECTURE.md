# Compliance Engine Service Architecture

## 1. Overview
The Compliance Engine is a centralized service designed to enforce legal and operational compliance for the Foreign Employment ERP system. It evaluates candidates against a set of dynamic rules including Passport validity, Police Clearance (PCC), Medical status, Age limits, and Country-specific document requirements.

## 2. Core Components

### 2.1 Compliance Types (`ComplianceTypes.ts`)
Defines the domain model for compliance:
- **Domains**: Passport, PCC, Medical, Age, Documents.
- **Severity**: INFO, WARNING, CRITICAL.
- **ComplianceResult**: Detailed report containing scores and issues.
- **CountryRule**: Configuration structure for country-specific constraints.

### 2.2 Country Rules Registry (`CountryRules.ts`)
A configuration layer that stores rules for each destination country (Saudi Arabia, UAE, Qatar, etc.).
- **Age Limits**: Role-specific (e.g., Housemaid max 55).
- **Document Requirements**: Mandatory lists per country.
- **Validity Thresholds**: Passport (6 months), PCC (6 months).

### 2.3 Compliance Engine (`ComplianceEngine.ts`)
The core processing unit.
- **Input**: `Candidate` object.
- **Process**:
  1.  **Context Loading**: Fetches specific `CountryRule` based on candidate's target country.
  2.  **Domain Evaluation**: Runs sub-evaluators for Passport, PCC, Medical, Age, Documents.
  3.  **Scoring**: Calculates a 0–100% compliance score based on weighted factors.
  4.  **Issue Aggregation**: Collects all warnings and critical blockers.
  5.  **Blocker Resolution**: Determines if the candidate is "Processable" or blocked from specific stages.
- **Output**: `FullComplianceReport`.

### 2.4 Integration Points

#### A. Workflow Engine Validation
The `WorkflowEngine` consumes the `ComplianceEngine` during stage transitions.
- **Pre-Transition Check**: Before moving a candidate to a new stage (e.g., *Embassy Applied*), the Workflow Engine requests a compliance report.
- **Gatekeeping**: If the report contains `CRITICAL` issues blocking the target stage, the transition is rejected.

#### B. User Interface & Dashboards
- **Compliance Score**: Displayed on the Candidate Profile (0-100% Ring).
- **Alerts**: The engine generates `AppNotification` objects for expiring documents or overdue medicals.
- **Blockers**: Visual indicators on the workflow progress bar showing why a stage is locked.

## 3. Data Flow
1.  **Trigger**: User attempts to move Candidate to "Visa Received".
2.  **Request**: `WorkflowEngine` calls `ComplianceEngine.evaluateCandidate(candidate)`.
3.  **Execution**: `ComplianceEngine` checks:
    -   Passport Expiry > Today?
    -   Medical Status == Completed?
    -   Mandatory Documents (Visa Copy) uploaded?
4.  **Response**: Returns `FullComplianceReport`.
5.  **Decision**:
    -   If `CRITICAL` issue "Passport Expired" exists → `WorkflowEngine` blocks transition.
    -   If Score < 100% but issues are `WARNING` only → `WorkflowEngine` allows with warning.

## 4. API Interfaces

### `evaluateCandidate(candidate: Candidate): FullComplianceReport`
Primary interface for synchronous evaluation.

### `generateAlerts(report: FullComplianceReport): AppNotification[]`
Helper to convert compliance issues into system notifications.

## 5. Extensibility
New countries can be added solely by updating `CountryRules.ts`. New compliance domains (e.g., "Vaccination") can be added by creating a new sub-evaluator in `ComplianceEngine` and adding it to the execution chain.
