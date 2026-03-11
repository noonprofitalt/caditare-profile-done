import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Permission, ROLE_PERMISSIONS, UserRole } from '../types';

export const usePermission = () => {
    const { user } = useAuth();

    /**
     * Check if the current user has the specified permission
     */
    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!user || !user.role) return false;
        const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
        return permissions.includes(permission);
    }, [user?.role]);

    /**
     * Check if the current user has ANY of the specified permissions
     */
    const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
        if (!user || !user.role) return false;
        const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
        return permissions.some(p => userPermissions.includes(p));
    }, [user?.role]);

    /**
     * Check if the current user has ALL of the specified permissions
     */
    const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
        if (!user || !user.role) return false;
        const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
        return permissions.every(p => userPermissions.includes(p));
    }, [user?.role]);

    /**
     * Check if the user's role matches one of the allowed roles
     */
    const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
        if (!user || !user.role) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role as UserRole);
    }, [user?.role]);

    return {
        user,
        role: user?.role,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole
    };
};
