import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, Shield } from 'lucide-react';
import { Candidate, CandidateComment } from '../types';
import { CandidateService } from '../services/candidateService';

interface CandidateChatProps {
    candidateId: string;
    comments: CandidateComment[];
    onCommentAdded: () => void;
}

const CandidateChat: React.FC<CandidateChatProps> = ({ candidateId, comments, onCommentAdded }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        CandidateService.addComment(candidateId, 'Admin User', inputValue, true);
        setInputValue('');
        onCommentAdded();
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                    <MessageCircle size={18} className="text-blue-600" />
                    <h3 className="font-bold">Remarks Thread</h3>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                    <Shield size={10} /> Internal Only
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {comments && comments.length > 0 ? (
                    comments.map((comment) => {
                        const isSystem = comment.author === 'System Engine' || comment.author === 'System';
                        return (
                            <div key={comment.id} className={`flex gap-3 ${isSystem ? 'opacity-70' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSystem ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'}`}>
                                    {isSystem ? <Shield size={14} /> : <User size={16} />}
                                </div>
                                <div className="space-y-1.5 max-w-[85%]">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black uppercase tracking-tight ${isSystem ? 'text-slate-400' : 'text-slate-700'}`}>
                                            {comment.author}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            {new Date(comment.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className={`p-3 text-sm shadow-sm ${isSystem
                                            ? 'bg-slate-50 border border-slate-100 rounded-lg italic text-slate-500'
                                            : 'bg-white border border-slate-200 rounded-2xl rounded-tl-none text-slate-700 leading-relaxed'
                                        }`}>
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
                        <MessageCircle size={48} className="text-slate-200" />
                        <p className="text-sm font-medium">No remarks yet.</p>
                        <p className="text-xs">Add an internal note to start the log.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-slate-800"
                        placeholder="Type an internal note..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidateChat;
