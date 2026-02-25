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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100/50">
                        <FileSearch size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 tracking-tight">System Audit & Integrity Report</h3>
                        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">Live Verification Protocol</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={generate}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-all font-medium text-xs shadow-sm"
                    >
                        <RefreshCw size={12} /> Refresh
                    </button>

                    <button
                        disabled={isExporting}
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all font-medium text-xs no-print disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Printer size={12} />}
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden printable-area relative">

                {/* Minimal Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">

                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-blue-500" /> Integrity Score
                        </p>
                        <div className="text-2xl font-bold text-slate-800">{report.completionPercentage}%</div>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Activity size={12} className={report.slaStatus.status === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500'} /> Process Velocity
                        </p>
                        <div className="text-2xl font-bold text-slate-800 capitalize">{report.slaStatus.status.toLowerCase().replace('_', ' ')}</div>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-indigo-500" /> Profile Status
                        </p>
                        <div className="text-sm font-bold text-slate-800 uppercase tracking-wide truncate" title={report.overallStatus}>{report.overallStatus}</div>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-amber-500" /> Audit Flags
                        </p>
                        <div className="text-2xl font-bold text-slate-800">{report.missingInfo.length + report.documentGaps.missing.length + report.documentGaps.rejected.length}</div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                    {/* Section 1: Detailed Profile Summary */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-sm font-semibold text-slate-800">Profile Information Verification</h4>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-lg">
                            {[
                                { label: 'Full Name', value: candidate.name },
                                { label: 'E-mail Address', value: candidate.email },
                                { label: 'Contact Number', value: candidate.phone },
                                { label: 'Current Role', value: candidate.role },
                                { label: 'National ID/NIC', value: candidate.nic || 'NOT PROVIDED', isAlert: !candidate.nic },
                                { label: 'Date of Birth', value: candidate.dob || 'NOT PROVIDED', isAlert: !candidate.dob },
                                { label: 'Experience', value: `${candidate.experienceYears} Years` },
                                { label: 'City/Location', value: candidate.city || 'NOT PROVIDED', isAlert: !candidate.city },
                            ].map((item, i) => (
                                <div key={i}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className={`text-sm font-bold ${item.isAlert ? 'text-red-600 italic' : 'text-slate-700'}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Section 2: Gap Analysis */}
                        <div className="space-y-4">
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h4 className="text-sm font-semibold text-slate-800">Data Audit Flags</h4>
                                </div>

                                <div className="space-y-4">
                                    {/* Field Level Issues */}
                                    {report.dataQuality.map((issue, idx) => (
                                        <div key={`issue-${issue.field}-${issue.issue}-${idx}`} className="flex items-start justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl group hover:border-amber-300 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-4">
                                                <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-medium text-amber-900">{issue.field} - {issue.issue}</p>
                                                    <p className="text-[10px] text-amber-700 mt-0.5">Suggested Action: Verify with candidate.</p>
                                                </div>
                                            </div>
                                            <button className="hidden group-hover:flex no-print items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm">
                                                <RefreshCw size={12} /> Fix Now
                                            </button>
                                        </div>
                                    ))}

                                    {/* Missing Docs */}
                                    {report.documentGaps.missing.map(doc => (
                                        <div key={doc} className="flex items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-xl group hover:border-red-200 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <FileText size={16} className="text-red-400" />
                                                <span className="text-sm font-bold text-slate-700">{doc}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded">Missing</span>
                                                <button className="hidden group-hover:flex no-print items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm">
                                                    <Upload size={12} /> Upload
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Rejected Docs */}
                                    {report.documentGaps.rejected.map(doc => (
                                        <div key={doc.type} className="flex flex-col gap-1 p-4 bg-red-50 border border-red-200 rounded-xl group hover:border-red-300 hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <FileSearch size={16} className="text-red-600" />
                                                    <span className="text-sm font-black text-red-900 uppercase tracking-tight">{doc.type}</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-white bg-red-600 px-2 py-1 rounded">Fix Required</span>
                                            </div>
                                            <div className="flex items-start justify-between mt-2">
                                                <p className="text-xs text-red-700 p-2 bg-white/50 rounded border border-red-100 font-medium italic flex-1">Reason: {doc.reason}</p>
                                                <button className="hidden group-hover:flex no-print items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm ml-3">
                                                    <ArrowRight size={12} /> Resolve
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {report.missingInfo.map(item => (
                                        <div key={item} className="flex items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-xl group hover:border-red-200 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                                <span className="text-sm font-bold text-slate-700">{item}</span>
                                            </div>
                                            <button className="hidden group-hover:flex no-print items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm">
                                                <ExternalLink size={12} /> Update
                                            </button>
                                        </div>
                                    ))}

                                    {report.missingInfo.length === 0 && report.documentGaps.missing.length === 0 && report.documentGaps.rejected.length === 0 && (
                                        <div className="flex items-center justify-center p-8 bg-emerald-50 rounded-lg border border-emerald-100 text-center gap-3">
                                            <CheckCircle size={20} className="text-emerald-500" />
                                            <div>
                                                <p className="text-emerald-800 text-sm font-semibold">Audit Verified</p>
                                                <p className="text-emerald-600 text-[10px]">No critical gaps detected.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>


                    </div>
                </div>

            </div>
        </div>
    );
};

export default CandidateReport;
