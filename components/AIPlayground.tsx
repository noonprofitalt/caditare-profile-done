import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Bot, User, RefreshCw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const AIPlayground: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
        { role: 'ai', content: "Hello! I'm your GlobalWorkforce Intelligence Assistant. How can I help you analyze your candidates or optimize your workflow today?" }
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        const aiResponse = await GeminiService.chat(userMessage);
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        setIsLoading(false);
    };

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-8 text-center space-y-6">
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="text-blue-600" /> Intelligence Playground
                    </h2>
                    <p className="text-sm text-slate-500">Ask questions about your data or get recruitment advice.</p>
                </div>
                <button
                    onClick={() => setMessages([{ role: 'ai', content: "Hello! I'm your GlobalWorkforce Intelligence Assistant. How can I help you analyze your candidates or optimize your workflow today?" }])}
                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg"
                    title="Clear Chat"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={`msg-${msg.role}-${msg.content.substring(0, 20)}-${idx}`} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.role === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'ai' ? 'bg-slate-50 text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                            <div className="prose prose-sm prose-slate max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 animate-pulse">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <RefreshCw size={18} className="text-blue-400 animate-spin" />
                        </div>
                        <div className="bg-slate-50 h-10 w-32 rounded-2xl rounded-tl-none"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default AIPlayground;