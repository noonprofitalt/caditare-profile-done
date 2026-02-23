import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageCircle, Shield, X, Briefcase, UserCircle, Bell, Plus, Paperclip, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { ChatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { CandidateService } from '../services/candidateService';
import { ChatChannel, ChatMessage, Candidate, ChatMessageContext, ChatUser, ChatAttachment } from '../types';
import { useNavigate } from 'react-router-dom';

interface GlobalChatProps {
    onClose?: () => void;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<string>('c1');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [sysSearchQuery, setSysSearchQuery] = useState('');

    // Smart Context State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Candidate[]>([]);
    const [pendingContext, setPendingContext] = useState<ChatMessageContext | undefined>(undefined);

    // Channel Creation UI State
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChanName, setNewChanName] = useState('');

    const refreshData = async () => {
        const [channelsData, usersData] = await Promise.all([
            ChatService.getChannels('Admin'),
            ChatService.getUsers()
        ]);
        setChannels(channelsData);
        setUsers(usersData);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleQuickCreate = async () => {
        if (!newChanName.trim()) return;
        const created = await ChatService.createChannel(newChanName, 'public');
        await refreshData();
        setActiveChannelId(created.id);
        setNewChanName('');
        setIsCreatingChannel(false);
    };

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const fetchMessages = async () => {
            if (activeChannelId) {
                // Fetch last 50 messages to prevent lag
                const data = await ChatService.getMessages(activeChannelId, { limit: 50 });
                setMessages(data.messages);
                setPendingContext(undefined); // Reset context on channel switch

                // Subscribe to live messages
                unsubscribe = ChatService.subscribeToMessages(activeChannelId, (newMessage: ChatMessage) => {
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, {
                            ...newMessage,
                            isMe: currentUser ? newMessage.senderId === currentUser.id : false,
                        }];
                    });
                });
            }
        };
        fetchMessages();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [activeChannelId, currentUser]);

    const messagesList = React.useMemo(() => {
        if (messages.length === 0) return null;

        return messages.reduce((acc: React.ReactNode[], msg, idx, arr) => {
            const prevMsg = arr[idx - 1];
            const isSequence = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000);
            const isSystem = msg.senderName === 'System' || msg.senderName === 'System Engine' || msg.isSystem;
            const isMe = msg.isMe;

            // Date Separator
            const showDate = !prevMsg || new Date(msg.timestamp).getDate() !== new Date(prevMsg.timestamp).getDate();
            if (showDate) {
                acc.push(
                    <div key={`date-${msg.id || idx}`} className="flex justify-center my-4">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                );
            }

            acc.push(
                <div key={msg.id || idx} className={`flex flex-col ${isSystem ? 'items-center' : isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                    {/* System Message Style */}
                    {isSystem ? (
                        <div className="my-2 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-600 flex items-center gap-2 max-w-[80%]">
                            <Bell size={14} className="text-blue-500" />
                            <span>{msg.text}</span>
                            {msg.context && (
                                <button
                                    onClick={() => handleContextClick(msg.context!)}
                                    className="ml-2 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-colors uppercase tracking-wider"
                                >
                                    View {msg.context.label}
                                </button>
                            )}
                        </div>
                    ) : (
                        /* User Message Style */
                        <>
                            {!isSequence && !isMe && (
                                <span className="ml-1 mb-1 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    {msg.senderName} <span className="text-slate-300">•</span> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}

                            <div className={`px-4 py-2.5 max-w-[85%] text-sm shadow-sm leading-relaxed relative group ${isMe
                                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none'
                                }`}>

                                {/* Context Chip (if linked) */}
                                {msg.context && (
                                    <div
                                        onClick={() => handleContextClick(msg.context!)}
                                        className={`mb-2 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all flex items-center gap-1.5 w-fit ${isMe
                                            ? 'bg-blue-700/50 text-blue-100 hover:bg-blue-700'
                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                            }`}
                                    >
                                        {msg.context.type === 'CANDIDATE' && <UserCircle size={12} />}
                                        {msg.context.type === 'JOB' && <Briefcase size={12} />}
                                        Running Refcheck: {msg.context.label}
                                    </div>
                                )}

                                {msg.text}

                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {msg.attachments.map(att => (
                                            <div key={att.id}>
                                                {att.type === 'image' ? (
                                                    <img src={att.url} alt={att.name} className="max-w-xs rounded-lg border border-slate-200 shadow-sm" />
                                                ) : (
                                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                                                        <FileText size={14} className="text-blue-500 shrink-0" />
                                                        <span className="truncate font-medium">{att.name}</span>
                                                        {att.size && <span className="text-slate-400 text-[9px] ml-auto shrink-0">{att.size}</span>}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Timestamp overlay on hover */}
                                <span className={`absolute bottom-1 right-2 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            );
            return acc;
        }, []);
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Debounced Smart Input (# for Candidates)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            const lastWord = inputValue.split(' ').pop();
            if (lastWord && lastWord.startsWith('#') && lastWord.length > 1) {
                const query = lastWord.substring(1).toLowerCase();
                const allCandidates = await CandidateService.getCandidates() || [];
                const matches = allCandidates.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    (c.role && c.role.toLowerCase().includes(query))
                ).slice(0, 5);

                setSuggestions(matches);
                setShowSuggestions(matches.length > 0);
            } else {
                setShowSuggestions(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    const handleSelectCandidate = (candidate: Candidate) => {
        // Replace the #query with the candidate's name
        const words = inputValue.split(' ');
        words.pop(); // Remove the partial #tag
        const newText = words.join(' ') + ` @${candidate.name} `; // Add visual indicator

        setInputValue(newText);
        setPendingContext({
            type: 'CANDIDATE',
            id: candidate.id,
            label: candidate.name,
            metadata: { role: candidate.role }
        });
        setShowSuggestions(false);
    };

    const handleSend = async () => {
        if (!inputValue.trim() && !pendingAttachment) return;
        if (!currentUser) return;

        let attachmentData: ChatAttachment[] | undefined;
        if (pendingAttachment) {
            attachmentData = [{
                id: Date.now().toString(),
                name: pendingAttachment.name,
                url: URL.createObjectURL(pendingAttachment),
                type: pendingAttachment.type.startsWith('image/') ? 'image' : 'file',
                size: (pendingAttachment.size / 1024).toFixed(1) + ' KB'
            }];
        }

        await ChatService.sendMessage(
            activeChannelId,
            inputValue,
            currentUser.id,
            currentUser.name,
            pendingContext,
            attachmentData
        );
        const data = await ChatService.getMessages(activeChannelId, { limit: 50 });
        setMessages(data.messages);
        setInputValue('');
        setPendingContext(undefined);
        setPendingAttachment(null);
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPendingAttachment(e.target.files[0]);
        }
    };

    const handleContextClick = (context: ChatMessageContext) => {
        if (context.type === 'CANDIDATE') {
            navigate(`/candidates/${context.id}`);
            if (onClose) onClose();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Channel Selector Tabbed */}
            <div className="px-4 border-b border-slate-200 flex items-center gap-2 overflow-x-auto bg-white py-2 scrollbar-hide shadow-sm z-10">
                {channels.map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeChannelId === channel.id
                            ? 'bg-slate-800 text-white shadow-md transform scale-105'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {channel.type === 'private' && <Shield size={10} />}
                        {channel.type === 'public' && <Hash size={10} />}
                        {channel.name}
                        {channel.unreadCount && channel.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1.5 shadow-sm">{channel.unreadCount}</span>
                        )}
                    </button>
                ))}
                {/* Active DM indicator */}
                {activeChannelId.startsWith('dm-') && !channels.find(c => c.id === activeChannelId) && (
                    <button
                        className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-slate-800 text-white shadow-md transform scale-105"
                    >
                        <UserCircle size={10} />
                        {ChatService.getChannelDisplay(activeChannelId, users).name}
                    </button>
                )}
                <button
                    onClick={() => setShowUsersModal(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0"
                >
                    <MessageSquare size={12} /> Direct Message
                </button>
                <button
                    onClick={() => setIsCreatingChannel(true)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center shrink-0"
                    title="Quick New Channel"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Quick Creation Input */}
            {isCreatingChannel && (
                <div className="px-4 py-3 bg-white border-b border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="new-channel..."
                                value={newChanName}
                                onChange={(e) => setNewChanName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickCreate();
                                    if (e.key === 'Escape') setIsCreatingChannel(false);
                                }}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleQuickCreate}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-blue-100"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setIsCreatingChannel(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
                {messagesList ? (
                    messagesList
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageCircle size={32} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-600">No messages yet</p>
                            <p className="text-xs">Be the first to say hello!</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Smart Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 relative">

                {/* Pending Context Indicator */}
                {pendingContext && (
                    <div className="absolute top-0 left-4 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <span>Linking: {pendingContext.label}</span>
                        <button onClick={() => setPendingContext(undefined)} className="hover:text-blue-200"><X size={10} /></button>
                    </div>
                )}

                {/* Suggestions Popup */}
                {showSuggestions && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 z-20">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Suggest Candidate
                        </div>
                        {suggestions.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSelectCandidate(c)}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                            >
                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                    <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-[9px] text-slate-400 font-normal">{c.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {pendingAttachment && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs animate-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-2 text-blue-700">
                            {pendingAttachment.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                            <span className="font-semibold truncate max-w-[200px]">{pendingAttachment.name}</span>
                            <span className="text-blue-400 opacity-70">{(pendingAttachment.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button onClick={() => setPendingAttachment(null)} className="p-1 hover:bg-blue-100 text-blue-400 hover:text-blue-600 rounded-md transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileAttach}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                        title="Attach file"
                    >
                        <Paperclip size={16} />
                    </button>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-slate-800 placeholder:text-slate-400"
                        placeholder="Type # to tag a candidate..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() && !pendingAttachment}
                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:bg-slate-300 transform active:scale-95"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="mt-2 text-center flex items-center justify-between px-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Shield size={10} /> Internal Comms
                    </p>
                    <p className="text-[9px] text-slate-400">
                        Type <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">#</span> to tag candidates
                    </p>
                </div>
            </div>
            {/* Contacts Directory Modal */}
            {showUsersModal && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-slate-200 max-h-[90%] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">Direct Message</h3>
                                <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">Select a team member</p>
                            </div>
                            <button
                                onClick={() => setShowUsersModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search in Modal */}
                        <div className="p-4 border-b border-slate-50 shrink-0">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by name or role..."
                                className="w-full px-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 rounded-xl text-sm transition-all outline-none"
                                onChange={(e) => setSysSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Contacts List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-white">
                            {users.filter(u => u.id !== currentUser?.id && (u.name.toLowerCase().includes(sysSearchQuery.toLowerCase()) || u.role?.toLowerCase().includes(sysSearchQuery.toLowerCase()))).length === 0 ? (
                                <div className="py-8 text-center px-4">
                                    <span className="block text-2xl mb-2">😔</span>
                                    <p className="text-sm text-slate-500 font-medium">No team members matched your search.</p>
                                </div>
                            ) : (
                                users.filter(u => u.id !== currentUser?.id && (u.name.toLowerCase().includes(sysSearchQuery.toLowerCase()) || u.role?.toLowerCase().includes(sysSearchQuery.toLowerCase()))).map(user => {
                                    const dmId = ChatService.getDmChannelId(user.id, currentUser?.id || '');
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setActiveChannelId(dmId);
                                                setShowUsersModal(false);
                                                setSysSearchQuery('');
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50/60 rounded-xl group transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden relative shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-emerald-500' : user.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-800 tracking-tight truncate">{user.name}</div>
                                                <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider truncate">{user.role}</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-md transition-all shrink-0">
                                                Message
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalChat;
