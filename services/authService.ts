import { supabase, getUserProfile } from './supabase';
import { User, UserRole } from '../types';

export class AuthService {
    static async login(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error('Login failed: No user returned');
        }

        // Fetch profile to get name and role
        const profile = await getUserProfile(data.user.id);

        return {
            id: data.user.id,
            email: data.user.email || '',
            name: profile?.full_name || email.split('@')[0],
            role: (profile?.role || 'Viewer') as UserRole,
            avatar: profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User'),
            status: profile?.status || 'Active',
            lastLogin: new Date().toISOString()
        };
    }

    static async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('globalworkforce_auth_user'); // Clean up old legacy key if exists
    }

    static async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        try {
            const profile = await getUserProfile(user.id);
            return {
                id: user.id,
                email: user.email || '',
                name: profile?.full_name || user.email?.split('@')[0] || 'User',
                role: (profile?.role || 'Viewer') as UserRole,
                avatar: profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User'),
                status: profile?.status || 'Active',
                lastLogin: new Date().toISOString()
            };
        } catch (e) {
            console.error('Error fetching user profile', e);
            return null; // Handle detached users gracefully
        }
    }

}
