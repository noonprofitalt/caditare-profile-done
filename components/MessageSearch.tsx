import React, { useState, useEffect, useTransition } from 'react';
import { Search, X, Calendar, Hash, User, FileText } from 'lucide-react';
import { ChatMessage, ChatChannel } from '../types';
import { formatDateTime, formatRelativeTime } from '../utils/chatUtils';

interface MessageSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onMessageClick?: (message: ChatMessage) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
    isOpen,
    onClose,
    onMessageClick,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedChannel, setSelectedChannel] = useState<string>('all');
    const [isPending, startTransition] = useTransition();

    // Mock search - replace with actual API call
    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        // TODO: Replace with actual API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Mock results
        const mockResults: ChatMessage[] = [
            {
                id: 'm1',
                channelId: 'c1',
                text: `This message contains "${query}" in the text`,
                senderId: 'u1',
                senderName: 'John Doe',
                senderAvatar: '',
                timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            },
            {
                id: 'm2',
                channelId: 'c2',
                text: `Another result with "${query}" keyword`,
                senderId: 'u2',
                senderName: 'Jane Smith',
                senderAvatar: '',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            },
        ];

        startTransition(() => {
            setSearchResults(mockResults);
            setIsSearching(false);
        });
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={onClose}
            />

            {/* Search Panel */}
            <div className="fixed left-1/2 top-20 -translate-x-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Search Input */}
                <div className="p-4 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setSelectedChannel('all')}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedChannel === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            All Channels
                        </button>
                        <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1">
                            <Calendar size={12} />
                            Date Range
                        </button>
                        <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1">
                            <User size={12} />
                            From User
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-8 text-center text-slate-400">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-sm">Searching...</p>
                        </div>
                    ) : searchQuery && searchResults.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Search size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No results found for "{searchQuery}"</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {searchResults.map((message) => (
                                <button
                                    key={message.id}
                                    onClick={() => {
                                        onMessageClick?.(message);
                                        onClose();
                                    }}
                                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {message.senderName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {message.senderName}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatRelativeTime(message.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                                {highlightText(message.text, searchQuery)}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Hash size={12} />
                                                <span>Channel Name</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            <Search size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Start typing to search messages</p>
                            <p className="text-xs mt-2">Search across all channels and conversations</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {searchResults.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                        <p className="text-xs text-slate-500">
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default MessageSearch;
