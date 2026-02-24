'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createTriageWebSocket } from '@/lib/api';

export default function PortalPage() {
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<{ role: string; text: string }[]>([
        { role: 'system', text: '🩺 Namaste! I am your AuraTriage AI assistant. Describe any symptoms (Hindi/Hinglish OK) and our medical AI swarm will analyze them for you.' },
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatLog]);

    const handleSend = () => {
        if (!message.trim() || isProcessing) return;

        setChatLog(prev => [...prev, { role: 'user', text: message }]);
        setIsProcessing(true);

        const patientId = 'P001';

        try {
            if (wsRef.current) wsRef.current.close();

            const ws = createTriageWebSocket(
                patientId,
                (data: any) => {
                    if (data.type === 'agent_thinking') {
                        setChatLog(prev => [...prev, {
                            role: 'system',
                            text: `⏳ ${data.agent} is analyzing...`
                        }]);
                    } else if (data.type === 'agent_result') {
                        setChatLog(prev => {
                            const filtered = prev.filter(m => m.text !== `⏳ ${data.agent} is analyzing...`);
                            return [...filtered, {
                                role: 'agent',
                                text: `**${data.agent}**\n${data.content?.substring(0, 300)}${(data.content?.length || 0) > 300 ? '...' : ''}`
                            }];
                        });
                    } else if (data.type === 'triage_complete') {
                        setChatLog(prev => [...prev, {
                            role: 'summary',
                            text: data.summary
                        }]);
                        setIsProcessing(false);
                        ws.close();
                    } else if (data.type === 'error') {
                        setChatLog(prev => [...prev, {
                            role: 'system',
                            text: `⚠️ Error: ${data.message}`
                        }]);
                        setIsProcessing(false);
                        ws.close();
                    }
                },
                () => setIsProcessing(false),
                () => setIsProcessing(false)
            );

            ws.onopen = () => {
                ws.send(JSON.stringify({ symptoms: message }));
            };

            wsRef.current = ws;
        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }

        setMessage('');
    };

    return (
        <div className="min-h-screen bg-[#08090e] text-zinc-100">
            <header className="border-b border-white/[0.04] bg-[#0a0c12]">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-xl font-semibold text-white">AuraTriage Patient Portal</h1>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">AI-Powered Health Assistant • Hinglish Supported</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-mono text-emerald-400">Swarm Active</span>
                        </div>
                        <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Home</a>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                    <h2 className="font-display text-sm font-semibold text-white mb-1">Consult the AI Swarm</h2>
                    <p className="text-[11px] text-zinc-500 mb-4">
                        Describe your symptoms below. Our 4-agent AI medical team will analyze them and give you a detailed report.
                    </p>

                    <div ref={scrollRef} className="h-[500px] overflow-y-auto mb-4 space-y-3 pr-2 font-mono text-[12px]">
                        {chatLog.map((entry, i) => (
                            <div key={i} className={`flex gap-2.5 ${entry.role === 'user' ? 'justify-end' : ''}`}>
                                {entry.role !== 'user' && (
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${entry.role === 'summary' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                            entry.role === 'agent' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                                'bg-gradient-to-br from-teal-400 to-violet-500'
                                        }`}>
                                        {entry.role === 'summary' ? '📋' : entry.role === 'agent' ? '🤖' : 'AT'}
                                    </div>
                                )}
                                <div className={`flex-1 max-w-[85%] p-3 rounded-xl whitespace-pre-wrap leading-relaxed ${entry.role === 'user'
                                        ? 'bg-teal-500/10 border border-teal-500/20 text-teal-200'
                                        : entry.role === 'summary'
                                            ? 'bg-amber-500/5 border border-amber-500/20 text-zinc-200'
                                            : entry.role === 'agent'
                                                ? 'bg-white/[0.03] border border-white/[0.06] text-zinc-400'
                                                : 'bg-white/[0.03] border border-white/[0.04] text-zinc-300'
                                    }`}>
                                    {entry.role === 'summary' && (
                                        <p className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-2">📋 EXECUTIVE CLINICAL SUMMARY</p>
                                    )}
                                    <p className="text-[12px] leading-relaxed">{entry.text}</p>
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    AT
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                                    <motion.p
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="text-[12px] text-amber-400"
                                    >
                                        Multi-agent swarm deliberating...
                                    </motion.p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Describe your symptoms... (Hinglish OK — e.g. 'seene mein dard, bukhar 3 din se')"
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] transition-colors font-mono"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isProcessing || !message.trim()}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white text-xs font-semibold hover:from-teal-400 hover:to-teal-300 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                        >
                            {isProcessing ? 'Analyzing...' : 'Send'}
                        </button>
                    </div>
                    <p className="text-[9px] font-mono text-zinc-700 mt-2 text-center">
                        Powered by DeepSeek R1 + Gemini Flash + Llama 3.3 70B via OpenRouter
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
