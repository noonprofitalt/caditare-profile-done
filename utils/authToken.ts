/**
 * Centralized Auth Token Utility
 * 
 * All API calls that need authentication should use this utility
 * instead of directly accessing localStorage with mock fallbacks.
 */

const TOKEN_KEY = 'globalworkforce_auth_token';

/**
 * Get the current auth token for API requests.
 * Returns null if no token is available (user is not authenticated).
 */
export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get auth headers for fetch requests.
 * Throws if no token is available — caller should handle the redirect to login.
 */
export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    if (!token) {
        throw new AuthTokenError('No authentication token found. Please log in.');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Get auth headers if available, otherwise return empty headers.
 * Use this for optional-auth endpoints.
 */
export function getOptionalAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Set the auth token after login.
 */
export function setAuthToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear the auth token on logout.
 */
export function clearAuthToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Custom error class for auth token issues.
 */
export class AuthTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthTokenError';
    }
}
