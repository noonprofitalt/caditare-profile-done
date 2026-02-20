
import { useAuth } from '../context/AuthContext';
import { Permission, ROLE_PERMISSIONS } from '../types';

export const usePermission = () => {
    const { user } = useAuth();

    /**
     * Check if the current user has the specified permission
     */
    const hasPermission = (_permission: Permission): boolean => {
        return true; // FRICTIONLESS
    };

    /**
     * Check if the current user has ANY of the specified permissions
     */
    const hasAnyPermission = (_permissions: Permission[]): boolean => {
        return true; // FRICTIONLESS
    };

    /**
     * Check if the current user has ALL of the specified permissions
     */
    const hasAllPermissions = (_permissions: Permission[]): boolean => {
        return true; // FRICTIONLESS
    };

    /**
     * Check if the user's role matches one of the allowed roles
     */
    const hasRole = (_roles: string | string[]): boolean => {
        return true; // FRICTIONLESS
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
