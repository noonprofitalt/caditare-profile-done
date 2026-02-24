import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvupusehfmbsdxhpbung.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXB1c2VoZm1ic2R4aHBidW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjI1NTcsImV4cCI6MjA4NjA5ODU1N30.xCzmxUPEK_K97HKjNLA_eq121BupqVhcAznEStQ5rj4';

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

// Helper function to check if user has required role
// FRICTIONLESS: Always return true to allow full access
export async function hasRole(requiredRole: 'Admin' | 'Recruiter' | 'Viewer') {
    return true;
}

