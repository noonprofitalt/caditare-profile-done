import { Candidate, DocumentStatus, DocumentType } from '../types';
import { GeminiService } from './geminiService';

export interface SystemReport {
    timestamp: string;
    candidateName: string;
    overallStatus: string;
    completionPercentage: number;
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
    slaStatus: {
        daysInStage: number;
        status: 'ON_TRACK' | 'WARNING' | 'CRITICAL';
    };
    comparativeMetrics?: {
        candidateDays: number;
        companyAvgDays: number;
        percentile: number;
    };
    dataQuality: {
        field: string;
        issue: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }[];
    missingInfo: string[];
    documentGaps: {
        missing: DocumentType[];
        rejected: { type: DocumentType; reason: string }[];
        pendingReview: DocumentType[];
    };
    aiInsights: string;
}

export class ReportService {
    static async generateReport(candidate: Candidate): Promise<SystemReport> {
        const missingInfo: string[] = [];
        const dataQuality: SystemReport['dataQuality'] = [];

        // Essential fields
        if (!candidate.nic) missingInfo.push('National ID / NIC');
        if (!candidate.dob) missingInfo.push('Date of Birth');
        if (!candidate.gender) missingInfo.push('Gender');
        if (!candidate.address) missingInfo.push('Address');
        if (!candidate.education || candidate.education.length === 0) missingInfo.push('Education background');
        if (!candidate.skills || candidate.skills.length === 0) missingInfo.push('Professional Skills');

        // Data Quality Checks
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (candidate.email && !emailRegex.test(candidate.email)) {
            dataQuality.push({ field: 'Email Address', issue: 'Invalid format detected', severity: 'MEDIUM' });
        }

        const phoneRegex = /^\+?[\d\s-]{8,}$/;
        if (candidate.phone && !phoneRegex.test(candidate.phone)) {
            dataQuality.push({ field: 'Phone Number', issue: 'Potential invalid format', severity: 'LOW' });
        }

        const documentGaps = {
            missing: [] as DocumentType[],
            rejected: [] as { type: DocumentType; reason: string }[],
            pendingReview: [] as DocumentType[]
        };

        candidate.documents.forEach(doc => {
            if (doc.status === DocumentStatus.MISSING) {
                documentGaps.missing.push(doc.type);
            } else if (doc.status === DocumentStatus.REJECTED || doc.status === DocumentStatus.CORRECTION_REQUIRED) {
                documentGaps.rejected.push({ type: doc.type, reason: doc.rejectionReason || 'No reason specified' });
            } else if (doc.status === DocumentStatus.PENDING) {
                documentGaps.pendingReview.push(doc.type);
            }
        });

        // SLA Analysis (Mock logic: based on stageEnteredAt)
        const entryDate = new Date(candidate.stageEnteredAt);
        const now = new Date();
        const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        let slaStatus: SystemReport['slaStatus']['status'] = 'ON_TRACK';
        if (daysInStage > 14) slaStatus = 'CRITICAL';
        else if (daysInStage > 7) slaStatus = 'WARNING';

        // Comparative Analysis (V3)
        const stageAverages: Record<string, number> = {
            'Registered': 2,
            'Verified': 5,
            'Applied': 5,
            'Offer Received': 7,
            'WP Received': 14,
            'Embassy Applied': 1,
            'Visa Received': 7,
            'SLBFE Registration': 3,
            'Ticket Issued': 2,
            'Departed': 1
        };
        const companyAvgDays = stageAverages[candidate.stage] || 7;

        const comparativeMetrics = {
            candidateDays: daysInStage,
            companyAvgDays,
            percentile: daysInStage > companyAvgDays ? 75 : 25 // Mock percentile
        };

        // Risk Score calculation
        let riskScore: SystemReport['riskScore'] = 'LOW';
        const riskPoints = (missingInfo.length * 2) + (documentGaps.rejected.length * 3) + (documentGaps.missing.length * 1) + (slaStatus === 'CRITICAL' ? 10 : 0);

        if (riskPoints > 15) riskScore = 'HIGH';
        else if (riskPoints > 5) riskScore = 'MEDIUM';

        // Calculate a basic completion percentage
        const totalFields = 7 + candidate.documents.length;
        const filledFields = (7 - missingInfo.length) + (candidate.documents.length - (documentGaps.missing.length + documentGaps.rejected.length));
        const completionPercentage = Math.round((filledFields / totalFields) * 100);

        // Get AI Insights
        const aiInsights = await GeminiService.analyzeCandidate({
            ...candidate,
            additionalAuditData: {
                missingInfo,
                dataQuality,
                riskScore,
                slaStatus: { daysInStage, status: slaStatus },
                documentSummary: `Missing: ${documentGaps.missing.length}, Rejected: ${documentGaps.rejected.length}`
            }
        } as any);

        return {
            timestamp: new Date().toISOString(),
            candidateName: candidate.name,
            overallStatus: candidate.stage,
            completionPercentage,
            riskScore,
            slaStatus: { daysInStage, status: slaStatus },
            comparativeMetrics,
            dataQuality,
            missingInfo,
            documentGaps,
            aiInsights
        };
    }
}
