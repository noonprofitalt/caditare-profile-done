import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate, DocumentStatus, DocumentType, MedicalStatus } from '@/types';

interface ComplianceSnapshotProps {
    candidate: Candidate;
}

export const ComplianceSnapshot: React.FC<ComplianceSnapshotProps> = ({ candidate }) => {
    // Generate Status Texts (Same Logic)
    const passportStatus = candidate.documents?.find(d => d.type === DocumentType.PASSPORT)?.status === DocumentStatus.APPROVED ? 'Valid' : 'Pending';
    const pccStatus = candidate.documents?.find(d => d.type === DocumentType.POLICE_CLEARANCE)?.status === DocumentStatus.APPROVED ? 'Valid' : 'Pending';

    // Medical
    const medStatus = candidate.medicalData?.status;
    let medicalDisplay = 'Pending';
    if (medStatus === MedicalStatus.COMPLETED) medicalDisplay = 'Cleared';
    else if (medStatus === MedicalStatus.FAILED) medicalDisplay = 'Unfit';

    // SLBFE
    const slbfeStatus = candidate.slbfeData?.registrationNumber ? 'Registered' : 'Pending';

    // Helper for Status Coloring
    const statusStyle = (status: string) => ({
        fontFamily: status === 'Pending' || status === 'Unfit' ? 'Helvetica-Bold' : 'Helvetica',
        color: status === 'Pending' || status === 'Unfit' ? '#ef4444' : '#166534', // Red/Green logic
        fontSize: 9
    });

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>COMPLIANCE STATUS SNAPSHOT</Text>

            <View style={styles.table}>
                {/* Header Row */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { width: '25%' }]}>PASSPORT</Text>
                    <Text style={[styles.tableCell, { width: '25%' }]}>POLICE CLEARANCE</Text>
                    <Text style={[styles.tableCell, { width: '25%' }]}>MEDICAL</Text>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '25%' }]}>SLBFE</Text>
                </View>

                {/* Data Row */}
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '25%' }, statusStyle(passportStatus)]}>{passportStatus}</Text>
                    <Text style={[styles.tableCell, { width: '25%' }, statusStyle(pccStatus)]}>{pccStatus}</Text>
                    <Text style={[styles.tableCell, { width: '25%' }, statusStyle(medicalDisplay)]}>{medicalDisplay}</Text>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '25%' }, statusStyle(slbfeStatus)]}>{slbfeStatus}</Text>
                </View>
            </View>
        </View>
    );
};
