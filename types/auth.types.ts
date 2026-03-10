/**
 * Authentication & Security Types
 */

export type UserRole = 'Admin' | 'Recruiter' | 'Viewer' | 'Manager' | 'Finance' | 'Compliance' | 'Operations' | 'HR';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
    status: 'Active' | 'Inactive' | 'Pending';
    lastLogin?: string;
    createdAt?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export type Permission =
    | 'candidates.view'
    | 'candidates.edit'
    | 'candidates.delete'
    | 'finance.view'
    | 'finance.edit'
    | 'finance.manage'
    | 'reports.view'
    | 'users.manage'
    | 'chat.view';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    'Admin': ['candidates.view', 'candidates.edit', 'candidates.delete', 'finance.view', 'finance.edit', 'reports.view', 'users.manage', 'chat.view'],
    'Recruiter': ['candidates.view', 'candidates.edit', 'reports.view', 'chat.view'],
    'Viewer': ['candidates.view', 'candidates.edit', 'reports.view', 'chat.view'],
    'Manager': ['candidates.view', 'candidates.edit', 'reports.view', 'chat.view'],
    'Finance': ['finance.view', 'finance.edit', 'reports.view', 'chat.view'],
    'Compliance': ['candidates.view', 'reports.view', 'chat.view'],
    'Operations': ['candidates.view', 'reports.view', 'chat.view'],
    'HR': ['candidates.view', 'candidates.edit', 'finance.view', 'reports.view', 'users.manage', 'chat.view']
};
