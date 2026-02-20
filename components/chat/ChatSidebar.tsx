import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Hash, Plus, Shield, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react';
import { ChatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

export const ChatSidebar: React.FC = () => {
    const {
        channels, users, activeChannelId, setActiveChannelId,
        isMobileSidebarOpen, createChannel, deleteChannel, searchQuery, setSearchQuery
    } = useChat();
    const { user: currentUser } = useAuth();

    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [showContactsModal, setShowContactsModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
    const [expandedSections, setExpandedSections] = useState({ channels: true, dms: true });
    const [clickedActiveId, setClickedActiveId] = useState<string | null>(null);

    const toggleSection = (section: 'channels' | 'dms') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;
        await createChannel(newChannelName, newChannelType);
        setShowNewChannelModal(false);
        setNewChannelName('');
        setNewChannelType('public');
    };

    const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Only show Users in sidebar DM list if they have an active conversation (exist in messages storage)
    // or if they are the currently active channel
    const filteredUsers = users.filter(u => {
        if (!currentUser) return false;
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
        // For now, if we are in real-time dev, maybe we show more users or just matched ones
        return matchesSearch;
    });

    return (
        <div className={`
            ${isMobileSidebarOpen ? 'flex' : 'hidden md:flex'}
            w-full md:w-64 bg-slate-50/50 border-r border-slate-200 flex-col shrink-0 z-20 absolute md:relative inset-0 md:inset-auto font-sans
        `}>
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 mt-2">
                <h2 className="font-bold text-slate-800 tracking-tight">Team Chat</h2>
                <button
                    onClick={() => setShowNewChannelModal(true)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                >
                    <Plus size={14} />
                    <span className="text-[11px] font-bold">New</span>
                </button>
            </div>

            {/* Global Search */}
            <div className="px-3 mb-2">
                <input
                    type="text"
                    placeholder="Jump to..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-200/50 border-transparent focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-500 transition-all outline-none"
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar py-2">
                {/* Channels Section */}
                <div className="space-y-0.5">
                    <button
                        onClick={() => toggleSection('channels')}
                        className="flex items-center gap-1.5 px-2 mb-1 w-full text-left group"
                    >
                        {expandedSections.channels ? <ChevronDown size={10} className="text-slate-400 group-hover:text-slate-600" /> : <ChevronRight size={10} className="text-slate-400 group-hover:text-slate-600" />}
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">Channels</span>
                    </button>

                    {expandedSections.channels && filteredChannels.map(channel => {
                        const isActive = activeChannelId === channel.id;
                        const isUnread = channel.unreadCount > 0 && !isActive;
                        const isDeletable = !['c1', 'c2', 'c3', 'c4'].includes(channel.id);

                        return (
                            <div key={channel.id} className="group relative">
                                <button
                                    onClick={() => {
                                        if (activeChannelId === channel.id) {
                                            setClickedActiveId(channel.id);
                                            setTimeout(() => setClickedActiveId(null), 400);
                                        } else {
                                            setActiveChannelId(channel.id);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all ${isActive
                                        ? `bg-white shadow-sm text-slate-900 ${clickedActiveId === channel.id ? 'animate-pulse ring-2 ring-blue-300' : ''}`
                                        : 'text-slate-600 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-500'}>
                                            {channel.type === 'private' ? <Shield size={13} /> : <Hash size={13} />}
                                        </span>
                                        <span className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium'}`}>
                                            {channel.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isUnread && (
                                            <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-slate-800 text-white text-[9px] rounded-full font-bold">
                                                {channel.unreadCount}
                                            </span>
                                        )}
                                        {isDeletable && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Delete channel #${channel.name}?`)) {
                                                        deleteChannel(channel.id);
                                                    }
                                                }}
                                                className="opacity-20 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-500 transition-all pointer-events-auto"
                                                title="Delete Channel"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Direct Messages Section */}
                <div className="space-y-0.5">
                    <div className="flex items-center justify-between px-2 mb-1 group">
                        <button
                            onClick={() => toggleSection('dms')}
                            className="flex items-center gap-1.5 text-left"
                        >
                            {expandedSections.dms ? <ChevronDown size={10} className="text-slate-400 group-hover:text-slate-600" /> : <ChevronRight size={10} className="text-slate-400 group-hover:text-slate-600" />}
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">Direct Messages</span>
                        </button>
                        <button
                            onClick={() => setShowContactsModal(true)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 opacity-40 hover:opacity-100 transition-all font-bold flex items-center gap-1"
                            title="Add Contact"
                        >
                            <Plus size={12} />
                            <span className="text-[10px]">Add</span>
                        </button>
                    </div>

                    {expandedSections.dms && filteredUsers.filter(u => u.id !== currentUser?.id).map(user => {
                        const dmId = ChatService.getDmChannelId(user.id, currentUser?.id || '');
                        const isActive = activeChannelId === dmId;
                        return (
                            <button
                                key={user.id}
                                onClick={() => setActiveChannelId(dmId)}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group ${isActive ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative">
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">{user.name[0]}</div>}
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-emerald-500' :
                                            user.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'
                                            }`} />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 flex items-center justify-between group/dm-info">
                                    <span className={`text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                                        {user.name}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Clear all messages and close chat with ${user.name}?`)) {
                                                deleteChannel(ChatService.getDmChannelId(user.id));
                                            }
                                        }}
                                        className="opacity-20 group-hover/dm-info:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-500 transition-all"
                                        title="Delete Chat"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Create Channel Modal */}
            {showNewChannelModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-slate-200">
                        <div className="p-5">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Create a new channel</h3>
                            <form onSubmit={handleCreateChannel} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Channel Name</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            {newChannelType === 'public' ? <Hash size={14} /> : <Shield size={14} />}
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            required
                                            placeholder="e.g. marketing-team"
                                            value={newChannelName}
                                            onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Channel Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewChannelType('public')}
                                            className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${newChannelType === 'public' ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                                                <Hash size={12} /> Public
                                            </span>
                                            <span className="text-[10px] text-slate-500 leading-tight">Anyone in the team can join.</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewChannelType('private')}
                                            className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${newChannelType === 'private' ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                                                <Shield size={12} /> Private
                                            </span>
                                            <span className="text-[10px] text-slate-500 leading-tight">Only invited members can join.</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewChannelModal(false)}
                                        className="flex-1 py-2.5 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-transform active:scale-[0.98]"
                                    >
                                        Create Channel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Contacts Directory Modal */}
            {showContactsModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">System Directory</h3>
                                <p className="text-[11px] text-slate-500 font-medium">Add people to your direct messages</p>
                            </div>
                            <button
                                onClick={() => setShowContactsModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search in Modal */}
                        <div className="p-4 border-b border-slate-50">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by name or role..."
                                className="w-full px-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 rounded-xl text-sm transition-all outline-none"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Contacts List */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                            {users.filter(u => u.id !== currentUser?.id && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role?.toLowerCase().includes(searchQuery.toLowerCase()))).map(user => {
                                const dmId = ChatService.getDmChannelId(user.id, currentUser?.id || '');
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            setActiveChannelId(dmId);
                                            setShowContactsModal(false);
                                            setSearchQuery('');
                                        }}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-indigo-50/50 rounded-xl group transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden relative shadow-sm group-hover:scale-105 transition-transform">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-emerald-500' : user.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="text-sm font-bold text-slate-800 tracking-tight">{user.name}</div>
                                            <div className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wider">{user.role}</div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-md transition-all">
                                            Message
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
