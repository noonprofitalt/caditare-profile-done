import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { AuthService } from '../services/authService';

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
            console.log('[Auth] Initializing auth state...');
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => {
                    console.warn('[Auth] Authentication initialization timed out after 5 seconds.');
                    reject(new Error('Auth Timeout'));
                }, 5000)
            );

            try {
                console.log('[Auth] Attempting to get current user...');
                const userPromise = AuthService.getCurrentUser();
                const user = await Promise.race([userPromise, timeoutPromise]) as User | null;

                console.log('[Auth] Initialization complete. User:', user?.email || 'Guest');
                setState({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                });
            } catch (error) {
                console.error('[Auth] Initialization error or timeout:', error);
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
            setState({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = async () => {
        await AuthService.logout();
        setState({ user: null, isAuthenticated: false, isLoading: false });
    };

    const updateUser = (user: User) => {
        setState(prev => ({ ...prev, user }));
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
