import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageCircle, Shield, X, Briefcase, UserCircle, Bell, Plus } from 'lucide-react';
import { ChatService } from '../services/chatService';
import { CandidateService } from '../services/candidateService';
import { ChatChannel, ChatMessage, Candidate, ChatMessageContext } from '../types';
import { useNavigate } from 'react-router-dom';

interface GlobalChatProps {
    onClose?: () => void;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<string>('c1');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Smart Context State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Candidate[]>([]);
    const [pendingContext, setPendingContext] = useState<ChatMessageContext | undefined>(undefined);

    // Channel Creation UI State
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChanName, setNewChanName] = useState('');

    const refreshChannels = async () => {
        const data = await ChatService.getChannels('Admin');
        setChannels(data);
    };

    useEffect(() => {
        // Load channels with RBAC filter (mocking 'Admin' role for now)
        refreshChannels();
    }, []);

    const handleQuickCreate = async () => {
        if (!newChanName.trim()) return;
        const created = await ChatService.createChannel(newChanName, 'public');
        await refreshChannels();
        setActiveChannelId(created.id);
        setNewChanName('');
        setIsCreatingChannel(false);
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (activeChannelId) {
                // Fetch last 50 messages to prevent lag
                const data = await ChatService.getMessages(activeChannelId, { limit: 50 });
                setMessages(data.messages);
                setPendingContext(undefined); // Reset context on channel switch
            }
        };
        fetchMessages();
    }, [activeChannelId]);

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
        if (!inputValue.trim()) return;

        await ChatService.sendMessage(activeChannelId, inputValue, pendingContext);
        const data = await ChatService.getMessages(activeChannelId, { limit: 50 });
        setMessages(data.messages);
        setInputValue('');
        setPendingContext(undefined);
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
                {React.useMemo(() => (
                    messages.length > 0 ? (
                        messages.reduce((acc: React.ReactNode[], msg, idx, arr) => {
                            const prevMsg = arr[idx - 1];
                            const isSequence = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000);
                            const isSystem = msg.senderName === 'System' || msg.senderName === 'System Engine' || msg.isSystem;
                            const isMe = msg.isMe;

                            // Date Separator
                            const showDate = !prevMsg || new Date(msg.timestamp).getDate() !== new Date(prevMsg.timestamp).getDate();
                            if (showDate) {
                                acc.push(
                                    <div key={`date-${msg.id}`} className="flex justify-center my-4">
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
                        }, [])
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
                    )
                ), [messages])}
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

                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all">
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
                        disabled={!inputValue.trim()}
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
        </div>
    );
};

export default GlobalChat;
