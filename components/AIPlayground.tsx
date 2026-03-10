import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, RefreshCw, Zap, ShieldCheck, TrendingUp, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { SystemSnapshot } from '../types';

const SUGGESTED_CHIPS = [
    { label: "System Health Audit", icon: <ShieldCheck size={14} /> },
    { label: "Revenue Forecast", icon: <TrendingUp size={14} /> },
    { label: "Bottleneck Analysis", icon: <AlertCircle size={14} /> },
    { label: "Staff Efficiency", icon: <User size={14} /> },
    { label: "Optimize Workflow", icon: <Zap size={14} /> }
];

const AIPlayground: React.FC<{ snapshot: SystemSnapshot | null; initialPrompt?: string }> = ({ snapshot, initialPrompt }) => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'system'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(GeminiService.hasApiKey());
    const [briefingStarted, setBriefingStarted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentStatus = GeminiService.hasApiKey();
            if (currentStatus !== hasApiKey) setHasApiKey(currentStatus);
        }, 1000);
        return () => clearInterval(interval);
    }, [hasApiKey]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = async (userMessage: string, isAuto?: boolean) => {
        if (!userMessage.trim() || isLoading) return;

        if (!isAuto) setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        const aiResponse = await GeminiService.chat(userMessage, snapshot);
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        setIsLoading(false);
    };

    useEffect(() => {
        if (initialPrompt && hasApiKey) {
            handleSend(initialPrompt, true);
        }
    }, [initialPrompt]);

    useEffect(() => {
        if (hasApiKey && !briefingStarted && messages.length === 0 && !initialPrompt) {
            setBriefingStarted(true);
            const triggerBriefing = async () => {
                setIsLoading(true);
                setMessages(prev => [...prev, { role: 'system', content: "Gathering system data..." }]);

                const briefing = await GeminiService.chat("Provide a brief, 2-3 sentence overview of the current system health, noting any major bottlenecks or financial highlights.", snapshot);
                setMessages(prev => {
                    const cleanChat = prev.filter(m => m.role !== 'system');
                    return [...cleanChat, { role: 'ai', content: briefing }];
                });
                setIsLoading(false);
            };
            triggerBriefing();
        }
    }, [hasApiKey, briefingStarted, messages.length, snapshot]);

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[500px] p-4 sm:p-8 text-center space-y-4 sm:space-y-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={32} />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-xl font-semibold text-slate-800">AI Assistant</h2>
                    <p className="text-slate-500 text-sm">
                        To use the AI Assistant, please configure your Gemini API key in the settings.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            window.location.hash = '#/settings';
                            // Dispatch custom event to tell Settings to focus AI tab
                            window.dispatchEvent(new CustomEvent('ai_config_opened'));
                        }}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 btn-touch"
                    >
                        Go to Settings
                        <ArrowRight size={16} />
                    </button>
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 btn-touch"
                    >
                        <Info size={16} />
                        Get API Key
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-10rem)] sm:h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-14rem)] min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">AI Assistant</h2>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setMessages([]);
                        setBriefingStarted(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Clear Conversation"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Clear Chat
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 scroll-smooth custom-scrollbar bg-slate-50/50 touch-pan-y">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 fade-in animate-in">
                        <Bot size={48} className="mb-4 text-slate-300" />
                        <p className="font-medium">How can I help you today?</p>

                        <div className="mt-4 sm:mt-8 flex flex-wrap justify-center gap-2 max-w-xl px-2">
                            {SUGGESTED_CHIPS.map(chip => (
                                <button
                                    key={chip.label}
                                    onClick={() => handleSend(chip.label, true)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <span className="text-slate-400">{chip.icon}</span>
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={`msg-${idx}`} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} fade-in animate-in slide-in-from-bottom-2`}>
                        {msg.role !== 'system' && (
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                                }`}>
                                {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                        )}

                        {msg.role === 'system' ? (
                            <div className="w-full flex justify-center">
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                                    {msg.content}
                                </span>
                            </div>
                        ) : (
                            <div className={`max-w-[90%] sm:max-w-[80%] px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl ${msg.role === 'ai'
                                ? 'bg-white text-slate-800 border border-slate-100 shadow-sm'
                                : 'bg-blue-600 text-white shadow-sm'
                                }`}>
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : 'prose-slate'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 fade-in animate-in">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Bot size={18} />
                        </div>
                        <div className="bg-white border border-slate-100 px-5 py-3.5 rounded-2xl shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                    className="relative flex items-center gap-2 sm:gap-3 bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 focus-within:border-blue-400 transition-colors shadow-inner"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the AI Assistant..."
                        className="flex-1 bg-transparent py-2.5 outline-none text-slate-800 text-sm placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIPlayground;