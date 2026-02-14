import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate, MedicalStatus } from '../../../../types';
import { formatDate, formatText } from '../../../utils/reportUtils';

interface ComplianceSectionProps {
    candidate: Candidate;
}

export const ComplianceSection: React.FC<ComplianceSectionProps> = ({ candidate }) => (
    <View style={styles.section}>
        <Text style={styles.h2}>Compliance & Verification</Text>

        <View style={styles.grid2}>
            {/* Medical */}
            <View style={styles.gridItem2}>
                <Text style={styles.h3}>Medical Status</Text>
                <View style={styles.row}>
                    <Text style={styles.small}>Status: </Text>
                    <Text style={styles.text}>{formatText(candidate.stageData?.medicalStatus || 'Not Started')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.small}>Date: </Text>
                    <Text style={styles.text}>{formatDate(candidate.stageData?.medicalCompletedDate)}</Text>
                </View>
            </View>

            {/* Police Clearance */}
            <View style={styles.gridItem2}>
                <Text style={styles.h3}>Police Clearance</Text>
                <View style={styles.row}>
                    <Text style={styles.small}>Status: </Text>
                    <Text style={styles.text}>{formatText(candidate.pccData?.status || candidate.stageData?.policeStatus || 'Pending')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.small}>Issued: </Text>
                    <Text style={styles.text}>{formatDate(candidate.pccData?.issuedDate)}</Text>
                </View>
            </View>
        </View>

        <View style={[styles.grid2, { marginTop: 10 }]}>
            {/* SLBFE */}
            <View style={styles.gridItem2}>
                <Text style={styles.h3}>SLBFE Registration</Text>
                <View style={styles.row}>
                    <Text style={styles.small}>Reg No: </Text>
                    <Text style={styles.text}>{formatText(candidate.slbfeData?.registrationNumber || 'Pending')}</Text>
                </View>
            </View>

            {/* Training */}
            <View style={styles.gridItem2}>
                <Text style={styles.h3}>Training</Text>
                <View style={styles.row}>
                    <Text style={styles.small}>Status: </Text>
                    <Text style={styles.text}>{candidate.trainingDetails ? 'Completed' : 'Pending'}</Text>
                </View>
            </View>
        </View>
    </View>
);
