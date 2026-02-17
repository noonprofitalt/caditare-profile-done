import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { User, Smile, Image as ImageIcon, FileText, ExternalLink, Download, X, Maximize2, FileDigit, FileSpreadsheet } from 'lucide-react';
import { ChatAttachment, MessageReaction, ChatMessage } from '../../types';

export const ChatMessageList: React.FC = () => {
    const { messages, addReaction, removeReaction } = useChat();
    const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Group messages by date
    const groupedMessages: { date: string, msgs: ChatMessage[] }[] = [];
    messages.forEach((msg: ChatMessage) => {
        const date = new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        const lastGroup = groupedMessages[groupedMessages.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.msgs.push(msg);
        } else {
            groupedMessages.push({ date, msgs: [msg] });
        }
    });

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-0">
                <div className="pb-4">
                    {groupedMessages.length > 0 ? groupedMessages.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            {/* Date Divider */}
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <span className="relative bg-slate-50 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {group.date}
                                </span>
                            </div>

                            {/* Messages in this date */}
                            {group.msgs.map((msg: ChatMessage, idx: number) => {
                                const isMe = msg.isMe;
                                const prevMsg = idx > 0 ? group.msgs[idx - 1] : null;
                                const isSequence = prevMsg && prevMsg.senderId === msg.senderId && !prevMsg.isSystem && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 300000); // 5 mins
                                const isSystem = msg.isSystem;

                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center py-2 mb-2">
                                            <span className="bg-slate-100/80 px-3 py-1 rounded text-xs text-slate-500 font-medium">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-0.5' : 'mt-4'}`}>

                                        {/* Avatar Column (Only show for first in sequence, or placeholder for spacing) */}
                                        <div className="w-8 shrink-0 flex flex-col items-center">
                                            {!isSequence && !isMe ? (
                                                msg.senderAvatar ?
                                                    <img src={msg.senderAvatar} className="w-8 h-8 rounded-lg object-cover bg-slate-200 shadow-sm" alt={msg.senderName} /> :
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        {msg.senderName.charAt(0)}
                                                    </div>
                                            ) : (!isMe && <div className="w-8" />)}
                                        </div>

                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {!isSequence && !isMe && (
                                                <div className="flex items-baseline gap-2 mb-1 ml-0.5">
                                                    <span className="text-xs font-bold text-slate-700 hover:underline cursor-pointer">{msg.senderName}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}

                                            <div className={`relative px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe
                                                ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm'
                                                : 'bg-white text-slate-700 border border-slate-200/50 rounded-2xl rounded-tl-sm'
                                                }`}>

                                                {/* Attachments rendering */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mb-2 space-y-2">
                                                        {msg.attachments.map((att: ChatAttachment) => (
                                                            <div key={att.id} className="rounded-lg overflow-hidden border border-slate-200/50 bg-slate-50/30">
                                                                {(att.type === 'image' || att.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name)) ? (
                                                                    <div className="relative group/img cursor-pointer" onClick={() => setPreviewAttachment(att)}>
                                                                        <img src={att.url} alt={att.name} className="max-h-60 w-auto object-cover hover:opacity-95 transition-opacity" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                                                                            <Maximize2 size={24} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => setPreviewAttachment(att)}
                                                                        className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-slate-100/50 transition-colors group/att-card"
                                                                    >
                                                                        <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                                                            {att.name.endsWith('.pdf') ? <FileText size={18} /> :
                                                                                att.name.endsWith('.xlsx') || att.name.endsWith('.csv') ? <FileSpreadsheet size={18} /> :
                                                                                    <FileDigit size={18} />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-xs font-semibold text-slate-700 truncate">{att.name}</div>
                                                                            <div className="text-[10px] text-slate-400 capitalize">
                                                                                {att.size} • {att.mimeType && att.mimeType.includes('/') ? att.mimeType.split('/')[1] : att.name.split('.').pop() || 'file'}
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-2 opacity-0 group-hover/att-card:opacity-100 rounded transition-colors text-slate-400 hover:text-indigo-500">
                                                                            <Maximize2 size={14} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                                                <div className="flex items-center justify-between mt-1 gap-4">
                                                    {/* Reactions Display */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {msg.reactions && msg.reactions.map((reaction: MessageReaction) => {
                                                            const hasLiked = reaction.users.find((u: any) => u.id === 'current-user');
                                                            return (
                                                                <button
                                                                    key={reaction.emoji}
                                                                    onClick={() => hasLiked ? removeReaction(msg.id, reaction.emoji) : addReaction(msg.id, reaction.emoji)}
                                                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border ${hasLiked
                                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold'
                                                                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                                        }`}
                                                                >
                                                                    <span>{reaction.emoji}</span>
                                                                    <span>{reaction.count}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <span className={`text-[9px] ${isMe ? 'text-slate-400' : 'text-slate-300'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Quick Action Bar (Floating on hover) */}
                                                <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 rounded-lg shadow-sm p-1 z-10 whitespace-nowrap`}>
                                                    <button
                                                        onClick={() => addReaction(msg.id, '✅')}
                                                        className="p-1 hover:bg-slate-50 rounded text-xs grayscale hover:grayscale-0 transition-all" title="Approve">✅</button>
                                                    <button
                                                        onClick={() => addReaction(msg.id, '🎉')}
                                                        className="p-1 hover:bg-slate-50 rounded text-xs grayscale hover:grayscale-0 transition-all" title="Celebrate">🎉</button>
                                                    <button className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600">
                                                        <Smile size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center p-10 pt-20 text-slate-300 opacity-50">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <User size={24} />
                            </div>
                            <p className="text-sm font-medium text-slate-400">No messages yet</p>
                            <p className="text-xs mt-1">Start the conversation!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewAttachment && (
                <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 bg-slate-900/50 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                                {previewAttachment.name.endsWith('.pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-white truncate">{previewAttachment.name}</h3>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider">{previewAttachment.size} • {previewAttachment.mimeType || 'Document'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={previewAttachment.url}
                                download={previewAttachment.name}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all active:scale-95"
                            >
                                <Download size={14} /> Download
                            </a>
                            <button
                                onClick={() => setPreviewAttachment(null)}
                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-hidden p-6 flex items-center justify-center">
                        <div className="w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative group/v">
                            {((previewAttachment.name || '').toLowerCase().endsWith('.pdf') || (previewAttachment.mimeType || '').includes('pdf')) ? (
                                <object
                                    data={previewAttachment.url}
                                    type="application/pdf"
                                    className="w-full h-full border-none"
                                >
                                    <iframe
                                        src={previewAttachment.url}
                                        className="w-full h-full border-none"
                                        title={previewAttachment.name}
                                    />
                                </object>
                            ) : (previewAttachment.type === 'image' || (previewAttachment.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewAttachment.name || '')) ? (
                                <img
                                    src={previewAttachment.url}
                                    className="w-full h-full object-contain"
                                    alt={previewAttachment.name}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-12 text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <FileText size={48} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700 mb-2">No preview available</h4>
                                    <p className="text-sm max-w-xs mb-8">This file type cannot be previewed directly. Please download it to view the full content on your device.</p>
                                    <a
                                        href={previewAttachment.url}
                                        download={previewAttachment.name}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                    >
                                        <Download size={18} /> Download Now
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
