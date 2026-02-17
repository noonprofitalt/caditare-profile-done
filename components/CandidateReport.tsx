import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Info, Printer, RefreshCw, FileSearch, User, MapPin, ShieldAlert, ShieldCheck, Upload, ArrowRight, ExternalLink, TrendingUp } from 'lucide-react';
import { Candidate } from '../types';
import { ReportService, SystemReport } from '../services/reportService';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CandidateReportPDF } from '../src/components/reports/CandidateReportPDF'; // Adjusted path if necessary
import { useCandidateReport } from '../src/hooks/useCandidateReport';

interface CandidateReportProps {
    candidate: Candidate;
}

const CandidateReport: React.FC<CandidateReportProps> = ({ candidate }) => {
    const [report, setReport] = useState<SystemReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // PDF Hook
    const { reportId, generatedBy } = useCandidateReport(candidate);

    const generate = React.useCallback(async () => {
        setIsLoading(true);
        const data = await ReportService.generateReport(candidate);
        setReport(data);
        setIsLoading(false);
    }, [candidate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Action Header */}
            <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <FileSearch size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">System Audit & Integrity Report</h3>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Verified System Integrity Protocol</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={generate}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-bold text-xs"
                    >
                        <RefreshCw size={14} /> Refresh Analysis
                    </button>

                    <PDFDownloadLink
                        document={<CandidateReportPDF candidate={candidate} reportId={reportId} generatedBy={generatedBy} systemReport={report || undefined} />}
                        fileName={`Candidate_Report_${candidate.name.replace(/\s+/g, '_')}_${reportId}.pdf`}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all font-bold text-xs no-print"
                    >
                        {({ blob, url, loading, error }) => (
                            <>
                                <Printer size={14} />
                                {loading ? 'Preparing PDF...' : 'Export Formal PDF'}
                            </>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* Main Report Page */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden printable-area max-w-5xl mx-auto relative">
                {/* Confidentiality Watermark */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] rotate-[-45deg] flex items-center justify-center overflow-hidden">
                    <span className="text-9xl font-black whitespace-nowrap uppercase tracking-tighter">Confidential Audit Report</span>
                </div>

                {/* Report Header */}
                <div className="bg-slate-900 text-white p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                    <ShieldCheck size={20} className="text-blue-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">System Performance Audit</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight mb-2">RECRUITMENT INTEGRITY AUDIT</h2>
                            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                <MapPin size={14} /> Country of Deployment: <span className="text-white font-bold">{candidate.preferredCountries?.[0] || 'GENERAL'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`${getRiskStyles(report.riskScore)} px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 inline-block border`}>
                                Risk Level: {report.riskScore}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Audit Reference</p>
                            <p className="text-xs font-mono text-slate-300">{report.timestamp.replace(/[:.-]/g, '').slice(0, 14)}-{candidate.id.slice(0, 6)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                        {/* Interactive Visual Card 1: Integrity Score */}
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CheckCircle size={80} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Integrity Score</p>
                            <div className="h-24 w-full relative z-10 flex items-center justify-between">
                                <div className="text-4xl font-black text-white">{report.completionPercentage}%</div>
                                <div className="w-24 h-24">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={integrityData}
                                                innerRadius={25}
                                                outerRadius={35}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {integrityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Visual Card 2: SLA Health */}
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden hover:bg-white/10 transition-colors cursor-default">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Process Velocity</p>
                            <div className="h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={slaData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${report.slaStatus.status === 'CRITICAL' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                <span className="text-[10px] text-slate-300 font-bold uppercase">{report.slaStatus.status.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Profile Status</p>
                            <p className="text-xl font-bold text-white uppercase tracking-wider">{report.overallStatus}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Audit Issues</p>
                            <p className="text-xl font-bold text-white">{report.missingInfo.length + report.documentGaps.missing.length + report.documentGaps.rejected.length} Flagged</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    {/* Section 1: Detailed Profile Summary */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                <User size={16} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">01. Profile Information Verification</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Section 2: Gap Analysis */}
                        <div className="space-y-10">
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">02. Data Audit Flags</h4>
                                </div>

                                <div className="space-y-4">
                                    {/* Field Level Issues */}
                                    {report.dataQuality.map((issue, idx) => (
                                        <div key={`issue-${issue.field}-${issue.issue}-${idx}`} className="flex items-start justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl group hover:border-amber-300 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-4">
                                                <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-900 uppercase tracking-tighter">{issue.field} - {issue.issue}</p>
                                                    <p className="text-[10px] text-amber-700 font-medium mt-1">Suggested Action: Verify with candidate.</p>
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
                                        <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center">
                                            <CheckCircle size={40} className="text-emerald-500 mb-4" />
                                            <p className="text-emerald-900 font-bold">Audit Verified</p>
                                            <p className="text-emerald-700 text-xs mt-1">No critical gaps detected.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="mt-8 bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Info size={16} className="text-blue-400" />
                                <h5 className="font-black text-xs uppercase tracking-widest">Audit Instructions</h5>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Case Officers must resolve all "Fix Required" items before
                                finalizing the <b>Verification</b> stage.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden print:flex flex-col items-center justify-center p-10 border-t border-slate-200 bg-slate-50 mt-auto">
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-2">Generated by Suhara ERP CORE Cloud</p>
                </div>
            </div>
        </div>
    );
};

export default CandidateReport;
