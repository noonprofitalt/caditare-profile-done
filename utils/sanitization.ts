import DOMPurify from 'dompurify';

/**
 * Sanitization utilities for user-generated content
 * Prevents XSS attacks and other security vulnerabilities
 */

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Sanitize plain text message
 * Removes potentially dangerous characters while preserving formatting
 */
export function sanitizeMessage(text: string): string {
    if (!text) return '';

    // Remove null bytes
    let sanitized = text.replace(/\0/g, '');

    // Limit length
    const MAX_MESSAGE_LENGTH = 10000;
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
        sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
    }

    return sanitized.trim();
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
    if (!fileName) return 'unnamed';

    // Remove path separators and special characters
    let sanitized = fileName.replace(/[\\/*?:"<>|]/g, '_');

    // Remove leading dots
    sanitized = sanitized.replace(/^\.+/, '');

    // Limit length
    const MAX_FILENAME_LENGTH = 255;
    if (sanitized.length > MAX_FILENAME_LENGTH) {
        const ext = sanitized.split('.').pop() || '';
        const name = sanitized.substring(0, MAX_FILENAME_LENGTH - ext.length - 1);
        sanitized = `${name}.${ext}`;
    }

    return sanitized || 'unnamed';
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
        if (trimmed.startsWith(protocol)) {
            return '';
        }
    }

    // Only allow http, https, mailto
    if (!trimmed.match(/^(https?:|mailto:|\/)/)) {
        return '';
    }

    return url;
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validate and sanitize mention
 */
export function sanitizeMention(mention: string): string {
    if (!mention) return '';

    // Remove @ symbol if present
    let sanitized = mention.replace(/^@/, '');

    // Only allow alphanumeric, underscore, hyphen
    sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');

    // Limit length
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    if (!query) return '';

    // Remove special SQL characters
    let sanitized = query.replace(/[%;'"\\/]/g, '');

    // Limit length
    const MAX_QUERY_LENGTH = 200;
    if (sanitized.length > MAX_QUERY_LENGTH) {
        sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
    }

    return sanitized.trim();
}
