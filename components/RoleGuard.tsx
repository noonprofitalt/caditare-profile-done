
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { Permission, UserRole } from '../types';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
    children: React.ReactNode;
    roles?: UserRole[];
    permissions?: Permission[];
    fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
    children,
    roles = [],
    permissions = [],
    fallback
}) => {
    const { hasRole, hasAnyPermission, user } = usePermission();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasRequiredRole = roles.length === 0 || hasRole(roles);
    const hasRequiredPermission = permissions.length === 0 || hasAnyPermission(permissions);

    if (hasRequiredRole && hasRequiredPermission) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6 max-w-md">
                You do not have permission to access this resource. Please contact your administrator if you believe this is a mistake.
            </p>
            <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
                Go Back
            </button>
        </div>
    );
};

export default RoleGuard;
