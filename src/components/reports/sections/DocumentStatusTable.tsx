import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate, DocumentStatus } from '../../../../types';
import { formatDate } from '../../../utils/reportUtils';

interface DocumentStatusTableProps {
    candidate: Candidate;
}

export const DocumentStatusTable: React.FC<DocumentStatusTableProps> = ({ candidate }) => (
    <View style={styles.section}>
        <Text style={styles.h2}>DOCUMENT VERIFICATION STATUS</Text>
        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '35%' }]}>Document Name</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Category</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Status</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Verified By</Text>
                <Text style={[styles.tableCell, styles.lastCell, { width: '10%' }]}>Date</Text>
            </View>

            {candidate.documents.map((doc, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '35%' }]}>{doc.type.replace(/_/g, ' ')}</Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}>Mandatory</Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}>
                        {doc.status === DocumentStatus.APPROVED ? 'Approved' :
                            doc.status === DocumentStatus.REJECTED ? 'Rejected' :
                                doc.status === DocumentStatus.MISSING ? 'Missing' : 'Pending'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%' }]}>{'-'}</Text>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '10%' }]}>
                        {doc.uploadedAt ? formatDate(doc.uploadedAt) : '-'}
                    </Text>
                </View>
            ))}

            {candidate.documents.length === 0 && (
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '100%', textAlign: 'center' }]}>No documents recorded</Text>
                </View>
            )}
        </View>
    </View>
);
