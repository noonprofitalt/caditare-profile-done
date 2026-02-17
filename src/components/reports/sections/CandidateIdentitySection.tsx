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
        <View style={[styles.row, { marginBottom: 6 }]}>
            <Text style={[styles.label, { width: 110, fontSize: 9.5 }]}>{label}</Text>
            <Text style={{ width: 15, fontSize: 10, color: '#64748b' }}>:</Text>
            <Text style={[styles.value, { fontSize: 10, color: '#000', fontFamily: 'Helvetica' }]}>{formatText(value)}</Text>
        </View>
    );

    return (
        <View style={styles.section}>
            <Text style={styles.h2}>CANDIDATE IDENTITY</Text>
            <View style={[styles.row, { marginTop: 10 }]}>
                {/* Photo Placeholder */}
                <View style={{
                    width: 120,
                    height: 140,
                    borderWidth: 1,
                    borderColor: '#000',
                    marginRight: 30,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{ fontSize: 9, color: '#666' }}>PHOTO</Text>
                </View>

                {/* Identity Details */}
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
