import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials missing. Check your .env file or environment settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


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

// Role hierarchy: Admin > Recruiter > Viewer
const ROLE_HIERARCHY: Record<string, number> = {
    'Admin': 3,
    'Recruiter': 2,
    'Viewer': 1,
};

// Helper function to check if current user has the required role (or higher)
export async function hasRole(requiredRole: 'Admin' | 'Recruiter' | 'Viewer'): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const profile = await getUserProfile(user.id);
        if (!profile?.role) return false;

        const userLevel = ROLE_HIERARCHY[profile.role] ?? 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

        return userLevel >= requiredLevel;
    } catch (error) {
        console.error('Error checking role:', error);
        return false;
    }
}

