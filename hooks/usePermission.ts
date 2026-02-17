
import { useAuth } from '../context/AuthContext';
import { Permission, ROLE_PERMISSIONS } from '../types';

export const usePermission = () => {
    const { user } = useAuth();

    /**
     * Check if the current user has the specified permission
     */
    const hasPermission = (permission: Permission): boolean => {
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(permission);
    };

    /**
     * Check if the current user has ANY of the specified permissions
     */
    const hasAnyPermission = (permissions: Permission[]): boolean => {
        if (!user) return false;
        return permissions.some(p => hasPermission(p));
    };

    /**
     * Check if the current user has ALL of the specified permissions
     */
    const hasAllPermissions = (permissions: Permission[]): boolean => {
        if (!user) return false;
        return permissions.every(p => hasPermission(p));
    };

    /**
     * Check if the user's role matches one of the allowed roles
     */
    const hasRole = (roles: string | string[]): boolean => {
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    };

    return {
        user,
        role: user?.role,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole
    };
};
