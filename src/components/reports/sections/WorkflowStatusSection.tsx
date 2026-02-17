import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate } from '../../../../types';
import { formatDate } from '../../../utils/reportUtils';

interface WorkflowStatusSectionProps {
    candidate: Candidate;
}

export const WorkflowStatusSection: React.FC<WorkflowStatusSectionProps> = ({ candidate }) => (
    <View style={styles.section}>
        <Text style={styles.h2}>WORKFLOW STATUS</Text>

        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <View style={{ width: '50%', flexDirection: 'row' }}>
                <Text style={styles.label}>Current Stage</Text>
                <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                <Text style={[styles.value, { fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }]}>{candidate.stage}</Text>
            </View>
            <View style={{ width: '50%', flexDirection: 'row' }}>
                <Text style={styles.label}>Status</Text>
                <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                <Text style={[styles.value, { fontFamily: 'Helvetica-Bold' }]}>{candidate.stageStatus || 'IN PROGRESS'}</Text>
            </View>
        </View>

        <Text style={styles.h3}>PROCESSING TIMELINE</Text>

        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>Stage</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Date</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Notes</Text>
                <Text style={[styles.tableCell, styles.lastCell, { width: '20%' }]}>Officer</Text>
            </View>

            {(candidate.stageHistory || []).map((history, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '30%' }]}>{history.stage}</Text>
                    <Text style={[styles.tableCell, { width: '25%' }]}>{formatDate(history.timestamp?.toString())}</Text>
                    <Text style={[styles.tableCell, { width: '25%' }]}>{history.notes || '-'}</Text>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '20%' }]}>{history.userId || 'System'}</Text>
                </View>
            ))}

            {(!candidate.stageHistory || candidate.stageHistory.length === 0) && (
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.lastCell, { width: '100%', textAlign: 'center', color: '#666' }]}>No timeline data available</Text>
                </View>
            )}
        </View>
    </View>
);
