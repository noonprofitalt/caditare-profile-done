import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import PartnerManager from './PartnerManager';
import { PartnerService } from '../services/partnerService';
import { DemandOrderService } from '../services/demandOrderService';
import { SelectionService } from '../services/selectionService';
import { JobService } from '../services/jobService';
import { CandidateService } from '../services/candidateService';
import { EmployerStatus } from '../types';
import { AuthContext } from '../context/AuthContext';

// Mock all services
vi.mock('../services/partnerService');
vi.mock('../services/demandOrderService');
vi.mock('../services/selectionService');
vi.mock('../services/jobService');
vi.mock('../services/candidateService');

// Mock Auth context
const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Admin'
};

const renderWithContext = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <AuthContext.Provider value={{
                user: mockUser as any,
                isAuthenticated: true,
                isLoading: false,
                login: vi.fn(),
                logout: vi.fn(),
                updateUser: vi.fn(),
            }}>
                {ui}
            </AuthContext.Provider>
        </MemoryRouter>
    );
};

describe('PartnerManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock returns
        (PartnerService.getEmployers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'emp-1',
                companyName: 'Test Corp',
                status: EmployerStatus.ACTIVE,
                documents: [],
                activityLog: []
            }
        ]);
        (DemandOrderService.getByEmployerId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (JobService.getJobs as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ jobs: [], count: 0 });
        (SelectionService.getByDemandOrderId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (CandidateService.getCandidates as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });

    it('renders the CRM layout with partners', async () => {
        renderWithContext(<PartnerManager />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Test Corp')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /Add New Partner/i })).toBeInTheDocument();
    });

    it('allows opening the add partner modal', async () => {
        renderWithContext(<PartnerManager />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Add New Partner/i })).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: /Add New Partner/i });
        fireEvent.click(addButton);

        expect(screen.getByRole('heading', { name: /Add New Partner/i })).toBeInTheDocument();
    });

    it('handles partner selection', async () => {
        renderWithContext(<PartnerManager />);

        await waitFor(() => {
            expect(screen.getByText('Test Corp')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Test Corp'));

        await waitFor(() => {
            expect(screen.getByText('Create Demand Order')).toBeInTheDocument();
        });
    });
});
