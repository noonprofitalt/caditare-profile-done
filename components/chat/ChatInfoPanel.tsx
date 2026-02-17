import React from 'react';
import { X, Hash, User, Bell } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatService } from '../../services/chatService';

export const ChatInfoPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeChannelId, users } = useChat();

    const currentChatInfo = React.useMemo(() => {
        if (!activeChannelId) return null;
        return ChatService.getChannelDisplay(activeChannelId, users);
    }, [activeChannelId, users]);

    if (!currentChatInfo) return null;

    return (
        <div className="fixed md:relative inset-0 md:inset-auto md:w-64 bg-slate-50 border-l border-slate-200 flex flex-col z-40">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <span className="font-semibold text-slate-800">Details</span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-4 text-slate-300">
                    <Hash size={32} />
                </div>
                <h3 className="font-semibold text-slate-900">{currentChatInfo.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Topic: General Description</p>

                <div className="mt-8 w-full space-y-2">
                    <button className="w-full py-2 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        Mute Channel
                    </button>
                    <button className="w-full py-2 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        View Members
                    </button>
                </div>
            </div>
        </div>
    );
};
