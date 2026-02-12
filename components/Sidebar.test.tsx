import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Sidebar from './Sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('Sidebar', () => {
    it('should render successfully', () => {
        const onClose = () => { };
        render(
            <BrowserRouter>
                <Sidebar isOpen={true} onClose={onClose} />
            </BrowserRouter>
        );
        // Add assertions here based on what Sidebar should verify
        // For now, checks if it doesn't crash
        expect(document.body).toBeDefined();
    });
});
