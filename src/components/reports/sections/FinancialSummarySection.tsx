import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate, PaymentRecord } from '../../../../types';
import { formatCurrency, formatDate } from '../../../utils/reportUtils';

interface FinancialSummarySectionProps {
    candidate: Candidate;
}

export const FinancialSummarySection: React.FC<FinancialSummarySectionProps> = ({ candidate }) => {
    const payments = candidate.stageData?.paymentHistory || [];
    const totalPaid = payments.reduce((sum: number, p: PaymentRecord) => sum + parseFloat(p.amount || '0'), 0);

    const totalPackageFee = 450000; // Example fixed fee
    const balance = totalPackageFee - totalPaid;

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>FINANCIAL SUMMARY</Text>

            <View style={[styles.row, { padding: '10 0' }]}>
                <View style={{ width: '33.3%' }}>
                    <Text style={[styles.small, { color: '#64748b', marginBottom: 4 }]}>Total Package Fee</Text>
                    <Text style={[styles.text, { fontSize: 13, fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(totalPackageFee)}</Text>
                </View>
                <View style={{ width: '33.3%', paddingLeft: 10 }}>
                    <Text style={[styles.small, { color: '#64748b', marginBottom: 4 }]}>Total Paid Amount</Text>
                    <Text style={[styles.text, { fontSize: 13, fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(totalPaid)}</Text>
                </View>
                <View style={{ width: '33.3%', paddingLeft: 10 }}>
                    <Text style={[styles.small, { color: '#64748b', marginBottom: 4 }]}>Outstanding Balance</Text>
                    <Text style={[styles.text, { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#ef4444' }]}>
                        {formatCurrency(balance)}
                    </Text>
                </View>
            </View>
        </View>
    );
};
