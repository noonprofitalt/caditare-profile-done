import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { styles } from '../styles';
import { SUHARA_LOGO_BASE64 as logo } from '../logoBase64';

interface HeaderSectionProps {
    reportId: string;
    generatedAt: string;
    candidateId: string;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ reportId, generatedAt, candidateId }) => {
    return (
        <View>
            <View style={styles.headerSection}>
                {/* 1. LOGO BLOCK */}
                <View style={styles.headerLeft}>
                    <Image
                        src={logo}
                        style={{ width: 160, height: 'auto', objectFit: 'contain' }}
                        cache={false}
                    />
                </View>

                {/* 2. TEXT BLOCK - RIGHT ALIGNED  */}
                <View style={styles.headerRight}>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Text style={[styles.contactBox, { textAlign: 'right', fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>
                            No 138, 2nd Floor, Colombo Road, Kurunegala
                        </Text>
                        <Text style={[styles.contactBox, { textAlign: 'right', marginBottom: 2 }]}>
                            Tel: 037 223 1333 | Mobile: 070 7008000
                        </Text>
                        <Text style={[styles.contactBox, { textAlign: 'right' }]}>
                            Web: www.suharaagency.com | Email: info@suharaagency.com
                        </Text>
                    </View>
                </View>
            </View>

            {/* Document Title */}
            <Text style={styles.reportTitle}>CANDIDATE PROCESSING STATUS REPORT</Text>

            {/* Meta Data Row */}
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>Reference ID: {candidateId}</Text>
                <Text style={styles.metaText}>Report ID: {reportId}</Text>
                <Text style={styles.metaText}>Generated On: {generatedAt}</Text>
            </View>
        </View>
    );
};
