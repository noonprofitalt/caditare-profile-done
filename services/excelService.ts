import { Candidate } from '../types';

export class ExcelService {
    static exportCandidates(candidates: Candidate[], filename: string = 'candidates.csv') {
        // Prepare data for CSV export
        const rows = [
            // Header row
            ['Name', 'Email', 'Phone', 'Role', 'Stage', 'Status', 'City', 'Preferred Countries', 'Added Date', 'Days in Stage', 'Has Passport', 'Has PCC', 'Documents Count', 'Comments']
        ];

        // Data rows
        candidates.forEach(candidate => {
            rows.push([
                candidate.name,
                candidate.email,
                candidate.phone,
                candidate.role,
                candidate.stage,
                candidate.stageStatus,
                candidate.city,
                candidate.preferredCountries.join('; '),
                candidate.stageEnteredAt ? new Date(candidate.stageEnteredAt).toLocaleDateString() : '',
                String(this.calculateDaysInStage(candidate)),
                candidate.passportData ? 'Yes' : 'No',
                candidate.pccData ? 'Yes' : 'No',
                String(candidate.documents.length),
                String(candidate.comments?.length || 0)
            ]);
        });

        // Convert to CSV
        const csvContent = rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = filename.includes('.csv')
            ? filename
            : `${filename}_${timestamp}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return finalFilename;
    }

    static exportToCSV(candidates: Candidate[], filename: string = 'candidates.csv') {
        // Alias for exportCandidates
        return this.exportCandidates(candidates, filename);
    }

    private static calculateDaysInStage(candidate: Candidate): number {
        if (!candidate.stageEnteredAt) return 0;
        const entered = new Date(candidate.stageEnteredAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - entered.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
