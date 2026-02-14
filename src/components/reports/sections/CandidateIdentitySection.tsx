import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Candidate } from '../../../../types';
import { formatDate, formatText } from '../../../utils/reportUtils';

interface CandidateIdentitySectionProps {
    candidate: Candidate;
}

export const CandidateIdentitySection: React.FC<CandidateIdentitySectionProps> = ({ candidate }) => {
    const IdentityRow = ({ label, value }: { label: string, value: string | undefined }) => (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={{ width: 10, fontFamily: 'Times-Roman', fontSize: 11 }}>:</Text>
            <Text style={styles.value}>{formatText(value)}</Text>
        </View>
    );

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>CANDIDATE IDENTITY</Text>
            <View style={[styles.row, { alignItems: 'flex-start' }]}>
                {/* Photo Placeholder - Biometric Style */}
                <View style={{ width: 100, height: 120, border: '1px solid #000', marginRight: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Times-Roman' }}>PHOTO</Text>
                </View>

                {/* Identity Details - Biometric Style with Colon Alignment */}
                <View style={{ flex: 1 }}>
                    <IdentityRow label="Full Name" value={candidate.name} />
                    <IdentityRow label="NIC Number" value={candidate.nic} />
                    <IdentityRow label="Passport No" value={candidate.passportData?.passportNumber} />
                    <IdentityRow label="Passport Expiry" value={formatDate(candidate.passportData?.expiryDate)} />
                    <IdentityRow label="Nationality" value={candidate.nationality || 'Sri Lankan'} />
                    <IdentityRow label="Date of Birth" value={formatDate(candidate.dob)} />
                    <IdentityRow label="Gender" value={candidate.gender} />
                    <IdentityRow label="Marital Status" value={candidate.maritalStatus} />
                </View>
            </View>
        </View>
    );
};
