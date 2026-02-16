import React, { useEffect, useState } from 'react';
import { User, Shield, Check, Users } from 'lucide-react';
import { ChannelMember } from '../../types';

interface MentionAutocompleteProps {
    members: ChannelMember[];
    query: string;
    onSelect: (userName: string) => void;
    onClose: () => void;
    style?: React.CSSProperties;
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
    members,
    query,
    onSelect,
    onClose,
    style
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Extract unique roles from members and filter based on query
    const roles = Array.from(new Set(members.map(m => m.role)))
        .filter(role => role && role.toLowerCase().includes(query.toLowerCase()))
        .map(role => ({ type: 'role' as const, name: role, id: `role-${role}` }));

    const filteredMembers = members
        .filter(member => member.userName.toLowerCase().includes(query.toLowerCase()))
        .map(member => ({ type: 'user' as const, name: member.userName, id: member.userId, avatar: member.userAvatar, role: member.role }));

    const suggestions = [...roles, ...filteredMembers];

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (suggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                onSelect(suggestions[selectedIndex].name);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, selectedIndex, onSelect, onClose]);

    if (suggestions.length === 0) return null;

    return (
        <div
            className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
            style={style}
        >
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 text-xs font-medium text-slate-500">
                Mention user or role
            </div>
            <div className="max-h-48 overflow-y-auto">
                {suggestions.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item.name)}
                        className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                    >
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.type === 'user' ? (
                                item.avatar ? (
                                    <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} className="text-slate-400" />
                                )
                            ) : (
                                <Users size={14} className="text-indigo-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate text-sm">
                                    {item.name}
                                    {item.type === 'role' && ' (Role)'}
                                </span>
                                {item.type === 'user' && (
                                    <>
                                        {item.role === 'owner' && <Shield size={12} className="text-amber-500" />}
                                        {item.role === 'admin' && <Shield size={12} className="text-blue-500" />}
                                    </>
                                )}
                            </div>
                        </div>
                        {index === selectedIndex && <Check size={14} className="text-blue-600" />}
                    </button>
                ))}
            </div>
        </div>
    );
};
