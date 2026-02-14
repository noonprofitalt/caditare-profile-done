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

    // Mock data for total fee if not in model
    const totalPackageFee = 450000; // Example fixed fee
    const balance = totalPackageFee - totalPaid;

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>Financial Summary</Text>

            <View style={styles.row}>
                <View style={{ width: '33%' }}>
                    <Text style={styles.small}>Total Package Fee</Text>
                    <Text style={[styles.text, styles.bold]}>{formatCurrency(totalPackageFee)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.small}>Total Paid Amount</Text>
                    <Text style={[styles.text, styles.bold]}>{formatCurrency(totalPaid)}</Text>
                </View>
                <View style={{ width: '33%' }}>
                    <Text style={styles.small}>Outstanding Balance</Text>
                    <Text style={[styles.text, styles.bold, { color: balance > 0 ? '#d32f2f' : '#388e3c' }]}>
                        {formatCurrency(balance)}
                    </Text>
                </View>
            </View>

            {payments.length > 0 && (
                <View style={[styles.table, { marginTop: 10 }]}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, { width: '30%' }]}>Date</Text>
                        <Text style={[styles.tableCell, { width: '40%' }]}>Description</Text>
                        <Text style={[styles.tableCell, styles.lastCell, { width: '30%' }]}>Amount (LKR)</Text>
                    </View>
                    {payments.map((p: PaymentRecord, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '30%' }]}>{formatDate(p.date)}</Text>
                            <Text style={[styles.tableCell, { width: '40%' }]}>{p.notes || 'Payment Received'}</Text>
                            <Text style={[styles.tableCell, styles.lastCell, { width: '30%' }]}>{formatCurrency(p.amount)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};
