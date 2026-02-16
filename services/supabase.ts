import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Assuming types might be generated later, or we use 'any' for now

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        // Squelch error if just not logged in
        return null;
    }
    return user;
}

// Helper function to get user profile with role
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

// Helper function to check if user has required role
export async function hasRole(requiredRole: 'Admin' | 'Recruiter' | 'Viewer') {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const profile = await getUserProfile(user.id);
        if (!profile) return false;

        const roleHierarchy = {
            'Admin': 3,
            'Recruiter': 2,
            'Viewer': 1
        };

        const userRoleLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole];

        return userRoleLevel >= requiredRoleLevel;
    } catch (error) {
        console.error('Error checking role:', error);
        return false;
    }
}

