import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { AuthService } from '../services/authService';
import { AuditService } from '../services/auditService';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    React.useEffect(() => {
        const initAuth = async () => {
            console.log('[Auth] Initializing authentication...');
            try {
                // Check Supabase for existing session
                const user = await AuthService.getCurrentUser();

                if (user) {
                    AuditService.setCurrentUser(user.id);
                    setState({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error('[Auth] Initialization error:', error);
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const user = await AuthService.login(email, password);
            AuditService.setCurrentUser(user.id);
            setState({ user, isAuthenticated: true, isLoading: false });
            AuditService.log('USER_LOGIN', { email: user.email }, user.id);
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = async () => {
        if (state.user) {
            AuditService.log('USER_LOGOUT', { email: state.user.email }, state.user.id);
        }
        await AuthService.logout();
        AuditService.setCurrentUser(null);
        setState({ user: null, isAuthenticated: false, isLoading: false });
    };

    const updateUser = (user: User) => {
        setState(prev => ({ ...prev, user }));
    };

    // Auto-Session Timeout (Idle Security) - 2 Hours
    React.useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

        const handleActivity = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (state.isAuthenticated) {
                timeoutId = setTimeout(() => {
                    console.log('[Auth] Session timed out due to inactivity.');
                    logout();
                    // Hard redirect to clear any sensitive states safely
                    window.location.href = '/login';
                }, TWO_HOURS_MS);
            }
        };

        if (state.isAuthenticated) {
            handleActivity(); // Start timer initially
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [state.isAuthenticated]);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

 
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
