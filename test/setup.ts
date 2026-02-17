import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollIntoView
window.Element.prototype.scrollIntoView = vi.fn();
