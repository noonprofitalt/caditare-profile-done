import { useCallback, useEffect, useState } from 'react';
import { Candidate } from '@/types';
import { generateQRCode } from '../utils/reportUtils';

export const useCandidateReport = (candidate: Candidate) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    const generateReportId = useCallback(() => {
        // Generate a unique report ID: REPORT-YYYYMMDD-CANDIDATEID(4)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const suffix = candidate.id.slice(0, 4).toUpperCase();
        return `RPT-${date}-${suffix}`;
    }, [candidate.id]);

    const reportId = generateReportId();
    const generatedBy = 'System Admin'; // In real app, get from auth context

    useEffect(() => {
        const generate = async () => {
            const url = await generateQRCode(`VERIFY:${reportId}|CAND:${candidate.id}|REF:${candidate.candidateCode}`);
            setQrCodeUrl(url);
        };
        generate();
    }, [reportId, candidate.id, candidate.candidateCode]);

    return {
        reportId,
        generatedBy,
        qrCodeUrl,
        candidate // Pass through or transform if needed
    };
};
