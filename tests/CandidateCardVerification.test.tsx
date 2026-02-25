import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CandidateCard from '../components/CandidateCard';
import { Candidate, WorkflowStage, ProfileCompletionStatus, ComplianceFlag, MedicalStatus } from '../types';
import { BrowserRouter } from 'react-router-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Phone: () => <span data-testid="icon-phone" />,
    Mail: () => <span data-testid="icon-mail" />,
    MapPin: () => <span data-testid="icon-mappin" />,
    Calendar: () => <span data-testid="icon-calendar" />,
    ChevronDown: () => <span data-testid="icon-chevron-down" />,
    ChevronUp: () => <span data-testid="icon-chevron-up" />,
    FileText: () => <span data-testid="icon-file-text" />,
    CheckCircle: () => <span data-testid="icon-check-circle" />,
    AlertCircle: () => <span data-testid="icon-alert-circle" />,
    Clock: () => <span data-testid="icon-clock" />,
    ArrowRight: () => <span data-testid="icon-arrow-right" />,
    AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
}));

const mockCandidate = (flags: ComplianceFlag[] = []): Candidate => ({
    id: '1',
    name: 'Test Candidate',
    stage: WorkflowStage.REGISTERED,
    complianceFlags: flags,
    profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
    candidateCode: 'C001',
    email: 'test@example.com',
    phone: '1234567890',
    personalInfo: { fullName: 'Test Candidate' } as any,
    contactInfo: { primaryPhone: '1234567890', email: 'test@example.com' } as any,
    professionalProfile: {} as any,
    medicalData: { status: MedicalStatus.NOT_STARTED } as any,
    stageStatus: 'Pending' as any,
    timelineEvents: [],
    documents: [],
    workflowLogs: [],
    comments: [],
    audit: {} as any,
    preferredCountries: [],
    avatarUrl: '',
    stageEnteredAt: new Date().toISOString(),
    stageData: {},
    profileCompletionPercentage: 100,
    registrationSource: 'FULL_FORM' as any,
    profileType: 'FULL'
} as Candidate);

describe('CandidateCard Compliance', () => {
    it('should NOT show compliance warning if no flags', () => {
        render(
            <BrowserRouter>
                <CandidateCard candidate={mockCandidate([])} />
            </BrowserRouter>
        );

        // Expand the card
        const expandIcon = screen.getByTestId('icon-chevron-down');
        fireEvent.click(expandIcon);

        // Check for warning
        expect(screen.queryByText(/Active Compliance Flags/i)).toBeNull();
    });

    it('should show CRITICAL compliance warning when flags exist', () => {
        const flags: ComplianceFlag[] = [{
            id: 'f1',
            type: 'LEGAL',
            severity: 'CRITICAL',
            reason: 'Blacklisted by Bureau',
            isResolved: false,
            createdBy: 'Sys',
            createdAt: new Date().toISOString()
        }];

        render(
            <BrowserRouter>
                <CandidateCard candidate={mockCandidate(flags)} />
            </BrowserRouter>
        );

        // Expand the card
        const expandIcon = screen.getByTestId('icon-chevron-down');
        fireEvent.click(expandIcon);

        // Check for warning header
        expect(screen.getByText(/Active Compliance Flags/i)).toBeDefined();
        // Check for specific reason
        expect(screen.getByText(/Blacklisted by Bureau/i)).toBeDefined();
        // Check for badge text
        expect(screen.getByText('CRITICAL')).toBeDefined();
    });

    it('should show WARNING compliance badge', () => {
        const flags: ComplianceFlag[] = [{
            id: 'f2',
            type: 'BEHAVIORAL',
            severity: 'WARNING',
            reason: 'Rude behavior',
            isResolved: false,
            createdBy: 'Sys',
            createdAt: new Date().toISOString()
        }];

        render(
            <BrowserRouter>
                <CandidateCard candidate={mockCandidate(flags)} />
            </BrowserRouter>
        );

        // Expand
        const expandIcon = screen.getByTestId('icon-chevron-down');
        fireEvent.click(expandIcon);

        expect(screen.getByText(/Active Compliance Flags/i)).toBeDefined();
        expect(screen.getByText(/Rude behavior/i)).toBeDefined();
        expect(screen.getByText('WARNING')).toBeDefined();
    });
});
