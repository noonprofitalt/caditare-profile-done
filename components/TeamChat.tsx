import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Hash, Search, MoreVertical, MessageSquare, Smile, Mic, Phone, Video, Plus, Bell, X, Shield, Settings as SettingsIcon } from 'lucide-react';
import { ChatService } from '../services/chatService';
import { ChatChannel, ChatMessage, ChatUser } from '../types';

const TeamChat: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('c1'); // Default to General
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Creation/Edit State
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    setChannels(ChatService.getChannels());
    setUsers(ChatService.getUsers());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(ChatService.getMessages(activeChannelId));
    }
  }, [activeChannelId]);

  const handleCreateOrUpdateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    if (editingChannelId) {
      ChatService.updateChannel(editingChannelId, { name: newChannelName, type: newChannelType });
    } else {
      const created = ChatService.createChannel(newChannelName, newChannelType);
      setActiveChannelId(created.id);
    }

    refreshData();
    closeModal();
  };

  const handleDeleteChannel = (channelId: string) => {
    if (window.confirm('Are you sure you want to delete this channel? All messages will be lost.')) {
      if (ChatService.deleteChannel(channelId)) {
        if (activeChannelId === channelId) {
          setActiveChannelId('c1');
        }
        refreshData();
      } else {
        alert('This channel cannot be deleted.');
      }
    }
  };

  const openEditModal = (channel: ChatChannel) => {
    setEditingChannelId(channel.id);
    setNewChannelName(channel.name);
    setNewChannelType(channel.type);
    setShowNewChannelModal(true);
  };

  const closeModal = () => {
    setShowNewChannelModal(false);
    setEditingChannelId(null);
    setNewChannelName('');
    setNewChannelType('public');
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() || !activeChannelId) return;

    ChatService.sendMessage(activeChannelId, inputValue);
    setMessages(ChatService.getMessages(activeChannelId)); // Refresh immediately
    setInputValue('');
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  };

  const displayInfo = ChatService.getChannelDisplay(activeChannelId, users);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-300">
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg tracking-tight">Caditare Corp</h2>
            <div className="p-2 hover:bg-slate-800 rounded-full cursor-pointer transition-colors">
              <Bell size={18} className="text-slate-400" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border-transparent focus:bg-slate-700 border focus:border-blue-500 rounded-lg text-xs transition-all outline-none text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 group">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Channels</h3>
              <button
                onClick={() => setShowNewChannelModal(true)}
                className="text-slate-500 hover:text-white transition-colors"
                title="Create Channel"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map(channel => (
                <div key={channel.id} className="group/item relative">
                  <button
                    onClick={() => setActiveChannelId(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm font-medium ${activeChannelId === channel.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash size={14} className={activeChannelId === channel.id ? 'text-blue-200' : 'text-slate-600'} />
                      <span className="truncate max-w-[120px]">{channel.name}</span>
                    </div>
                    {channel.unreadCount && channel.unreadCount > 0 && activeChannelId !== channel.id && (
                      <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full font-bold">{channel.unreadCount}</span>
                    )}
                  </button>

                  {/* Hover Actions */}
                  {!['c1', 'c2', 'c3', 'c4'].includes(channel.id) && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(channel); }}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Edit Settings"
                      >
                        <SettingsIcon size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }}
                        className="p-1 hover:bg-red-600/20 rounded text-slate-400 hover:text-red-400"
                        title="Delete Channel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 group">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Direct Messages</h3>
              <button className="text-slate-500 hover:text-white transition-colors" title="Start New Chat"><Plus size={14} /></button>
            </div>
            <div className="space-y-0.5">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setActiveChannelId(ChatService.getDmChannelId(user.id))}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${activeChannelId === ChatService.getDmChannelId(user.id) ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <div className="relative shrink-0">
                    <img src={user.avatar} className="w-6 h-6 rounded-lg object-cover bg-slate-700" alt={user.name} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${user.status === 'online' ? 'bg-emerald-500' : user.status === 'busy' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                  </div>
                  <span className="truncate">{user.name}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-600 italic text-center">No users found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {displayInfo.isUser ? (
              <div className="relative">
                <img src={displayInfo.avatar} className="w-9 h-9 rounded-xl shadow-sm object-cover" />
                <span className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${displayInfo.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </div>
            ) : (
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <Hash size={20} />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {displayInfo.name}
              </h3>
              {displayInfo.isUser ? (
                <p className="text-xs text-slate-500 font-medium capitalize">{displayInfo.status}</p>
              ) : (
                <p className="text-xs text-slate-400">Company-wide announcements and general chatter</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Phone size={18} /></button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><Video size={18} /></button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-2 py-8 opacity-50">
            <span className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
          </div>

          {messages.length > 0 ? messages.map((msg, idx) => {
            const isMe = msg.isMe;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${!showAvatar ? 'mt-[-1rem]' : ''}`}>
                <div className={`w-9 h-9 shrink-0 flex items-start justify-center ${!showAvatar ? 'opacity-0' : ''}`}>
                  {isMe ? (
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">ME</div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                      {/* Ideally lookup user avatar here, using placeholder for now if not DM */}
                      {displayInfo.isUser ? <img src={displayInfo.avatar} className="w-full h-full object-cover" /> : <User size={16} />}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-700">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isMe
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={40} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-600">No Messages Yet</p>
                <p className="text-xs">Be the first to say hello!</p>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Plus size={18} /></button>
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder={`Message ${displayInfo.name}...`}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                autoFocus
              />
              <div className="flex items-center gap-1 pr-1">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"><Smile size={18} /></button>
                {!inputValue.trim() ? (
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                    <Mic size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <p className="text-[10px] text-slate-400 font-medium">Use <span className="font-bold text-slate-500">Ctrl + Enter</span> to send</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">{editingChannelId ? 'Channel Settings' : 'Create New Channel'}</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateChannel} className="p-6 space-y-6">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. general-chatter"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Names must be lowercase with no spaces.</p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3">Visibility</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewChannelType('public')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${newChannelType === 'public' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-lg ${newChannelType === 'public' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Hash size={20} />
                    </div>
                    <span className="text-sm font-bold">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChannelType('private')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${newChannelType === 'private' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-lg ${newChannelType === 'private' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Shield size={20} />
                    </div>
                    <span className="text-sm font-bold">Private</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  {editingChannelId ? 'Save Changes' : 'Create Channel'}
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