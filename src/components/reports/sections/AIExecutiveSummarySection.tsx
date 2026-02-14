import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SystemReport } from '../../../../services/reportService';

interface AIExecutiveSummarySectionProps {
    systemReport: SystemReport;
}

export const AIExecutiveSummarySection: React.FC<AIExecutiveSummarySectionProps> = ({ systemReport }) => {
    const { aiInsights, riskScore } = systemReport;

    if (!aiInsights) return null;

    const getRiskStyle = (score: string) => {
        if (score === 'HIGH') return styles.riskBadgeHigh;
        if (score === 'MEDIUM') return styles.riskBadgeMed;
        return styles.riskBadgeLow;
    };

    return (
        <View style={styles.section} wrap={false}>
            <Text style={styles.h2}>AI EXECUTIVE CANDIDATE ASSESSMENT</Text>

            <View style={styles.aiRatingBox}>
                <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
                    <View>
                        <Text style={styles.small}>PLACEMENT PROBABILITY</Text>
                        <View style={styles.aiProbabilityBar}>
                            <View style={[styles.aiProbabilityFill, { width: `${aiInsights.placementProbability}%` }]} />
                        </View>
                        <Text style={[styles.text, { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>
                            {aiInsights.placementProbability}% Confidence
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.small}>INTEGRITY RISK LEVEL</Text>
                        <Text style={[getRiskStyle(riskScore), { marginTop: 4 }]}>{riskScore}</Text>
                    </View>
                </View>

                <View style={styles.grid2}>
                    <View style={styles.gridItem2}>
                        <Text style={styles.h3}>Top Strengths</Text>
                        {aiInsights.strengths.map((s, i) => (
                            <View key={i} style={styles.insightPoint}>
                                <View style={styles.insightBullet} />
                                <Text style={styles.small}>{s}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.gridItem2}>
                        <Text style={styles.h3}>Risk Factors</Text>
                        {aiInsights.risks.map((r, i) => (
                            <View key={i} style={styles.insightPoint}>
                                <View style={[styles.insightBullet, { backgroundColor: '#ef4444' }]} />
                                <Text style={styles.small}>{r}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }}>
                    <Text style={styles.h3}>Recommended Placement Roles</Text>
                    <Text style={styles.text}>{aiInsights.recommendedRoles.join(' • ')}</Text>
                </View>
            </View>

            <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 4 }}>
                <Text style={[styles.small, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>INTEGRITY SCAN SUMMARY</Text>
                <Text style={styles.small}>
                    This candidate has been analyzed by the GlobalWorkforce Intelligence Engine.
                    The assessment considers SLA compliance, document authenticity, and professional profile completeness.
                </Text>
            </View>
        </View>
    );
};
