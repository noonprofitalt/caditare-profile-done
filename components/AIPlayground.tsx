import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Bot, User, RefreshCw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_CHIPS = [
    "Analyze current bottlenecks",
    "Revenue forecast for next 30 days",
    "Extract business logic for company website",
    "How many candidates are overdue?",
    "Generate recruitment workflow summary",
    "Optimize registration funnel"
];

const AIPlayground: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
        { role: 'ai', content: "Hello! I'm your GlobalWorkforce Intelligence Assistant. I have real-time access to your candidate funnel and financial data. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasApiKey] = useState(GeminiService.hasApiKey());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (userMessage: string) => {
        if (!userMessage.trim() || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        const aiResponse = await GeminiService.chat(userMessage);
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        setIsLoading(false);
    };

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-8 text-center space-y-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                <div className="bg-blue-50 p-6 rounded-full">
                    <BrainCircuit size={64} className="text-blue-600" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">AI Features are Disabled</h2>
                    <p className="text-slate-500">To unlock the Intelligence Engine and AI-powered candidate analysis, please provide your Gemini API Key in the Settings tab.</p>
                </div>
                <button
                    onClick={() => window.location.hash = '#/settings'}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                >
                    Go to Settings
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <BrainCircuit className="text-blue-600" /> Intelligence Advisor
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">Domain-aware AI with live system context.</p>
                </div>
                <button
                    onClick={() => setMessages([{ role: 'ai', content: "Hello! I'm your GlobalWorkforce Intelligence Assistant. How can I help you analyze your candidates or optimize your workflow today?" }])}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Clear Chat"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-3xl p-6 space-y-6 border border-slate-100 shadow-inner">
                {messages.map((msg, idx) => (
                    <div key={`msg-${msg.role}-${idx}`} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {msg.role === 'ai' ? <Bot size={22} /> : <User size={22} />}
                        </div>
                        <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm ${msg.role === 'ai' ? 'bg-white text-slate-800 rounded-tl-none border border-white' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                            <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center border border-blue-200">
                            <RefreshCw size={22} className="text-blue-600 animate-spin" />
                        </div>
                        <div className="bg-white/50 border border-slate-100 px-6 py-4 rounded-3xl rounded-tl-none flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="space-y-4 px-2">
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_CHIPS.map(chip => (
                        <button
                            key={chip}
                            onClick={() => handleSend(chip)}
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all shadow-sm"
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a query (e.g. 'Show me revenue trends')..."
                        className="w-full pl-6 pr-14 py-5 bg-white border-2 border-slate-200 rounded-[2rem] shadow-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-slate-300 font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:scale-105 disabled:opacity-50 disabled:bg-slate-300 disabled:scale-100 transition-all shadow-lg shadow-blue-200"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIPlayground;