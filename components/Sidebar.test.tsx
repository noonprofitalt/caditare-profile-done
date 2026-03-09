import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Sidebar from './Sidebar';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

describe('Sidebar', () => {
    it('should render successfully', () => {
        const onClose = () => { };
        render(
            <AuthContext.Provider value={{
                user: { id: 'test', name: 'Test', email: 'test@suhara.erp', role: 'Admin' as any, status: 'Active', avatar: '' },
                isAuthenticated: true,
                isLoading: false,
                login: vi.fn(),
                logout: vi.fn(),
                updateUser: vi.fn()
            }}>
                <BrowserRouter>
                    <Sidebar isOpen={true} onClose={onClose} />
                </BrowserRouter>
            </AuthContext.Provider>
        );
        // Add assertions here based on what Sidebar should verify
        // For now, checks if it doesn't crash
        expect(document.body).toBeDefined();
    });
});
