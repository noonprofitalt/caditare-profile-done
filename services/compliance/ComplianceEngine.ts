import { Candidate, DocumentStatus, DocumentType, MedicalStatus, PassportStatus, PCCStatus, WorkflowStage, AppNotification } from '../../types';
import { ComplianceDomain, ComplianceIssue, ComplianceRuleResult, ComplianceScoreCard, ComplianceSeverity, FullComplianceReport } from './ComplianceTypes';
import { COMPLIANCE_CONSTANTS, getCountryRule } from './CountryRules';

export class ComplianceEngine {

    /**
     * Main entry point to evaluate a candidate's compliance.
     */
    static evaluateCandidate(candidate: Candidate): FullComplianceReport {
        const results: ComplianceRuleResult[] = [];
        const countryRule = getCountryRule(candidate.targetCountry || candidate.country);

        // 1. Evaluate Passport
        const passportResult = this.evaluatePassport(candidate);
        results.push(passportResult);

        // 2. Evaluate PCC
        const pccResult = this.evaluatePCC(candidate, countryRule.checksPCC);
        results.push(pccResult);

        // 3. Evaluate Medical
        const medicalResult = this.evaluateMedical(candidate, countryRule.medicalRequired);
        results.push(medicalResult);

        // 4. Evaluate Age
        const ageResult = this.evaluateAge(candidate, countryRule);
        results.push(ageResult);

        // 5. Evaluate Documents
        const docResult = this.evaluateDocuments(candidate, countryRule.mandatoryDocuments);
        results.push(...docResult);

        // 6. Evaluate Compliance Flags (New Phase 13)
        const flagResults = this.evaluateFlags(candidate);
        results.push(...flagResults);

        // Calculate Score
        const scoreCard = this.calculateScore(results);
        const isProcessable = !results.some(r => r.issue?.severity === ComplianceSeverity.CRITICAL);

        return {
            candidateId: candidate.id,
            timestamp: new Date(),
            scoreCard,
            results,
            isProcessable
        };
    }

    // --- DOMAIN EVALUATORS ---

    private static evaluatePassport(candidate: Candidate): ComplianceRuleResult {
        const data = candidate.passportData || (candidate.passports && candidate.passports.length > 0 ? candidate.passports[0] : null);
        if (!data) {
            return {
                ruleId: 'PASSPORT_MISSING',
                domain: ComplianceDomain.PASSPORT,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'PASSPORT_MISSING',
                    domain: ComplianceDomain.PASSPORT,
                    severity: ComplianceSeverity.CRITICAL,
                    message: 'Passport data is missing.',
                    remedy: 'Upload and enter passport details.',
                    blockingStages: [WorkflowStage.EMBASSY_APPLIED, WorkflowStage.VISA_RECEIVED, WorkflowStage.DEPARTED]
                }
            };
        }

