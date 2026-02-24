'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore, AgentMessage } from '@/lib/store';
import RiskGauge from './RiskGauge';

const agentColors: Record<string, string> = {
    'Chief Diagnostician': '#06b6d4',
    'Clinical Pharmacologist': '#a78bfa',
    'Financial Auditor': '#f59e0b',
};

export default function AgentDebatePanel() {
    const { agentMessages, currentRisk, nlpSymptoms, isTriaging, selectedPatientId } = useStore();

    if (!selectedPatientId) {
        return (
            <div className="debate-panel">
                <div className="debate-header">
                    <h2 className="debate-title">
                        <span className="title-icon">🤖</span>
                        AGENT DEBATE
                    </h2>
                </div>
                <div className="debate-empty">
                    <p>Agent analysis will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="debate-panel">
            <div className="debate-header">
                <h2 className="debate-title">
                    <span className="title-icon">🤖</span>
                    AGENT DEBATE
                </h2>
                {isTriaging && (
                    <motion.div
                        className="live-badge"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        🔴 LIVE
                    </motion.div>
                )}
            </div>

            {/* Risk Gauge */}
            {currentRisk && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="risk-gauge-container"
                >
                    <RiskGauge score={currentRisk.score} level={currentRisk.triage_level} color={currentRisk.triage_color} label={currentRisk.triage_label} />
                </motion.div>
            )}

            {/* NLP Symptoms */}
            {nlpSymptoms.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="nlp-section"
                >
                    <h3 className="section-title">🧠 Extracted Symptoms</h3>
                    <div className="symptom-chips">
                        {nlpSymptoms.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`symptom-chip severity-${s.severity}`}
                            >
                                <span className="chip-name">{s.symptom}</span>
                                <span className="chip-code">{s.icd10}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Agent Cards */}
            <div className="agent-cards">
                <AnimatePresence>
                    {agentMessages.map((msg, i) => (
                        <AgentCard key={`${msg.agent}-${msg.type}-${i}`} message={msg} index={i} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function AgentCard({ message, index }: { message: AgentMessage; index: number }) {
    const color = agentColors[message.agent || ''] || '#64748b';

    if (message.type === 'agent_thinking') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="agent-card thinking"
                style={{ borderLeftColor: color }}
            >
                <div className="agent-card-header">
                    <span className="agent-avatar">{message.avatar}</span>
                    <span className="agent-name" style={{ color }}>{message.agent}</span>
                </div>
                <div className="agent-thinking-indicator">
                    <motion.div
                        className="thinking-bar"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ backgroundColor: color }}
                    />
                </div>
                <span className="thinking-label">Analyzing...</span>
            </motion.div>
        );
    }

    if (message.type === 'agent_result') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
                className="agent-card result"
                style={{ borderLeftColor: color }}
            >
                <div className="agent-card-header">
                    <span className="agent-avatar">{message.avatar}</span>
                    <span className="agent-name" style={{ color }}>{message.agent}</span>
                    {message.confidence && (
                        <span className="confidence-badge" style={{ backgroundColor: `${color}22`, color }}>
                            {message.confidence}% confident
                        </span>
                    )}
                </div>
                <div className="agent-content">
                    {message.content?.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (message.type === 'triage_complete') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="agent-card complete"
            >
                <div className="complete-icon">✅</div>
                <p>All agents have completed their analysis</p>
            </motion.div>
        );
    }

    return null;
}
