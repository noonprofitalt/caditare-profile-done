import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Hash, Search, MoreVertical, Phone, Video } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Channel {
  id: string;
  name: string;
  unread: number;
}

const CHANNELS: Channel[] = [
  { id: '1', name: 'general', unread: 0 },
  { id: '2', name: 'visa-processing', unread: 3 },
  { id: '3', name: 'recruitment-uae', unread: 0 },
  { id: '4', name: 'medical-approvals', unread: 5 },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'Sarah Connor', avatar: 'https://picsum.photos/32/32?random=5', text: 'Has the medical report for Ahmed arrived?', time: '10:30 AM', isMe: false },
  { id: '2', sender: 'Me', avatar: '', text: 'Checking the system now. Looks like it is pending.', time: '10:32 AM', isMe: true },
  { id: '3', sender: 'John Smith', avatar: 'https://picsum.photos/32/32?random=6', text: 'We need to expedite the visa for Maria. The employer is asking.', time: '10:45 AM', isMe: false },
];

const TeamChat: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState('visa-processing');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'Me',
      avatar: '',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    
    setMessages([...messages, newMsg]);
    setInputValue('');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Sidebar List */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search teams or messages..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Channels</h3>
            <div className="space-y-1">
              {CHANNELS.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeChannel === channel.name ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <div className="flex items-center gap-2">
                    <Hash size={16} className={activeChannel === channel.name ? 'text-blue-500' : 'text-slate-400'} />
                    <span>{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{channel.unread}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Direct Messages</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">
                <div className="relative">
                  <img src="https://picsum.photos/32/32?random=5" className="w-6 h-6 rounded-full" alt="User" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                </div>
                <span>Sarah Connor</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">
                <div className="relative">
                   <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">JS</div>
                   <span className="absolute bottom-0 right-0 w-2 h-2 bg-slate-300 rounded-full border border-white"></span>
                </div>
                <span>John Smith</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-2">
            <Hash size={20} className="text-slate-400" />
            <h3 className="font-bold text-slate-800 text-lg">{activeChannel}</h3>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
             <Phone size={20} className="hover:text-slate-600 cursor-pointer" />
             <Video size={20} className="hover:text-slate-600 cursor-pointer" />
             <MoreVertical size={20} className="hover:text-slate-600 cursor-pointer" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
              {!msg.isMe && (
                <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full object-cover" />
              )}
              <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-700">{msg.sender}</span>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <div className={`p-4 rounded-2xl text-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
             <input 
               type="text" 
               className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-slate-800"
               placeholder={`Message #${activeChannel}...`}
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button 
               onClick={handleSend}
               disabled={!inputValue.trim()}
               className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Send size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;