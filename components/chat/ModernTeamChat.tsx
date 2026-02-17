import React, { useState } from 'react';
import { ChatProvider, useChat } from '../../context/ChatContext';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatInfoPanel } from './ChatInfoPanel';

const ChatLayoutInner: React.FC = () => {
    const { isMobileSidebarOpen } = useChat();
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="h-[calc(100vh-4rem)] flex bg-[#F0F2F5] overflow-hidden relative">
            <ChatSidebar />

            <div className={`
                ${!isMobileSidebarOpen ? 'flex' : 'hidden md:flex'}
                flex-1 flex flex-col bg-white overflow-hidden relative
            `}>
                <ChatHeader onToggleInfo={() => setShowInfo(!showInfo)} />
                <ChatMessageList />
                <ChatInput />
            </div>

            {showInfo && <ChatInfoPanel onClose={() => setShowInfo(false)} />}
        </div>
    );
};

export const ModernTeamChat: React.FC = () => {
    return (
        <ChatProvider>
            <ChatLayoutInner />
        </ChatProvider>
    );
};

export default ModernTeamChat;
