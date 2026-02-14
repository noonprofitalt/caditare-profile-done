import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate } from '../../../../types';
import { formatDate, formatText, formatCurrency } from '../../../utils/reportUtils';

interface BureauSectionProps {
    candidate: Candidate;
}

export const BureauSection: React.FC<BureauSectionProps> = ({ candidate }) => {
    const slbfe = candidate.slbfeData || {} as any;

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>SLBFE BUREAU REGISTRATION & LEGAL</Text>

            <View style={styles.row}>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Registration No</Text>
                    <Text style={styles.value}>{formatText(slbfe.registrationNumber)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Reg. Date</Text>
                    <Text style={styles.value}>{formatDate(slbfe.registrationDate)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Family Consent</Text>
                    <Text style={styles.value}>{slbfe.familyConsent?.isGiven ? 'GRANTED' : 'PENDING'}</Text>
                </View>
            </View>

            <View style={[styles.row, { marginTop: 4 }]}>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Training Inst.</Text>
                    <Text style={styles.value}>{formatText(slbfe.trainingInstitute)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Certificate No</Text>
                    <Text style={styles.value}>{formatText(slbfe.trainingCertificateNo)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Training Date</Text>
                    <Text style={styles.value}>{formatDate(slbfe.trainingDate)}</Text>
                </View>
            </View>

            <View style={[styles.row, { marginTop: 4 }]}>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Insurance Policy</Text>
                    <Text style={styles.value}>{formatText(slbfe.insurancePolicyNumber)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Provider</Text>
                    <Text style={styles.value}>{formatText(slbfe.insuranceProvider)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.label}>Premium Paid</Text>
                    <Text style={styles.value}>{slbfe.insurancePremium ? formatCurrency(slbfe.insurancePremium) : '-'}</Text>
                </View>
            </View>

            <View style={[styles.bgGray, { marginTop: 8, padding: 4, borderRadius: 2, borderWidth: 1, borderColor: '#ccc' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.label, { width: 140 }]}>Biometric Status (Fingerprint):</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{slbfe.biometricStatus || 'PENDING'}</Text>
                </View>
            </View>
        </View>
    );
};
