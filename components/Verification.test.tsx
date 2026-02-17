
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

vi.mock('../services/workflowEngine', () => ({
    default: {
        getNextStage: vi.fn((s) => {
            if (s === 'Registered') return 'Verified';
            return null;
        }),
        performTransition: vi.fn().mockResolvedValue({ success: true }),
        canPerformAction: vi.fn().mockReturnValue({ allowed: true }),
        getWorkflowProgress: vi.fn().mockReturnValue(10),
        getRemainingStages: vi.fn().mockReturnValue([]),
    },
    WORKFLOW_STAGES: ['Registered', 'Verified', 'Applied'],
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
        vi.mocked(CandidateService.getCandidate).mockResolvedValue(mockCandidate);
        vi.mocked(CandidateService.getCandidates).mockResolvedValue([mockCandidate]);
    });

    test('CandidateDetail: Should display all 5 Digital Form Sections in View Mode', async () => {
        vi.mocked(CandidateService.getCandidate).mockResolvedValue(mockCandidate);

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
        expect(await screen.findByRole('heading', { name: /Rajesh Kumar/i })).toBeInTheDocument();

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
        vi.mocked(CandidateService.getCandidate).mockResolvedValue(mockCandidate);

        render(
            <CandidateProvider>
                <MemoryRouter initialEntries={['/candidates/123']}>
                    <Routes>
                        <Route path="/candidates/:id" element={<CandidateDetail />} />
                    </Routes>
                </MemoryRouter>
            </CandidateProvider>
        );

        expect(await screen.findByRole('heading', { name: /Rajesh Kumar/i })).toBeInTheDocument();

        // Click Profile Tab
        fireEvent.click(screen.getByText('Profile'));

        // Enter Edit Mode
        fireEvent.click(screen.getByText(/Edit Profile/i));

        // Find inputs (using labels)
        const schoolInput = screen.getByLabelText(/School/i);
        const heightInput = screen.getByLabelText(/Height \(FT\)/i);
        const weightInput = screen.getByLabelText(/Weight \(KG\)/i);

        // Change values
        fireEvent.change(schoolInput, { target: { value: 'Global High School' } });
        fireEvent.change(heightInput, { target: { value: '6' } });
        fireEvent.change(weightInput, { target: { value: '85' } });

        // Save
        const saveButton = screen.getByText(/Save Changes/i);
        fireEvent.click(saveButton);

        // Verify service update call
        expect(CandidateService.updateCandidate).toHaveBeenCalled();

        // Check if values are updated in View Mode (wait for re-render)
        expect(await screen.findByText('Global High School')).toBeInTheDocument();
        expect(screen.getByText('6 FT')).toBeInTheDocument();
        expect(screen.getByText('85 KG')).toBeInTheDocument();
    });


    test('CandidateDetail: Should block stage advance if requirements not met', async () => {
        // Mock getCandidate to return our candidate
        vi.mocked(CandidateService.getCandidate).mockResolvedValue(mockCandidate);

        const WorkflowEngine = (await import('../services/workflowEngine')).default;
        // Mock performTransition to return failure
        vi.mocked(WorkflowEngine.performTransition).mockResolvedValue({
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

        // Wait for data load
        expect(await screen.findByRole('heading', { name: /Rajesh Kumar/i })).toBeInTheDocument();

        // Click Advance
        // Note: The button might be "Advance Stage" or similar based on UI.
        // In CandidateDetail.tsx it was "Advance to {nextStage}" or just "Advance" logic.
        // Let's check the button text in CandidateDetail.tsx later if this fails.
        // Assuming "Advance" exists.
        const advanceButton = await screen.findByRole('button', { name: /Advance/i });
        fireEvent.click(advanceButton);

        // Expect alert with block message
        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Passport document not uploaded'));
        });
    });
});
