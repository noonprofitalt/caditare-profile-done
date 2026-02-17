import React from 'react';
import { Users, Info, Search as SearchIcon, Hash, Star } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatService } from '../../services/chatService';

export const ChatHeader: React.FC<{ onToggleInfo: () => void }> = ({ onToggleInfo }) => {
    const { activeChannelId, users, toggleMobileSidebar, isMobileSidebarOpen } = useChat();

    const currentChatInfo = React.useMemo(() => {
        if (!activeChannelId) return null;
        return ChatService.getChannelDisplay(activeChannelId, users);
    }, [activeChannelId, users]);

    if (!currentChatInfo) return null;

    return (
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
            <div className="flex items-center gap-3">
                {/* Back Button on Mobile */}
                <button
                    onClick={toggleMobileSidebar}
                    className={`md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-all ${isMobileSidebarOpen ? 'hidden' : 'block'}`}
                >
                    <Users size={20} />
                </button>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-base">
                            <Hash size={16} className="text-slate-400" />
                            {currentChatInfo.name}
                        </div>
                        <button className="text-slate-300 hover:text-yellow-400 transition-colors">
                            <Star size={14} />
                        </button>
                    </div>

                    {currentChatInfo.isUser ? (
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${currentChatInfo.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-xs text-slate-500 font-medium capitalize">{currentChatInfo.status || 'Offline'}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                            Team discussion for {currentChatInfo.name}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden md:flex -space-x-2 mr-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-7 h-7 rounded-full border-2 border-white bg-slate-${i}00 flex items-center justify-center text-[10px] bg-slate-100 text-slate-500 font-bold`}>
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">+</div>
                </div>

                <div className="h-6 w-px bg-slate-100 mx-2 hidden md:block"></div>

                <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all" title="Search messages">
                    <SearchIcon size={18} />
                </button>
                <button
                    onClick={onToggleInfo}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                    title="Channel details"
                >
                    <Info size={18} />
                </button>
            </div>
        </header>
    );
};
