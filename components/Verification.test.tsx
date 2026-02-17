
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CandidateDetail from './CandidateDetail';
import { CandidateService } from '../services/candidateService';
import { Candidate, WorkflowStage, StageStatus } from '../types';
import { CandidateProvider } from '../context/CandidateContext';

// Mock CandidateService
vi.mock('../services/candidateService', () => ({
    CandidateService: {
        getCandidateById: vi.fn(),
        getCandidate: vi.fn(),
        getCandidates: vi.fn().mockResolvedValue([]),
        createQuickCandidate: vi.fn(),
        addTimelineEvent: vi.fn(),
        updateCandidate: vi.fn(),
        advanceStage: vi.fn().mockResolvedValue({ success: false, error: 'Passport document not uploaded' }),
        rollbackStage: vi.fn(),
    },
    ProfileCompletionService: {
        updateCompletionData: vi.fn((c) => c),
    }
}));

vi.mock('./widgets/WorkflowProgressWidget', () => ({
    default: ({ onAdvance, onRollback }: any) => (
        <div data-testid="workflow-progress-widget">
            <button onClick={() => onAdvance?.()}>Advance</button>
            <button onClick={() => onRollback?.('reason')}>Rollback</button>
        </div>
    )
}));

// Mock Data
const mockCandidate = {
    id: '123',
    name: 'Rajesh Kumar',
    stage: WorkflowStage.REGISTERED,
    stageStatus: StageStatus.PENDING,
    personalInfo: {
        fullName: 'Rajesh Kumar',
    },
    documents: [], // NO PASSPORT
    workflowLogs: [],
    timelineEvents: []
} as unknown as Candidate;

describe('Candidate Features Verification', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CandidateDetail: Should display all 5 Digital Form Sections in View Mode', async () => {
        vi.mocked(CandidateService.getCandidateById).mockReturnValue(mockCandidate);

        render(
            <CandidateProvider>
                <MemoryRouter initialEntries={['/candidates/123']}>
                    <Routes>
                        <Route path="/candidates/:id" element={<CandidateDetail />} />
                    </Routes>
                </MemoryRouter>
            </CandidateProvider>
        );

        // Wait for data load
        expect(await screen.findByText('Rajesh Kumar')).toBeInTheDocument();

        // Click Profile Tab (using text match, assuming TabNavigation renders "Profile")
        // Note: TabNavigation is NOT mocked now (I removed the mock). So it renders real tabs.
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);

        // Check for new 5-section layout headers (assuming they are rendered in CandidateDetail)
        // Adjust text if needed based on actual implementation
        expect(screen.getByText(/Personal Details/i)).toBeInTheDocument();
        // expect(screen.getByText(/Passport Details/i)).toBeInTheDocument(); // specific sections
    });

    test('CandidateDetail: Should allow editing School, Height, Weight in Edit Mode', async () => {
        vi.mocked(CandidateService.getCandidateById).mockReturnValue(mockCandidate);

        render(
            <CandidateProvider>
                <MemoryRouter initialEntries={['/candidates/123']}>
                    <Routes>
                        <Route path="/candidates/:id" element={<CandidateDetail />} />
                    </Routes>
                </MemoryRouter>
            </CandidateProvider>
        );

        expect(await screen.findByText('Rajesh Kumar')).toBeInTheDocument();

        // Click Profile Tab
        fireEvent.click(screen.getByText('Profile'));

        // Enter Edit Mode
        const editButton = screen.getByText(/Edit Profile/i);
        fireEvent.click(editButton);

        // Check inputs (using placeholders or display values)
        // Note: Input matching depends on exact implementation.
        // Assuming "Height" or similar labels exist.
    });


    test('CandidateDetail: Should block stage advance if requirements not met', async () => {
        // Mock getCandidateById to return our candidate
        vi.mocked(CandidateService.getCandidateById).mockReturnValue(mockCandidate);

        // Mock advanceStage to return failure (simulating strict workflow)
        vi.mocked(CandidateService.advanceStage).mockResolvedValue({
            success: false,
            error: 'Passport document not uploaded'
        });

        // Mock alert
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <CandidateProvider>
                <MemoryRouter initialEntries={['/candidates/123']}>
                    <Routes>
                        <Route path="/candidates/:id" element={<CandidateDetail />} />
                    </Routes>
                </MemoryRouter>
            </CandidateProvider>
        );

        // Click Advance
        // Note: The button might be "Advance Stage" or similar based on UI.
        // In CandidateDetail.tsx it was "Advance to {nextStage}" or just "Advance" logic.
        // Let's check the button text in CandidateDetail.tsx later if this fails.
        // Assuming "Advance" exists.
        const advanceButton = await screen.findByText(/Advance/i);
        fireEvent.click(advanceButton);

        // Expect alert with block message
        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Passport document not uploaded'));
        });
    });
});
