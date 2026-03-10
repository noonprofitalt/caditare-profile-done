import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import DocumentManager from '../../components/DocumentManager';
import { CandidateService } from '../../services/candidateService';
import { DocumentService } from '../../services/documentService';
import { NotificationService } from '../../services/notificationService';
import { AuthContext } from '../../context/AuthContext';
import { Candidate, DocumentStatus, DocumentCategory, DocumentType, CandidateDocument } from '../../types';

// Mock Services
vi.mock('../../services/candidateService', () => ({
    CandidateService: {
        getCandidate: vi.fn(),
        updateCandidate: vi.fn(),
    }
}));

vi.mock('../../services/documentService', () => ({
    DocumentService: {
        uploadDocument: vi.fn(),
    }
}));

vi.mock('../../services/notificationService', () => ({
    NotificationService: {
        addNotification: vi.fn(),
    }
}));

// Import needs to be faked for context, using standard vi.mock
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: { id: 'test-admin', name: 'Test Admin', role: 'Admin' } })),
    AuthProvider: ({ children }: any) => <>{children}</>,
    AuthContext: {
        Provider: ({ children }: any) => <>{children}</>
    }
}));


describe('DocumentManager Stress & Concurrency Tests', () => {
    const mockCandidate: any = {
        id: 'cand-1',
        name: 'John Doe',
        candidateCode: 'GW-2024-1234',
        regNo: 'REG-1234',
        regDate: '2024-01-01',
        email: 'john@example.com',
        phone: '1234567890',
        stage: 'REGISTERED' as any,
        stageStatus: 'PENDING' as any,
        documents: [
            {
                id: 'doc-1',
                type: DocumentType.PASSPORT,
                category: DocumentCategory.MANDATORY_REGISTRATION,
                status: DocumentStatus.PENDING,
                version: 1,
                logs: [],
                url: 'https://example.com/passport.pdf'
            },
            {
                id: 'doc-2',
                type: DocumentType.CV,
                category: DocumentCategory.MANDATORY_REGISTRATION,
                status: DocumentStatus.PENDING,
                version: 1,
                logs: [],
                url: 'https://example.com/cv.pdf'
            }
        ],
        timelineEvents: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly queue and process rapid documentation verifications without losing state', async () => {
        const onUpdateMock = vi.fn();

        render(
            <DocumentManager candidate={mockCandidate} onUpdate={onUpdateMock} />
        );

        // Initial state check - look for at least two PENDING statuses
        expect(screen.getAllByText(/PENDING/i).length).toBeGreaterThanOrEqual(2);

        // Find the "Verify" buttons
        const verifyButtons = screen.getAllByText('Verify');

        // 1. Verify First Document
        fireEvent.click(verifyButtons[0]);
        await waitFor(() => expect(screen.getByText(/Approve Document/i)).toBeTruthy());
        const approveBtn1 = screen.getByText(/Approve Document/i);
        fireEvent.click(approveBtn1);

        // The onUpdate should have been called with the first document approved
        expect(onUpdateMock).toHaveBeenCalledTimes(1);
        let updatedDocs = onUpdateMock.mock.lastCall?.[0] as CandidateDocument[];
        expect(updatedDocs.find(d => d.type === DocumentType.PASSPORT)?.status).toBe(DocumentStatus.APPROVED);

        // 2. VERY QUICKLY verify the second document (simulating before server response)
        fireEvent.click(verifyButtons[1]);
        await waitFor(() => expect(screen.getByText(/Approve Document/i)).toBeTruthy());
        const approveBtn2 = screen.getByText(/Approve Document/i);
        fireEvent.click(approveBtn2);

        // Expect onUpdate to be called a second time
        expect(onUpdateMock).toHaveBeenCalledTimes(2);

        // The SECOND onUpdate call MUST contain BOTH documents as approved
        // Because `docsRef.current` should synchronously retain the state from the first click
        let finalDocs = onUpdateMock.mock.lastCall?.[0] as CandidateDocument[];

        const passportDoc = finalDocs.find(d => d.type === DocumentType.PASSPORT);
        const cvDoc = finalDocs.find(d => d.type === DocumentType.CV);

        expect(passportDoc?.status).toBe(DocumentStatus.APPROVED);
        expect(cvDoc?.status).toBe(DocumentStatus.APPROVED);
    });
});
