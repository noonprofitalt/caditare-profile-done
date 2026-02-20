import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate } from '../../../../types';
import { formatText } from '../../../utils/reportUtils';

interface FamilySectionProps {
    candidate: Candidate;
}

export const FamilySection: React.FC<FamilySectionProps> = ({ candidate }) => {
    const personalInfo = candidate.personalInfo || {} as any;
    const childrenCount = personalInfo.children?.length || candidate.children?.length || candidate.numberOfChildren || 0;

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>FAMILY & DEPENDENTS (BIO-DATA)</Text>

            <View style={styles.row}>
                <View style={{ width: '50%', flexDirection: 'row' }}>
                    <Text style={styles.label}>Father's Name</Text>
                    <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                    <Text style={styles.value}>{formatText(personalInfo.fatherName || candidate.fatherName)}</Text>
                </View>
                <View style={{ width: '50%', flexDirection: 'row' }}>
                    <Text style={styles.label}>Mother's Name</Text>
                    <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                    <Text style={styles.value}>{formatText(personalInfo.motherName || candidate.motherName)}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <View style={{ width: '50%', flexDirection: 'row' }}>
                    <Text style={styles.label}>Spouse's Name</Text>
                    <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                    <Text style={styles.value}>{formatText(personalInfo.spouseName || candidate.spouseName)}</Text>
                </View>
                <View style={{ width: '50%', flexDirection: 'row' }}>
                    <Text style={styles.label}>No. of Children</Text>
                    <Text style={{ width: 10, fontFamily: 'Helvetica', fontSize: 11 }}>:</Text>
                    <Text style={styles.value}>{childrenCount}</Text>
                </View>
            </View>
        </View>
    );
};
