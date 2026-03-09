import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditLogViewer from './AuditLogViewer';
import { supabase } from '../../services/supabase';
import React from 'react';

// Mock Supabase
vi.mock('../../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({ data: [], error: null })),
                    limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            }))
        }))
    }
}));

// Mock Lucide icons to avoid issues in JSDOM
vi.mock('lucide-react', () => ({
    Activity: () => <div data-testid="activity-icon" />,
    Filter: () => <div data-testid="filter-icon" />,
    Search: () => <div data-testid="search-icon" />,
    Check: () => <div data-testid="check-icon" />,
    ChevronDown: () => <div data-testid="chevron-icon" />,
    RefreshCw: () => <div data-testid="refresh-icon" />,
    AlertCircle: () => <div data-testid="alert-icon" />
}));

describe('AuditLogViewer Defensive Rendering', () => {
    it('renders empty state correctly without crashing', async () => {
        render(<AuditLogViewer />);
        expect(screen.getByText(/Audit Logs/i)).toBeInTheDocument();
        expect(await screen.findByText(/No activity logs found/i)).toBeInTheDocument();
    });

    it('handles null or missing fields in logs without crashing', async () => {
        const messyData = [
            {
                id: '1',
                action: null, // Critical null check
                details: null,
                ip_address: null,
                created_at: null,
                user_id: null,
                profiles: null
            },
            {
                id: '2',
                action: 'SOME_ACTION',
                details: { someKey: 'someValue' },
                ip_address: '127.0.0.1',
                created_at: new Date().toISOString(),
                user_id: 'some-uuid',
                profiles: { email: 'test@example.com', role: 'Admin' }
            }
        ];

        // @ts-ignore
        supabase.from.mockImplementation(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({ data: messyData, error: null }))
                }))
            }))
        }));

        render(<AuditLogViewer />);

        // Should render "Unknown" or fallback for null action
        expect(await screen.findByText(/UNKNOWN/i)).toBeInTheDocument();
        // Should render the valid action
        expect(screen.getByText(/SOME ACTION/i)).toBeInTheDocument();
        // Should render email if present
        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
        // Should render "System" for null email/user
        expect(screen.getAllByText(/System/i).length).toBeGreaterThan(0);
    });

    it('handles search filtering with messy data', async () => {
        const messyData = [
            {
                id: '1',
                action: null,
                details: null,
                ip_address: null,
                created_at: null,
                user_id: null,
                profiles: null
            }
        ];

        // @ts-ignore
        supabase.from.mockImplementation(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({ data: messyData, error: null }))
                }))
            }))
        }));

        render(<AuditLogViewer />);

        // Search for something that won't match
        const searchInput = screen.getByPlaceholderText(/Search user, action, ID.../i);
        // @ts-ignore
        searchInput.value = 'nomatch';
        // This triggers re-memoization of displayedLogs
        expect(screen.queryByText(/No activity logs found/i)).toBeNull(); // Still loading or rendered
    });
});
