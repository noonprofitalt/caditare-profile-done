import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, User, Hash, Search, MoreVertical, MessageSquare,
  Smile, Plus, Bell, X, Shield, Settings as SettingsIcon,
  Search as SearchIcon, Users, Info, Paperclip,
  ChevronDown, Filter, CheckCircle2, Circle
} from 'lucide-react';
import { ChatService } from '../services/chatService';
import { ChatChannel, ChatMessage, ChatUser } from '../types';

const TeamChat: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('c1');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'channels' | 'dms'>('all');
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

  const refreshData = () => {
    setChannels(ChatService.getChannels());
    setUsers(ChatService.getUsers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      setMessages(ChatService.getMessages(activeChannelId));
    }
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();

    const matchedChannels = channels.filter(c => c.name.toLowerCase().includes(q));
    const matchedUsers = users.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));

    if (filterType === 'channels') return { channels: matchedChannels, users: [] };
    if (filterType === 'dms') return { channels: [], users: matchedUsers };

    return { channels: matchedChannels, users: matchedUsers };
  }, [channels, users, searchQuery, filterType]);

  const handleSend = () => {
    if (!inputValue.trim() || !activeChannelId) return;

    ChatService.sendMessage(activeChannelId, inputValue);
    setMessages(ChatService.getMessages(activeChannelId));
    setInputValue('');
    setIsTyping(false);
  };

  const currentChatInfo = useMemo(() => {
    return ChatService.getChannelDisplay(activeChannelId, users);
  }, [activeChannelId, users]);

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const created = ChatService.createChannel(newChannelName, newChannelType);
    setActiveChannelId(created.id);
    refreshData();
    setShowNewChannelModal(false);
    setNewChannelName('');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-[#F0F2F5] overflow-hidden">
      {/* --- LIGHT MINIMAL SIDEBAR --- */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
            <button
              onClick={() => setShowNewChannelModal(true)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-600"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Clean Search */}
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Simple Filter Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(['all', 'channels', 'dms'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${filterType === t
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          {/* Channels Section */}
          {(filterType === 'all' || filterType === 'channels') && (
            <div className="mb-4">
              <div className="px-4 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channels</span>
              </div>
              {filteredItems.channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${activeChannelId === channel.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeChannelId === channel.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      {channel.type === 'private' ? <Shield size={16} /> : <Hash size={16} />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold truncate max-w-[140px] leading-tight">{channel.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">Active now</p>
                    </div>
                  </div>
                  {channel.unreadCount && channel.unreadCount > 0 && activeChannelId !== channel.id && (
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-[10px] rounded-full font-black shadow-lg shadow-blue-200">{channel.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Users Section */}
          {(filterType === 'all' || filterType === 'dms') && (
            <div>
              <div className="px-4 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Messages</span>
              </div>
              {filteredItems.users.map(user => {
                const dmId = ChatService.getDmChannelId(user.id);
                const isActive = activeChannelId === dmId;
                return (
                  <button
                    key={user.id}
                    onClick={() => setActiveChannelId(dmId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-slate-100 transition-all" alt={user.name} />
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-emerald-500' :
                          user.status === 'busy' ? 'bg-red-500' :
                            'bg-slate-300'
                        }`} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{user.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom User Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-blue-200">YOU</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Administrator</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <p className="text-[10px] text-slate-500 font-medium">Online</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all shadow-sm">
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CHAT INTERFACE --- */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* Modern Header */}
        <header className="h-[72px] border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentChatInfo.avatar ? (
                <img src={currentChatInfo.avatar} className="w-11 h-11 rounded-2xl shadow-sm object-cover" />
              ) : (
                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-200">
                  <Hash size={24} />
                </div>
              )}
              {currentChatInfo.isUser && (
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${currentChatInfo.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-900 text-base">{currentChatInfo.name}</h1>
                <Circle size={4} className="fill-slate-300 text-slate-300" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{currentChatInfo.isUser ? 'Private' : 'Channel'}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentChatInfo.isUser ? 'Member of Caditare Executive Team' : 'General company announcements and chatter...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex p-1 bg-slate-100 rounded-xl mr-2">
              <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm">
                <Users size={18} />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm">
                <SearchIcon size={18} />
              </button>
            </div>
            <button
              onClick={() => setShowChannelInfo(!showChannelInfo)}
              className={`p-2.5 rounded-xl transition-all ${showChannelInfo ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Info size={20} />
            </button>
          </div>
        </header>

        {/* Message Region */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar p-8">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Thread Start Indicator */}
            <div className="flex flex-col items-center justify-center space-y-4 py-6 border-b border-slate-50">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <MessageSquare size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-900">Start of conversation</p>
                <p className="text-xs text-slate-500">Messages are secure and internal to Caditare</p>
              </div>
            </div>

            {/* Render Messages Grouped by Time/Sender */}
            <div className="space-y-6">
              {messages.length > 0 ? messages.map((msg, idx) => {
                const isMe = msg.isMe;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isSystem = msg.isSystem;
                const showSender = !prevMsg || prevMsg.senderId !== msg.senderId || (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000);

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center py-2">
                      <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} ${!showSender ? 'mt-[-1.25rem]' : ''}`}>
                    <div className={`w-10 h-10 shrink-0 ${!showSender ? 'opacity-0' : ''}`}>
                      {isMe ? (
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 shadow-md shadow-blue-100 flex items-center justify-center text-white font-black text-[10px]">YOU</div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 shadow-sm flex items-center justify-center overflow-hidden border border-slate-200">
                          {currentChatInfo.isUser ? <img src={currentChatInfo.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                        </div>
                      )}
                    </div>

                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showSender && (
                        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-black text-slate-800">{msg.senderName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      <div className={`relative px-5 py-3.5 text-sm leading-relaxed ${isMe
                          ? 'bg-blue-600 text-white rounded-[1.5rem] rounded-tr-[0.25rem] shadow-lg shadow-blue-100'
                          : 'bg-[#F3F4F6] text-slate-700 rounded-[1.5rem] rounded-tl-[0.25rem]'
                        }`}>
                        {msg.text}

                        {/* Reaction Mock (Subtle Micro UI) */}
                        {idx === 0 && !isMe && (
                          <div className="absolute -bottom-2 -right-2 flex gap-1">
                            <span className="bg-white border border-slate-100 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">🔥 2</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-40">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-100">
                    <MessageSquare size={48} />
                  </div>
                  <p className="mt-4 font-bold uppercase tracking-[0.2em] text-xs">No messages yet</p>
                </div>
              )}

              {isTyping && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Dock */}
        <div className="px-8 pb-8 pt-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 focus-within:shadow-[0_15px_50px_rgba(59,130,246,0.1)] transition-all duration-300">
              <div className="flex items-center gap-2">
                <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder={`Message ${currentChatInfo.name}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
                />
                <div className="flex items-center gap-1">
                  <button className="hidden sm:flex p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all">
                    <Smile size={20} />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className={`p-3 rounded-full transition-all active:scale-95 ${inputValue.trim()
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                  >
                    <Send size={20} className={inputValue.trim() ? "translate-x-0.5" : ""} />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center px-4">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <Circle size={4} className="fill-emerald-500 text-emerald-500" /> End-to-end encrypted
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Press Enter to send</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- INFOBAR (Toggled) --- */}
      {showChannelInfo && (
        <div className="w-80 bg-white border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 ease-out z-30">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Information</h3>
            <button onClick={() => setShowChannelInfo(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 shadow-inner flex items-center justify-center overflow-hidden border-4 border-white ring-1 ring-slate-100">
                {currentChatInfo.avatar ? <img src={currentChatInfo.avatar} className="w-full h-full object-cover" /> : <Hash size={40} className="text-slate-300" />}
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 leading-tight">{currentChatInfo.name}</h4>
                <p className="text-sm text-slate-400 font-medium">Caditare Official Hub</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</span>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group border border-slate-100">
                    <User size={18} className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Profile</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group border border-slate-100">
                    <Bell size={18} className="text-slate-400 group-hover:text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Mute</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shared Media</span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
                <button className="w-full py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-all">View all shared files</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW CHANNEL MODAL --- */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Create Channel</h3>
              <button
                onClick={() => setShowNewChannelModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    autoFocus
                    type="text"
                    required
                    placeholder="marketing-team"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Privacy Level</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewChannelType('public')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${newChannelType === 'public'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-lg shadow-blue-100'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <Users size={24} />
                    <span className="text-xs font-black uppercase tracking-wider">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChannelType('private')}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${newChannelType === 'private'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-700 shadow-lg shadow-amber-100'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <Shield size={24} />
                    <span className="text-xs font-black uppercase tracking-wider">Private</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(false)}
                  className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;
