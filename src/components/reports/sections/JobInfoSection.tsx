import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate } from '../../../../types';
import { formatDate } from '../../../utils/reportUtils';

interface JobInfoSectionProps {
    candidate: Candidate;
}

export const JobInfoSection: React.FC<JobInfoSectionProps> = ({ candidate }) => (
    <View style={styles.section}>
        <Text style={styles.h2}>Employment Information</Text>
        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>Job Position</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>Employer Name</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Country</Text>
                <Text style={[styles.tableCell, styles.lastCell, { width: '20%' }]}>Salary</Text>
            </View>
            <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '30%' }]}>{candidate.position || candidate.role || '-'}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{candidate.employerId || 'Pending Assignment'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{candidate.preferredCountries?.[0] || 'Any'}</Text>
                <Text style={[styles.tableCell, styles.lastCell, { width: '20%' }]}>-</Text>
            </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <View style={{ width: '33%' }}>
                <Text style={styles.small}>Contract Duration</Text>
                <Text style={styles.text}>2 Years (Standard)</Text>
            </View>
            <View style={{ width: '33%' }}>
                <Text style={styles.small}>Working Hours</Text>
                <Text style={styles.text}>8 Hours / 6 Days</Text>
            </View>
            <View style={{ width: '33%' }}>
                <Text style={styles.small}>Accommodation</Text>
                <Text style={styles.text}>Provided by Company</Text>
            </View>
        </View>
    </View>
);
