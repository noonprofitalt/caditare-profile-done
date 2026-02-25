import { supabase } from './supabase';
import { User, UserRole } from '../types';
import { AuditService } from './auditService';

export class UserService {

    // Fetch all users from the 'profiles' table
    static async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data.map((profile: any) => ({
            id: profile.id,
            name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
            email: profile.email,
            role: profile.role as UserRole,
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}`,
            lastLogin: profile.last_login || profile.created_at,
            status: profile.status // Assuming 'status' field exists in profile based on script analysis
        }));
    }

    // Create a new user via Edge Function
    static async createUser(user: Partial<User> & { password?: string }): Promise<void> {
        const { error } = await supabase.functions.invoke('create-user', {
            body: {
                email: user.email,
                password: user.password || 'temp1234', // Default temp password if not provided
                name: user.name,
                role: user.role,
                status: 'Active'
            }
        });

        if (error) {
            console.error('Error creating user:', error);
            throw error;
        }

        AuditService.log('SYSTEM_USER_CREATED', {
            newUserEmail: user.email,
            newUserRole: user.role,
            newUserName: user.name
        });
    }

    // Delete a user via Edge Function
    static async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { userId }
        });

        if (error) {
            console.error('Error deleting user:', error);
            throw error;
        }

        AuditService.log('SYSTEM_USER_DELETED', {
            deletedUserId: userId
        });
    }

    // Update user profile (role, status, etc.) - Direct DB update as Admin
    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: updates.name,
                role: updates.role,
                // status: updates.status // specific field if we track it in types
            })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        AuditService.log('SYSTEM_USER_UPDATED', {
            targetUserId: userId,
            updates: updates
        });
    }
}
