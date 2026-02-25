import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Info, Printer, RefreshCw, FileSearch, User, MapPin, ShieldAlert, ShieldCheck, Upload, ArrowRight, ExternalLink, TrendingUp, Activity } from 'lucide-react';
import { Candidate } from '../types';
import type { SystemReport } from '../services/reportService';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useCandidateReport } from '../src/hooks/useCandidateReport';

interface CandidateReportProps {
    candidate: Candidate;
}

const CandidateReport: React.FC<CandidateReportProps> = ({ candidate }) => {
    const [report, setReport] = useState<SystemReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // PDF Hook
    const { reportId, generatedBy } = useCandidateReport(candidate);

    const generate = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const { ReportService } = await import('../services/reportService');
            const data = await ReportService.generateReport(candidate);
            setReport(data);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setIsLoading(false);
        }
    }, [candidate]);

    const handleExportPDF = async () => {
        if (!report) return;
        setIsExporting(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { CandidateReportPDF } = await import('../src/components/reports/CandidateReportPDF');

            const blob = await pdf(
                <CandidateReportPDF
                    candidate={candidate}
                    reportId={reportId}
                    generatedBy={generatedBy}
                    systemReport={report}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Candidate_Report_${candidate.name.replace(/\s+/g, '_')}_${reportId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {

        generate();
    }, [generate]);

    const getRiskStyles = (score: string) => {
        switch (score) {
            case 'HIGH': return 'bg-red-600 text-white border-red-700 shadow-red-100';
            case 'MEDIUM': return 'bg-amber-500 text-white border-amber-600 shadow-amber-100';
            default: return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCw size={32} className="text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">Running comprehensive system audit and integrity analysis...</p>
            </div>
        );
    }

    if (!report) return null;

    const integrityData = [
        { name: 'Completed', value: report.completionPercentage, color: '#3b82f6' },
        { name: 'Missing', value: 100 - report.completionPercentage, color: '#e2e8f0' }
    ];

    const slaData = report.comparativeMetrics ? [
        { name: 'This Candidate', days: report.comparativeMetrics.candidateDays, fill: report.slaStatus.status === 'CRITICAL' ? '#ef4444' : '#3b82f6' },
        { name: 'Company Avg', days: report.comparativeMetrics.companyAvgDays, fill: '#94a3b8' }
    ] : [];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between no-print mb-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-600" />
                    <h3 className="text-sm font-medium text-slate-800">System Audit & Integrity</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={generate}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-xs font-medium"
                    >
                        <RefreshCw size={12} /> Refresh
                    </button>
                    <button
                        disabled={isExporting}
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-xs font-medium no-print disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Printer size={12} />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden printable-area">

                {/* Minimal Top Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-4 p-3 px-4">
                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">Integrity</span>
                        <span className="text-sm font-medium text-slate-900">{report.completionPercentage}%</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 px-4">
                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">Velocity</span>
                        <span className="text-sm font-medium text-slate-900 capitalize">{report.slaStatus.status.toLowerCase().replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 px-4">
                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">Status</span>
                        <span className="text-sm font-medium text-slate-900 truncate" title={report.overallStatus}>{report.overallStatus}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 px-4">
                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">Flags</span>
                        <span className={`text-sm font-medium ${report.missingInfo.length + report.documentGaps.missing.length + report.documentGaps.rejected.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {report.missingInfo.length + report.documentGaps.missing.length + report.documentGaps.rejected.length}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Section 1: Profile Summary */}
                    <div className="flex-1 p-5">
                        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Profile Assessment</h4>
                        <div className="space-y-2">
                            {[
                                { label: 'Full Name', value: candidate.name },
                                { label: 'E-mail Address', value: candidate.email },
                                { label: 'Contact Number', value: candidate.phone },
                                { label: 'Current Role', value: candidate.role },
                                { label: 'National ID/NIC', value: candidate.nic || 'Missing', isAlert: !candidate.nic },
                                { label: 'Date of Birth', value: candidate.dob || 'Missing', isAlert: !candidate.dob },
                                { label: 'Experience', value: `${candidate.experienceYears} Years` },
                                { label: 'Location', value: candidate.city || 'Missing', isAlert: !candidate.city },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0 last:pb-0">
                                    <span className="text-slate-500 text-xs">{item.label}</span>
                                    <span className={`text-xs ${item.isAlert ? 'text-amber-600 font-medium' : 'text-slate-800'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Audit Flags */}
                    <div className="flex-1 p-5">
                        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Identified Risks</h4>

                        <div className="space-y-3">
                            {/* Field Level Issues */}
                            {report.dataQuality.map((issue, idx) => (
                                <div key={`issue-${issue.field}-${idx}`} className="flex items-start justify-between gap-3 text-sm group">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-xs text-slate-800">{issue.field} Data</p>
                                            <p className="text-[11px] text-slate-500">{issue.issue}</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 text-[11px] font-medium transition-opacity">Fix</button>
                                </div>
                            ))}

                            {/* Missing Docs */}
                            {report.documentGaps.missing.map(doc => (
                                <div key={doc} className="flex items-start justify-between gap-3 text-sm group">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-xs text-slate-800">{doc} Required</p>
                                            <p className="text-[11px] text-slate-500">Document is missing.</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 text-[11px] font-medium transition-opacity">Upload</button>
                                </div>
                            ))}

                            {/* Rejected Docs */}
                            {report.documentGaps.rejected.map(doc => (
                                <div key={doc.type} className="flex items-start justify-between gap-3 text-sm group">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-xs text-slate-800">{doc.type} Rejected</p>
                                            <p className="text-[11px] text-slate-500">{doc.reason}</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 text-[11px] font-medium transition-opacity">Resolve</button>
                                </div>
                            ))}

                            {/* General Missing Info */}
                            {report.missingInfo.map(item => (
                                <div key={item} className="flex items-start justify-between gap-3 text-sm group">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                                        <div>
                                            <p className="text-xs text-slate-800">{item} Needed</p>
                                            <p className="text-[11px] text-slate-500">Incomplete profile data.</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 text-[11px] font-medium transition-opacity">Update</button>
                                </div>
                            ))}

                            {/* Everything clean */}
                            {report.missingInfo.length === 0 && report.documentGaps.missing.length === 0 && report.documentGaps.rejected.length === 0 && report.dataQuality.length === 0 && (
                                <div className="flex items-center gap-2 text-emerald-600 text-xs py-2">
                                    <CheckCircle size={14} />
                                    <span>No audit flags detected. Profile is fully compliant.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CandidateReport;
