import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, X, File as FileIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatAttachment } from '../../types';

export const ChatInput: React.FC = () => {
    const { sendMessage, activeChannelId, users } = useChat();
    const [inputValue, setInputValue] = useState('');
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if ((!inputValue.trim() && attachments.length === 0) || !activeChannelId) return;
        await sendMessage(inputValue, undefined, attachments.length > 0 ? attachments : undefined);
        setInputValue('');
        setAttachments([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newAttachment: ChatAttachment = {
                    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    url: reader.result as string,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    mimeType: file.type
                };
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter((a: ChatAttachment) => a.id !== id));
    };

    const addEmoji = (emoji: string) => {
        setInputValue((prev: string) => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Mention detection
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ')) {
            const filter = textBeforeCursor.substring(lastAt + 1);
            if (!filter.includes(' ')) {
                setMentionFilter(filter);
                setShowMentionSuggestions(true);
            } else {
                setShowMentionSuggestions(false);
            }
        } else {
            setShowMentionSuggestions(false);
        }

        // Auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const insertMention = (userName: string) => {
        const lastAt = inputValue.lastIndexOf('@', textareaRef.current?.selectionStart || 0);
        if (lastAt !== -1) {
            const before = inputValue.substring(0, lastAt);
            const after = inputValue.substring(textareaRef.current?.selectionStart || 0);
            setInputValue(before + '@' + userName + ' ' + after);
        }
        setShowMentionSuggestions(false);
        textareaRef.current?.focus();
    };

    const filteredMentionUsers = users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white px-4 pb-4 pt-2 shrink-0">
            <div className="max-w-4xl mx-auto">
                <div className={`relative transition-all duration-200 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-100 focus-within:border-slate-300 ${inputValue.trim() || attachments.length > 0 ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-4 pt-3 bg-white">
                            {attachments.map((att: ChatAttachment) => (
                                <div key={att.id} className="relative group/att bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-3 pr-8 min-w-[120px]">
                                    {att.type === 'image' ? (
                                        <img src={att.url} className="w-8 h-8 rounded object-cover" alt="" />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <FileIcon size={14} />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]">{att.name}</span>
                                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{att.size}</span>
                                    </div>
                                    <button
                                        onClick={() => removeAttachment(att.id)}
                                        className="absolute top-1 right-1 p-0.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-400 hover:text-red-500 hover:border-red-100 transition-all opacity-0 group-hover/att:opacity-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        placeholder="Message..."
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="w-full pl-4 pr-12 py-3 bg-white max-h-48 min-h-[46px] text-sm text-slate-800 outline-none resize-none placeholder:text-slate-400 custom-scrollbar"
                    />

                    {/* Toolbar (Bottom) */}
                    <div className="flex items-center justify-between px-2 pb-2 bg-white">
                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                title="Attach file"
                            >
                                <Paperclip size={16} />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                title="Upload image"
                            >
                                <ImageIcon size={16} />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                    title="Emoji"
                                >
                                    <Smile size={16} />
                                </button>

                                {showEmojiPicker && (
                                    <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 grid grid-cols-6 gap-2 w-48 animate-in fade-in slide-in-from-bottom-2">
                                        {['✅', '🎉', '🔥', '🚀', '👍', '🙏', '❤️', '😂', '✨', '⭐', '🤝', '📅'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="text-lg hover:scale-125 transition-transform p-1 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-300 font-medium hidden sm:block mr-2">
                                ↵ to send
                            </span>
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() && attachments.length === 0}
                                className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${inputValue.trim() || attachments.length > 0
                                    ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800 active:scale-95'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                            >
                                <Send size={16} className={inputValue.trim() || attachments.length > 0 ? "translate-x-0.5" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Mentions Popover */}
                    {showMentionSuggestions && filteredMentionUsers.length > 0 && (
                        <div className="absolute bottom-full left-4 mb-2 z-50 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden w-64 animate-in fade-in zoom-in-95">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mention People</span>
                                <button onClick={() => setShowMentionSuggestions(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredMentionUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user.name)}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded bg-slate-200 overflow-hidden">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{user.name[0]}</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-slate-800 truncate">{user.name}</div>
                                            <div className="text-[10px] text-slate-400">{user.role}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
