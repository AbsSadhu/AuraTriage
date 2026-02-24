'use client';

import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

const agentIcons: Record<string, string> = {
    'Chief Diagnostician': '🩺',
    'Jan Aushadhi Pharmacologist': '💊',
    'Financial Auditor & Lab Router': '₹',
    'ABHA Compliance Officer': '🛡️',
};

const agentColors: Record<string, string> = {
    'Chief Diagnostician': 'border-blue-500/30 text-blue-400',
    'Jan Aushadhi Pharmacologist': 'border-green-500/30 text-green-400',
    'Financial Auditor & Lab Router': 'border-amber-500/30 text-amber-400',
    'ABHA Compliance Officer': 'border-purple-500/30 text-purple-400',
};

export default function AgentTimeline() {
    const { agentMessages, currentRisk, nlpSymptoms, isTriaging } = useStore();

    return (
        <aside className="w-80 h-screen flex flex-col border-l border-white/[0.04] bg-[#07090d] overflow-y-auto">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h2 className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">Swarm_Timeline</h2>
                <div className="flex items-center gap-1.5">
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`w-1.5 h-1.5 rounded-full ${isTriaging ? 'bg-amber-500' : 'bg-teal-500'}`}
                    />
                    <span className={`text-[9px] font-mono uppercase ${isTriaging ? 'text-amber-500/70' : 'text-teal-500/70'}`}>
                        {isTriaging ? 'Active' : 'Idle'}
                    </span>
                </div>
            </div>

            {/* Composite risk score */}
            <div className="px-5 py-4">
                <p className="text-[9px] font-mono text-zinc-600 tracking-wider uppercase mb-2">Composite Risk Score</p>
                {currentRisk ? (
                    <div className="flex items-end gap-3">
                        <span className={`text-4xl font-mono font-bold tabular-nums ${currentRisk.triage_level === 'BLACK' ? 'text-purple-400' :
                                currentRisk.triage_level === 'RED' ? 'text-red-500' :
                                    currentRisk.triage_level === 'YELLOW' ? 'text-amber-500' : 'text-green-500'
                            }`}>{currentRisk.score}</span>
                        <div className="mb-1">
                            <span className={`text-[10px] font-mono font-bold ${currentRisk.triage_level === 'BLACK' ? 'text-purple-400' :
                                    currentRisk.triage_level === 'RED' ? 'text-red-500' :
                                        currentRisk.triage_level === 'YELLOW' ? 'text-amber-500' : 'text-green-500'
                                }`}>{currentRisk.triage_level}</span>
                            <p className="text-[9px] text-zinc-600 font-mono">{currentRisk.triage_label}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-2xl font-mono font-bold text-zinc-700 tabular-nums">--</p>
                )}
            </div>

            {/* NLP Symptoms */}
            {nlpSymptoms.length > 0 && (
                <div className="px-5 py-3 border-t border-white/[0.04]">
                    <p className="text-[9px] font-mono text-zinc-600 tracking-wider uppercase mb-2">NLP Extraction (ICD-10)</p>
                    <div className="flex flex-wrap gap-1.5">
                        {nlpSymptoms.map((s, i) => (
                            <span key={i} className={`text-[9px] font-mono px-2 py-1 rounded-full border ${s.severity === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                                    s.severity === 'medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' :
                                        'text-green-400 border-green-500/20 bg-green-500/5'
                                }`}>
                                {s.symptom} <span className="text-zinc-600">{s.icd10}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Agent Messages Timeline */}
            <div className="px-5 py-3 border-t border-white/[0.04] flex-1 overflow-y-auto">
                <p className="text-[9px] font-mono text-zinc-600 tracking-wider uppercase mb-3">Agent Deliberation</p>

                {agentMessages.length === 0 && !isTriaging && (
                    <p className="text-[10px] text-zinc-700 font-mono">Awaiting triage command...</p>
                )}

                <div className="space-y-3">
                    {agentMessages.map((msg, i) => {
                        const color = agentColors[msg.agent || ''] || 'border-zinc-500/30 text-zinc-400';
                        const icon = agentIcons[msg.agent || ''] || '🤖';

                        return (
                            <div key={i} className={`border-l-2 pl-3 py-2 ${color.split(' ')[0]}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[12px]">{icon}</span>
                                    <span className={`text-[10px] font-mono font-bold ${color.split(' ')[1]}`}>
                                        {msg.agent}
                                    </span>
                                    {msg.type === 'agent_thinking' && (
                                        <motion.span
                                            animate={{ opacity: [1, 0.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="text-[8px] font-mono text-amber-500"
                                        >
                                            THINKING...
                                        </motion.span>
                                    )}
                                    {msg.confidence && (
                                        <span className="text-[8px] font-mono text-zinc-600">{msg.confidence}%</span>
                                    )}
                                </div>
                                {msg.content && (
                                    <div className="text-[10px] font-mono text-zinc-500 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {msg.content.substring(0, 600)}
                                        {msg.content.length > 600 && '...'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-700">
                    <span>4 AGENTS {isTriaging ? 'ACTIVE' : 'IDLE'}</span>
                    <span>ABDM COMPLIANT</span>
                </div>
            </div>
        </aside>
    );
}
