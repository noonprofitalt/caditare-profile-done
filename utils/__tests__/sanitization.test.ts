import { describe, it, expect } from 'vitest';
import {
    sanitizeMessage,
    sanitizeFileName,
    sanitizeUrl,
    sanitizeMention,
    isValidUUID,
    sanitizeSearchQuery,
} from '../sanitization';

describe('Sanitization Utilities', () => {
    describe('sanitizeMessage', () => {
        it('should remove null bytes', () => {
            const input = 'Hello\0World';
            const result = sanitizeMessage(input);
            expect(result).toBe('HelloWorld');
        });

        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const result = sanitizeMessage(input);
            expect(result).toBe('Hello World');
        });

        it('should limit message length', () => {
            const input = 'a'.repeat(15000);
            const result = sanitizeMessage(input);
            expect(result.length).toBeLessThanOrEqual(10000);
        });

        it('should handle empty strings', () => {
            expect(sanitizeMessage('')).toBe('');
            expect(sanitizeMessage('   ')).toBe('');
        });
    });

    describe('sanitizeFileName', () => {
        it('should remove path separators', () => {
            const input = '../../../etc/passwd';
            const result = sanitizeFileName(input);
            expect(result).not.toContain('/');
            expect(result).not.toContain('\\');
        });

        it('should remove special characters', () => {
            const input = 'file<>:"|?.txt';
            const result = sanitizeFileName(input);
            expect(result).toBe('file______.txt');
        });

        it('should remove leading dots', () => {
            const input = '...hidden.txt';
            const result = sanitizeFileName(input);
            expect(result).toBe('hidden.txt');
        });

        it('should limit filename length', () => {
            const input = 'a'.repeat(300) + '.txt';
            const result = sanitizeFileName(input);
            expect(result.length).toBeLessThanOrEqual(255);
        });

        it('should handle empty filenames', () => {
            expect(sanitizeFileName('')).toBe('unnamed');
        });
    });

    describe('sanitizeUrl', () => {
        it('should allow valid HTTP URLs', () => {
            const input = 'https://example.com';
            const result = sanitizeUrl(input);
            expect(result).toBe(input);
        });

        it('should block javascript: URLs', () => {
            const input = 'javascript:alert(1)';
            const result = sanitizeUrl(input);
            expect(result).toBe('');
        });

        it('should block data: URLs', () => {
            const input = 'data:text/html,<script>alert(1)</script>';
            const result = sanitizeUrl(input);
            expect(result).toBe('');
        });

        it('should allow mailto: URLs', () => {
            const input = 'mailto:test@example.com';
            const result = sanitizeUrl(input);
            expect(result).toBe(input);
        });

        it('should allow relative URLs', () => {
            const input = '/path/to/resource';
            const result = sanitizeUrl(input);
            expect(result).toBe(input);
        });
    });

    describe('sanitizeMention', () => {
        it('should remove @ symbol', () => {
            const input = '@username';
            const result = sanitizeMention(input);
            expect(result).toBe('username');
        });

        it('should allow alphanumeric and hyphens', () => {
            const input = 'user-name_123';
            const result = sanitizeMention(input);
            expect(result).toBe('user-name_123');
        });

        it('should remove special characters', () => {
            const input = 'user@#$%name';
            const result = sanitizeMention(input);
            expect(result).toBe('username');
        });

        it('should limit length', () => {
            const input = 'a'.repeat(100);
            const result = sanitizeMention(input);
            expect(result.length).toBe(50);
        });
    });

    describe('isValidUUID', () => {
        it('should validate correct UUIDs', () => {
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            expect(isValidUUID(validUUID)).toBe(true);
        });

        it('should reject invalid UUIDs', () => {
            expect(isValidUUID('not-a-uuid')).toBe(false);
            expect(isValidUUID('123')).toBe(false);
            expect(isValidUUID('')).toBe(false);
        });
    });

    describe('sanitizeSearchQuery', () => {
        it('should remove SQL special characters', () => {
            const input = "'; DROP TABLE users; --";
            const result = sanitizeSearchQuery(input);
            expect(result).not.toContain("'");
            expect(result).not.toContain(';');
        });

        it('should limit query length', () => {
            const input = 'a'.repeat(300);
            const result = sanitizeSearchQuery(input);
            expect(result.length).toBeLessThanOrEqual(200);
        });

        it('should trim whitespace', () => {
            const input = '  search query  ';
            const result = sanitizeSearchQuery(input);
            expect(result).toBe('search query');
        });
    });
});
