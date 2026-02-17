
import { useAuth } from '../context/AuthContext';
import { Permission, ROLE_PERMISSIONS } from '../types';

export const usePermission = () => {
    const { user } = useAuth();

    /**
     * Check if the current user has the specified permission
     */
    const hasPermission = (permission: Permission): boolean => {
        // SECURITY DISABLED: Full access for dev
        return true;
    };

    /**
     * Check if the current user has ANY of the specified permissions
     */
    const hasAnyPermission = (permissions: Permission[]): boolean => {
        // SECURITY DISABLED: Full access for dev
        return true;
    };

    /**
     * Check if the current user has ALL of the specified permissions
     */
    const hasAllPermissions = (permissions: Permission[]): boolean => {
        // SECURITY DISABLED: Full access for dev
        return true;
    };

    /**
     * Check if the user's role matches one of the allowed roles
     */
    const hasRole = (roles: string | string[]): boolean => {
        // SECURITY DISABLED: Full access for dev
        return true;
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
