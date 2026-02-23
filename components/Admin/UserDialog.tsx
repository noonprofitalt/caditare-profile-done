
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { X, Save, User as UserIcon, Mail } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface UserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    onSave: () => void;
}

const UserDialog: React.FC<UserDialogProps> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'Viewer' as UserRole,
        status: 'Active' as 'Active' | 'Inactive' | 'Pending',
        password: '' // Only for new users
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status as 'Active' | 'Inactive' | 'Pending',
                password: ''
            });
        } else {
            setFormData({
                email: '',
                name: '',
                role: 'Viewer',
                status: 'Active',
                password: ''
            });
        }
        setError(null);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (user) {
                // Update existing user profile
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.name,
                        role: formData.role,
                        status: formData.status
                    })
                    .eq('id', user.id);

                if (updateError) throw updateError;
            } else {
                // Create new user via Edge Function
                const { data, error: createError } = await supabase.functions.invoke('create-user', {
                    body: {
                        email: formData.email,
                        password: formData.password || 'TemporaryPass123!', // Default fallback if empty
                        name: formData.name,
                        role: formData.role,
                        status: formData.status
                    }
                });

                if (createError) throw new Error(createError.message || 'Failed to create user via Edge Function');
                if (data?.error) throw new Error(data.error);

            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">
                        {user ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                disabled={!!user} // Cannot change email easily without auth re-verification
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="Viewer">Viewer</option>
                                <option value="Recruiter">Recruiter</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                                <option value="Finance">Finance</option>
                                <option value="Compliance">Compliance</option>
                                <option value="Operations">Operations</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' | 'Pending' })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    Save User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDialog;
