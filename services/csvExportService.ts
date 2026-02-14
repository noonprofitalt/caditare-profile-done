export const convertToCSV = (objArray: any[]) => {
    if (objArray.length === 0) return '';

    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    // Extract headers from the first object
    // We want to flatten the object slightly for a "raw" CSV format
    // focusing on the most important fields
    const headers = [
        'ID',
        'Candidate Code',
        'Name',
        'Email',
        'Phone',
        'NIC',
        'Stage',
        'Stage Status',
        'Profile Completion %',
        'Risk Score',
        'SLA Status',
        'Days in Stage',
        'Missing Info Count',
        'Missing Docs Count',
        'Rejected Docs Count',
        'Experience (Years)',
        'Location',
        'Role',
        'Preferred Countries',
        'Registered Date',
        'Medical Status',
        'Police Status',
        'Visa Status',
        'Employer Status',
        'Payment Status'
    ];

    str += headers.join(',') + '\r\n';

    for (let i = 0; i < array.length; i++) {
        const candidate = array[i];

        // Basic calculations for reports (aligned with ReportService logic)
        const missingInfo: string[] = [];
        if (!candidate.nic) missingInfo.push('NIC');
        if (!candidate.dob) missingInfo.push('DOB');
        if (!candidate.gender) missingInfo.push('Gender');
        if (!candidate.address) missingInfo.push('Address');
        if (!candidate.education || candidate.education.length === 0) missingInfo.push('Education');

        const missingDocsCount = (candidate.documents || []).filter((d: any) => d.status === 'Missing').length;
        const rejectedDocsCount = (candidate.documents || []).filter((d: any) => d.status === 'Rejected' || d.status === 'Correction Required').length;

        const entryDate = new Date(candidate.stageEnteredAt);
        const now = new Date();
        const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        const slaStatus = daysInStage > 14 ? 'CRITICAL' : daysInStage > 7 ? 'WARNING' : 'ON_TRACK';

        // Risk Score calculation (from ReportService)
        const riskPoints = (missingInfo.length * 2) + (rejectedDocsCount * 3) + (missingDocsCount * 1) + (slaStatus === 'CRITICAL' ? 10 : 0);
        const riskScore = riskPoints > 15 ? 'HIGH' : riskPoints > 5 ? 'MEDIUM' : 'LOW';

        const line = [
            candidate.id || '',
            candidate.candidateCode || '',
            `"${candidate.name || ''}"`,
            candidate.email || '',
            candidate.phone || '',
            candidate.nic || '',
            candidate.stage || '',
            candidate.stageStatus || '',
            candidate.profileCompletionPercentage || '0',
            riskScore,
            slaStatus,
            daysInStage,
            missingInfo.length,
            missingDocsCount,
            rejectedDocsCount,
            candidate.experienceYears || '0',
            `"${candidate.location || ''}"`,
            `"${candidate.role || ''}"`,
            `"${(candidate.preferredCountries || []).join('; ')}"`,
            candidate.audit?.createdAt || '',
            candidate.stageData?.medicalStatus || '',
            candidate.stageData?.policeStatus || '',
            candidate.stageData?.visaStatus || '',
            candidate.stageData?.employerStatus || '',
            candidate.stageData?.paymentStatus || ''
        ];

        str += line.join(',') + '\r\n';
    }

    return str;
};
