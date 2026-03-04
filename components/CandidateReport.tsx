import React, { useEffect, useState } from 'react';
import { ShieldCheck, Printer, RefreshCw, AlertCircle, AlertTriangle, FileText, User, Info, CheckCircle } from 'lucide-react';
import { Candidate } from '../types';
import type { SystemReport } from '../services/reportService';
import { useCandidateReport } from '../src/hooks/useCandidateReport';

interface CandidateReportProps {
    candidate: Candidate;
}

const CandidateReport: React.FC<CandidateReportProps> = ({ candidate }) => {
    const [report, setReport] = useState<SystemReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
            link.download = `${candidate.regNo || candidate.candidateCode}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to generate PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        generate();
    }, [generate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <RefreshCw size={24} className="text-slate-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Compiling System Audit Matrix...</p>
            </div>
        );
    }

    if (!report) return null;

    const totalFlags = report.missingInfo.length + report.documentGaps.missing.length + report.documentGaps.rejected.length + report.dataQuality.length;

    return (
        <div className="animate-in fade-in duration-300 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b-2 border-slate-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={20} className="text-slate-900" />
                        <h2 className="text-lg font-bold uppercase tracking-tight">System Audit & Integrity Matrix</h2>
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                        <span>Report ID: <span className="text-slate-900">{reportId}</span></span>
                        <span>Generated: <span className="text-slate-900">{new Date().toLocaleString()}</span></span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <button onClick={generate} className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase transition-colors flex items-center gap-1.5">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50">
                        {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={14} />}
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Core Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-300 mb-8 max-w-full overflow-hidden">
                <div className="p-3 border-b md:border-b-0 md:border-r border-slate-300 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data Completion</p>
                    <p className={`text-xl font-bold ${report.completionPercentage === 100 ? 'text-emerald-700' : report.completionPercentage >= 80 ? 'text-slate-800' : 'text-red-700'}`}>
                        {report.completionPercentage}%
                    </p>
                </div>
                <div className="p-3 border-b md:border-b-0 md:border-r border-slate-300 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Integrity Flags</p>
                    <p className={`text-xl font-bold ${totalFlags === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {totalFlags} Detect{totalFlags === 1 ? 'ed' : 's'}
                    </p>
                </div>
                <div className="p-3 border-r border-slate-300 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SLA Velocity</p>
                    <p className="text-xl font-bold text-slate-800 capitalize truncate">
                        {report.slaStatus.status.toLowerCase().replace('_', ' ')}
                    </p>
                </div>
                <div className="p-3 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">System Status</p>
                    <p className="text-xl font-bold text-slate-800 truncate" title={report.overallStatus}>
                        {report.overallStatus}
                    </p>
                </div>
            </div>

            {/* Matrix Data Sections */}
            <div className="space-y-8">

                {/* Identity & Traceability */}
                <section>
                    <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 tracking-widest pl-1 border-l-2 border-slate-800">Identity & Traceability Validation</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-300">
                            <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-2 border-r border-slate-300 w-1/3">Verification Entity</th>
                                    <th className="p-2 border-r border-slate-300 w-1/3">System Value</th>
                                    <th className="p-2 w-1/3">Validation Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {[
                                    { entity: 'Primary Subject Name', value: candidate.name, status: 'Active', valid: true },
                                    { entity: 'System Identifier (Reg No)', value: candidate.candidateCode, status: 'Registered', valid: true },
                                    { entity: 'National Identity Structure', value: candidate.nic || '-', status: candidate.nic ? 'Verified' : 'Unverified (Missing)', valid: !!candidate.nic },
                                    { entity: 'Date of Birth Trace', value: candidate.dob || '-', status: candidate.dob ? 'Valid Format' : 'Unverified (Missing)', valid: !!candidate.dob },
                                    { entity: 'Contact Channel Integrity', value: candidate.phone, status: 'Active', valid: !!candidate.phone },
                                    { entity: 'Geospatial Location', value: candidate.city || '-', status: candidate.city ? 'Mapped' : 'Unmapped', valid: !!candidate.city },
                                    { entity: 'Passport Documentation', value: candidate.passportData?.passportNumber ? `No: ${candidate.passportData.passportNumber}` : '-', status: candidate.passportData?.passportNumber ? 'Document Verified' : 'No Data Present', valid: !!candidate.passportData?.passportNumber }
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-2 border-r border-slate-300 font-medium text-slate-700">{row.entity}</td>
                                        <td className="p-2 border-r border-slate-300 text-slate-900">{row.value}</td>
                                        <td className="p-2">
                                            <span className={`flex items-center gap-1.5 font-bold ${row.valid ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {row.valid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Chronological State Processing */}
                <section>
                    <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 tracking-widest pl-1 border-l-2 border-slate-800">Chronological State Processing</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-300">
                            <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-2 border-r border-slate-300 w-1/3">Event Descriptor</th>
                                    <th className="p-2 border-r border-slate-300 w-1/3">Timestamp Vector</th>
                                    <th className="p-2 w-1/3">Delta / Constraint</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr>
                                    <td className="p-2 border-r border-slate-300 font-medium text-slate-700">Initial Entity Creation</td>
                                    <td className="p-2 border-r border-slate-300 text-slate-900">{new Date(candidate.audit.createdAt).toLocaleString()}</td>
                                    <td className="p-2 text-slate-600">-</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border-r border-slate-300 font-medium text-slate-700">Last Modified Checksum</td>
                                    <td className="p-2 border-r border-slate-300 text-slate-900">{new Date(candidate.audit.updatedAt).toLocaleString()}</td>
                                    <td className="p-2 text-slate-600">Updated by System</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border-r border-slate-300 font-medium text-slate-700">Current Workflow Stage Entry</td>
                                    <td className="p-2 border-r border-slate-300 text-slate-900">{candidate.stageEnteredAt ? new Date(candidate.stageEnteredAt).toLocaleString() : 'N/A'}</td>
                                    <td className="p-2 font-medium">
                                        {report.comparativeMetrics && (
                                            <span className={report.comparativeMetrics.candidateDays > report.comparativeMetrics.companyAvgDays ? "text-amber-600" : "text-emerald-700"}>
                                                {report.comparativeMetrics.candidateDays} days (SLA Benchmark: {report.comparativeMetrics.companyAvgDays})
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Exception and Deficit Logs */}
                <section>
                    <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 tracking-widest pl-1 border-l-2 border-slate-800">Exception & Integrity Log</h3>

                    {totalFlags === 0 ? (
                        <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-3">
                            <CheckCircle size={18} />
                            <span className="text-sm font-bold uppercase">No Exceptions Detected. Integrity is Optimal.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border border-slate-300">
                                <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-2 border-r border-slate-300 w-24">Severity</th>
                                        <th className="p-2 border-r border-slate-300 w-48">Category Type</th>
                                        <th className="p-2 border-r border-slate-300 w-48">Entity Field / Document</th>
                                        <th className="p-2">Exception Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {/* Data Quality */}
                                    {report.dataQuality.map((issue, idx) => (
                                        <tr key={`dq-${idx}`} className="hover:bg-slate-50">
                                            <td className="p-2 border-r border-slate-300 font-bold text-red-600">HIGH</td>
                                            <td className="p-2 border-r border-slate-300 text-slate-700">Data Quality Incident</td>
                                            <td className="p-2 border-r border-slate-300 font-medium">{issue.field}</td>
                                            <td className="p-2 text-slate-900">{issue.issue}</td>
                                        </tr>
                                    ))}
                                    {/* Rejected Docs */}
                                    {report.documentGaps.rejected.map((doc, idx) => (
                                        <tr key={`dr-${idx}`} className="hover:bg-slate-50">
                                            <td className="p-2 border-r border-slate-300 font-bold text-red-600">HIGH</td>
                                            <td className="p-2 border-r border-slate-300 text-slate-700">Document Rejection</td>
                                            <td className="p-2 border-r border-slate-300 font-medium">{doc.type}</td>
                                            <td className="p-2 text-slate-900">{doc.reason}</td>
                                        </tr>
                                    ))}
                                    {/* Missing Docs */}
                                    {report.documentGaps.missing.map((doc, idx) => (
                                        <tr key={`dm-${idx}`} className="hover:bg-slate-50">
                                            <td className="p-2 border-r border-slate-300 font-bold text-amber-600">ELEVATED</td>
                                            <td className="p-2 border-r border-slate-300 text-slate-700">Missing Core Requirement</td>
                                            <td className="p-2 border-r border-slate-300 font-medium">{doc}</td>
                                            <td className="p-2 text-slate-900">Required document is absent from vault.</td>
                                        </tr>
                                    ))}
                                    {/* Missing Info */}
                                    {report.missingInfo.map((info, idx) => (
                                        <tr key={`mi-${idx}`} className="hover:bg-slate-50">
                                            <td className="p-2 border-r border-slate-300 font-bold text-slate-500">MODERATE</td>
                                            <td className="p-2 border-r border-slate-300 text-slate-700">Data Void / Null Output</td>
                                            <td className="p-2 border-r border-slate-300 font-medium">{info}</td>
                                            <td className="p-2 text-slate-900">Field has not been populated.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CandidateReport;
