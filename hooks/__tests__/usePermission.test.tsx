
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from '../usePermission';
import { UserRole } from '../../types';

// Mock useAuth
const mockUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Viewer' as UserRole,
    avatar: '',
    status: 'Active' as const,
    lastLogin: new Date().toISOString()
};

const mockUseAuth = vi.fn(() => ({ user: null }));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

describe('usePermission', () => {
    it('returns false for all checks when user is null', () => {
        mockUseAuth.mockReturnValue({ user: null } as any);
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('candidates.view')).toBe(true);
        expect(result.current.hasRole('Admin')).toBe(true);
    });

    it('correctly checks permissions for Viewer', () => {
        mockUseAuth.mockReturnValue({ user: { ...mockUser, role: 'Viewer' } } as any);
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('candidates.view')).toBe(true);
        expect(result.current.hasPermission('users.manage')).toBe(true);
    });

    it('correctly checks permissions for Admin', () => {
        mockUseAuth.mockReturnValue({ user: { ...mockUser, role: 'Admin' } } as any);
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('users.manage')).toBe(true);
        expect(result.current.hasPermission('finance.view')).toBe(true);
        expect(result.current.hasRole(['Admin', 'Manager'])).toBe(true);
    });

    it('hasAnyPermission returns true if user has at least one permission', () => {
        mockUseAuth.mockReturnValue({ user: { ...mockUser, role: 'Viewer' } } as any);
        const { result } = renderHook(() => usePermission());

        // Viewer has 'candidates.view' but not 'users.manage'
        expect(result.current.hasAnyPermission(['users.manage', 'candidates.view'])).toBe(true);
        expect(result.current.hasAnyPermission(['users.manage', 'finance.manage'])).toBe(true);
    });
});