        if (data.status === PassportStatus.EXPIRED) {
            return {
                ruleId: 'PASSPORT_EXPIRED',
                domain: ComplianceDomain.PASSPORT,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'PASSPORT_EXPIRED',
                    domain: ComplianceDomain.PASSPORT,
                    severity: ComplianceSeverity.CRITICAL,
                    message: `Passport expired on ${data.expiryDate}.`,
                    remedy: 'Renew passport immediately.',
                    blockingStages: [WorkflowStage.EMBASSY_APPLIED, WorkflowStage.VISA_RECEIVED, WorkflowStage.DEPARTED, WorkflowStage.SLBFE_REGISTRATION]
                }
            };
        }

        if (data.status === PassportStatus.EXPIRING) {
            return {
                ruleId: 'PASSPORT_EXPIRING',
                domain: ComplianceDomain.PASSPORT,
                passed: true, // It's technically valid but with warning
                scoreImpact: 50, // Half points
                issue: {
                    id: 'PASSPORT_EXPIRING',
                    domain: ComplianceDomain.PASSPORT,
                    severity: ComplianceSeverity.WARNING,
                    message: `Passport expires in ${data.validityDays} days(less than ${COMPLIANCE_CONSTANTS.PASSPORT_WARNING_DAYS} days).`,
                    remedy: 'Advise candidate to renew soon.',
                    blockingStages: []
                }
            };
        }

        return {
            ruleId: 'PASSPORT_VALID',
            domain: ComplianceDomain.PASSPORT,
            passed: true,
            scoreImpact: 100
        };
    }

    private static evaluatePCC(candidate: Candidate, required: boolean): ComplianceRuleResult {
        if (!required) {
            return {
                ruleId: 'PCC_NOT_REQUIRED',
                domain: ComplianceDomain.PCC,
                passed: true,
                scoreImpact: 100
            };
        }

        const data = candidate.pccData;
        if (!data) {
            return {
                ruleId: 'PCC_MISSING',
                domain: ComplianceDomain.PCC,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'PCC_MISSING',
                    domain: ComplianceDomain.PCC,
                    severity: ComplianceSeverity.CRITICAL,
                    message: 'Police Clearance Certificate is missing.',
                    remedy: 'Request PCC immediately.',
                    blockingStages: [WorkflowStage.EMBASSY_APPLIED, WorkflowStage.VISA_RECEIVED, WorkflowStage.SLBFE_REGISTRATION]
                }
            };
        }

        if (data.status === PCCStatus.EXPIRED) {
            return {
                ruleId: 'PCC_EXPIRED',
                domain: ComplianceDomain.PCC,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'PCC_EXPIRED',
                    domain: ComplianceDomain.PCC,
                    severity: ComplianceSeverity.CRITICAL,
                    message: `PCC expired(Issued > ${COMPLIANCE_CONSTANTS.PCC_EXPIRY_DAYS} days ago).`,
                    remedy: 'Obtain new PCC.',
                    blockingStages: [WorkflowStage.EMBASSY_APPLIED, WorkflowStage.VISA_RECEIVED, WorkflowStage.SLBFE_REGISTRATION]
                }
            };
        }

        if (data.status === PCCStatus.EXPIRING) {
            return {
                ruleId: 'PCC_EXPIRING',
                domain: ComplianceDomain.PCC,
                passed: true,
                scoreImpact: 50,
                issue: {
                    id: 'PCC_EXPIRING',
                    domain: ComplianceDomain.PCC,
                    severity: ComplianceSeverity.WARNING,
                    message: `PCC is aging(${data.ageDays} days old).`,
                    remedy: 'Monitor PCC validity closely.',
                    blockingStages: []
                }
            };
        }

        return {
            ruleId: 'PCC_VALID',
            domain: ComplianceDomain.PCC,
            passed: true,
            scoreImpact: 100
        };
    }

    private static evaluateMedical(candidate: Candidate, required: boolean): ComplianceRuleResult {
        const status = candidate.medicalData?.status || candidate.stageData?.medicalStatus;

        // Logic: Medical is "Process Dependent". 
        // If status is FAILED, it's CRITICAL regardless of "required" (if they took it and failed, that's bad).
        // If required and NOT_STARTED, it's a warning but not blocking *early* stages, but blocking *late* stages.

        if (status === MedicalStatus.FAILED) {
            return {
                ruleId: 'MEDICAL_FAILED',
                domain: ComplianceDomain.MEDICAL,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'MEDICAL_FAILED',
                    domain: ComplianceDomain.MEDICAL,
                    severity: ComplianceSeverity.CRITICAL,
                    message: 'Medical test failed.',
                    remedy: 'Candidate cannot proceed. Check if re-test is possible.',
                    blockingStages: [WorkflowStage.VISA_RECEIVED, WorkflowStage.SLBFE_REGISTRATION, WorkflowStage.DEPARTED]
                }
            };
        }

        if (required && (!status || status === MedicalStatus.NOT_STARTED)) {
            // It's okay for Registration stage, but not for Visa.
            // We'll mark it as WARNING/Info here, but specific stages will block.
            return {
                ruleId: 'MEDICAL_PENDING',
                domain: ComplianceDomain.MEDICAL,
                passed: true,
                scoreImpact: 50,
                issue: {
                    id: 'MEDICAL_PENDING',
                    domain: ComplianceDomain.MEDICAL,
                    severity: ComplianceSeverity.WARNING,
                    message: 'Medical not started.',
                    blockingStages: [WorkflowStage.VISA_RECEIVED]
                }
            };
        }

        if (status === MedicalStatus.SCHEDULED) {
            // Check if date is in past
            const scheduledDate = (candidate.medicalData?.scheduledDate || candidate.stageData?.medicalScheduledDate) ?
                new Date(candidate.medicalData?.scheduledDate || candidate.stageData?.medicalScheduledDate as string) : null;
            const now = new Date();
            if (scheduledDate && scheduledDate < now) {
                return {
                    ruleId: 'MEDICAL_OVERDUE',
                    domain: ComplianceDomain.MEDICAL,
                    passed: false,
                    scoreImpact: 20,
                    issue: {
                        id: 'MEDICAL_OVERDUE',
                        domain: ComplianceDomain.MEDICAL,
                        severity: ComplianceSeverity.WARNING,
                        message: 'Medical appointment overdue.',
                        blockingStages: []
                    }
                };
            }
        }

        if (status === MedicalStatus.COMPLETED) {
            return {
                ruleId: 'MEDICAL_COMPLETED',
                domain: ComplianceDomain.MEDICAL,
                passed: true,
                scoreImpact: 100
            };
        }

        return {
            ruleId: 'MEDICAL_STATUS_UNKNOWN',
            domain: ComplianceDomain.MEDICAL,
            passed: true,
            scoreImpact: 50
        };
    }

    private static evaluateAge(candidate: Candidate, rule: any): ComplianceRuleResult {
        // Calculate Age
        const dob = candidate.personalInfo?.dob || candidate.dob;
        if (!dob) {
            return {
                ruleId: 'DOB_MISSING',
                domain: ComplianceDomain.AGE,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'DOB_MISSING',
                    domain: ComplianceDomain.AGE,
                    severity: ComplianceSeverity.CRITICAL, // Cannot verify compliance
                    message: 'Date of Birth missing.',
                    blockingStages: [WorkflowStage.VERIFIED, WorkflowStage.APPLIED]
                }
            };
        }

        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs); // miliseconds from epoch
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        // Determine limits
        let limits = rule.defaultAgeLimit;

        // Check specific role limits
        // Simple string match on candidate.role or jobRoles for now
        if (rule.roleSpecificAgeLimits) {
            for (const roleKey in rule.roleSpecificAgeLimits) {
                if (candidate.role?.toLowerCase().includes(roleKey.toLowerCase())) {
                    limits = rule.roleSpecificAgeLimits[roleKey];
                    break;
                }
            }
        }

        if (age < limits.min) {
            return {
                ruleId: 'AGE_TOO_YOUNG',
                domain: ComplianceDomain.AGE,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'AGE_TOO_YOUNG',
                    domain: ComplianceDomain.AGE,
                    severity: ComplianceSeverity.CRITICAL,
                    message: `Candidate is ${age} (Min: ${limits.min}).`,
                    blockingStages: [WorkflowStage.REGISTERED, WorkflowStage.VERIFIED, WorkflowStage.APPLIED]
                }
            };
        }

        if (age > limits.max) {
            return {
                ruleId: 'AGE_TOO_OLD',
                domain: ComplianceDomain.AGE,
                passed: false,
                scoreImpact: 0,
                issue: {
                    id: 'AGE_TOO_OLD',
                    domain: ComplianceDomain.AGE,
                    severity: ComplianceSeverity.CRITICAL,
                    message: `Candidate is ${age} (Max: ${limits.max}).`,
                    blockingStages: [WorkflowStage.REGISTERED, WorkflowStage.VERIFIED, WorkflowStage.APPLIED]
                }
            };
        }

        return {
            ruleId: 'AGE_VALID',
            domain: ComplianceDomain.AGE,
            passed: true,
            scoreImpact: 100
        };
    }

    private static evaluateDocuments(candidate: Candidate, mandatoryDocs: DocumentType[]): ComplianceRuleResult[] {
        const results: ComplianceRuleResult[] = [];

        if (!mandatoryDocs || mandatoryDocs.length === 0) return results;

        const docs = candidate.documents || [];
        const uploadedDocs = new Set(docs.map(d => d.type));
        const approvedDocs = new Set(docs.filter(d => d.status === DocumentStatus.APPROVED).map(d => d.type));

        for (const docType of mandatoryDocs) {
            if (!uploadedDocs.has(docType)) {
                results.push({
                    ruleId: `DOC_MISSING_${docType} `,
                    domain: ComplianceDomain.DOCUMENTS,
                    passed: false,
                    scoreImpact: 0,
                    issue: {
                        id: `DOC_MISSING_${docType} `,
                        domain: ComplianceDomain.DOCUMENTS,
                        severity: ComplianceSeverity.CRITICAL, // Mandatory docs prevent meaningful progress
                        message: `Missing mandatory document: ${docType} `,
                        blockingStages: [WorkflowStage.VERIFIED, WorkflowStage.APPLIED]
                    }
                });
            } else if (!approvedDocs.has(docType)) {
                // Uploaded but not approved
                results.push({
                    ruleId: `DOC_PENDING_${docType} `,
                    domain: ComplianceDomain.DOCUMENTS,
                    passed: true,
                    scoreImpact: 50,
                    issue: {
                        id: `DOC_PENDING_${docType} `,
                        domain: ComplianceDomain.DOCUMENTS,
                        severity: ComplianceSeverity.WARNING,
                        message: `Document pending approval: ${docType} `,
                        blockingStages: [WorkflowStage.VERIFIED]
                    }
                });
            } else {
                results.push({
                    ruleId: `DOC_OK_${docType} `,
                    domain: ComplianceDomain.DOCUMENTS,
                    passed: true,
                    scoreImpact: 100
                });
            }
        }

        return results;
    }

    private static evaluateFlags(candidate: Candidate): ComplianceRuleResult[] {
        const results: ComplianceRuleResult[] = [];

        if (!candidate.complianceFlags || candidate.complianceFlags.length === 0) {
            return [{
                ruleId: 'NO_FLAGS',
                domain: ComplianceDomain.FLAGS,
                passed: true,
                scoreImpact: 100
            }];
        }

        const activeFlags = candidate.complianceFlags.filter(f => !f.isResolved);

        if (activeFlags.length === 0) {
            return [{
                ruleId: 'FLAGS_RESOLVED',
                domain: ComplianceDomain.FLAGS,
                passed: true,
                scoreImpact: 100
            }];
        }

        for (const flag of activeFlags) {
            results.push({
                ruleId: `FLAG_${flag.id}`,
                domain: ComplianceDomain.FLAGS,
                passed: flag.severity !== 'CRITICAL',
                scoreImpact: flag.severity === 'CRITICAL' ? 0 : 50,
                issue: {
                    id: `FLAG_${flag.id}`,
                    domain: ComplianceDomain.FLAGS,
                    severity: flag.severity === 'CRITICAL' ? ComplianceSeverity.CRITICAL : ComplianceSeverity.WARNING,
                    message: `Compliance Flag: ${flag.reason}`,
                    remedy: 'Resolve the flag in Compliance Widget.',
                    blockingStages: flag.severity === 'CRITICAL'
                        ? Object.values(WorkflowStage) // Blocks EVERYTHING
                        : []
                }
            });
        }

        return results;
    }

    private static calculateScore(results: ComplianceRuleResult[]): ComplianceScoreCard {
        const breakdown: Record<string, { score: number; maxScore: number }> = {};
        let totalScore = 0;
        let totalMax = 0;
        let criticalCount = 0;
        let warningCount = 0;

        // Group by Domain
        const domainMap = new Map<ComplianceDomain, ComplianceRuleResult[]>();

        results.forEach(r => {
            if (!domainMap.has(r.domain)) domainMap.set(r.domain, []);
            domainMap.get(r.domain)?.push(r);

            if (r.issue?.severity === ComplianceSeverity.CRITICAL) criticalCount++;
            if (r.issue?.severity === ComplianceSeverity.WARNING) warningCount++;
        });

        // Calculate per domain
        domainMap.forEach((rules, domain) => {
            const domainTotal = rules.reduce((acc, r) => acc + r.scoreImpact, 0);
            const domainMax = rules.length * 100;

            breakdown[domain] = { score: domainTotal, maxScore: domainMax };

            totalScore += domainTotal;
            totalMax += domainMax;
        });

        // Handle missing domains (if any) with 0? No, just don't include or init them.

        const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 100;

        return {
            overallScore: overallPercentage,
            // @ts-ignore - casting key string to enum key
            domainBreakdown: breakdown,
            criticalIssuesCount: criticalCount,
            warningIssuesCount: warningCount
        };
    }

    /**
     * Generates alerts based on the compliance report.
     */
    static generateAlerts(report: FullComplianceReport): AppNotification[] {
        const alerts: AppNotification[] = [];
        const now = new Date();

        report.results.forEach(result => {
            if (result.issue && (result.issue.severity === ComplianceSeverity.CRITICAL || result.issue.severity === ComplianceSeverity.WARNING)) {
                alerts.push({
                    id: `compliance - ${result.issue.id} -${report.candidateId} `,
                    type: result.issue.severity === ComplianceSeverity.CRITICAL ? 'DELAY' : 'WARNING',
                    title: `Compliance Alert: ${result.domain} `,
                    message: result.issue.message,
                    timestamp: now.toISOString(),
                    isRead: false,
                    candidateId: report.candidateId,
                    link: `/ candidates / ${report.candidateId} `
                });
            }
        });

        return alerts;
    }
}
