import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from '../useMediaQuery';

// Test component wrapper
function TestComponent({ query }: { query: string }) {
    const matches = useMediaQuery(query);
    return <div>{matches ? 'matches' : 'no match'}</div>;
}

function ResponsiveTestComponent() {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const isDesktop = useIsDesktop();

    return (
        <div>
            <div data-testid="mobile">{isMobile ? 'mobile' : 'not mobile'}</div>
            <div data-testid="tablet">{isTablet ? 'tablet' : 'not tablet'}</div>
            <div data-testid="desktop">{isDesktop ? 'desktop' : 'not desktop'}</div>
        </div>
    );
}

describe('useMediaQuery Hook', () => {
    beforeEach(() => {
        // Reset window.matchMedia mock
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    it('should return false when media query does not match', () => {
        render(<TestComponent query="(min-width: 1024px)" />);
        expect(screen.getByText('no match')).toBeInTheDocument();
    });

    it('should return true when media query matches', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<TestComponent query="(min-width: 1024px)" />);
        expect(screen.getByText('matches')).toBeInTheDocument();
    });

    it('should handle mobile breakpoint', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query.includes('max-width: 639px'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<ResponsiveTestComponent />);
        expect(screen.getByTestId('mobile')).toHaveTextContent('mobile');
    });

    it('should handle tablet breakpoint', () => {
        window.matchMedia = vi.fn().mockImplementation(query => {
            if (query.includes('min-width: 640px') && query.includes('max-width: 1023px')) {
                return {
                    matches: true,
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                };
            }
            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            };
        });

        render(<ResponsiveTestComponent />);
        expect(screen.getByTestId('tablet')).toHaveTextContent('tablet');
    });

    it('should handle desktop breakpoint', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query.includes('min-width: 1024px'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<ResponsiveTestComponent />);
        expect(screen.getByTestId('desktop')).toHaveTextContent('desktop');
    });
});
