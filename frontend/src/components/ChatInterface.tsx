'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { createTriageWebSocket } from '@/lib/api';

export default function ChatInterface() {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const {
        selectedPatientId,
        patientDetail,
        chatMessages,
        addChatMessage,
        addAgentMessage,
        clearAgentMessages,
        setCurrentRisk,
        setNlpSymptoms,
        isTriaging,
        setIsTriaging,
        currentRisk,
    } = useStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedPatientId || isTriaging) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: input.trim(),
            timestamp: new Date(),
        };
        addChatMessage(userMsg);
        clearAgentMessages();
        setIsTriaging(true);

        // Open WebSocket for streaming triage
        const ws = createTriageWebSocket(
            selectedPatientId,
            (data) => {
                const msg = data as Record<string, unknown>;
                if (msg.type === 'nlp_extraction') {
                    setNlpSymptoms(msg.symptoms as never[]);
                    addChatMessage({
                        id: `nlp-${Date.now()}`,
                        role: 'system',
                        content: `🧠 **NLP Extraction Complete** — ${(msg.symptoms as unknown[]).length} symptoms identified`,
                        timestamp: new Date(),
                    });
                } else if (msg.type === 'risk_score') {
                    setCurrentRisk(msg.risk as never);
                } else if (
                    msg.type === 'agent_thinking' ||
                    msg.type === 'agent_result'
                ) {
                    addAgentMessage(msg as never);
                } else if (msg.type === 'triage_complete') {
                    setIsTriaging(false);
                    addChatMessage({
                        id: `complete-${Date.now()}`,
                        role: 'system',
                        content: '✅ **Triage complete.** All agents have finished their analysis. Review the debate panel →',
                        timestamp: new Date(),
                    });
                } else if (msg.type === 'error') {
                    setIsTriaging(false);
                    addChatMessage({
                        id: `error-${Date.now()}`,
                        role: 'system',
                        content: `❌ Error: ${msg.message}`,
                        timestamp: new Date(),
                    });
                }
            },
            () => setIsTriaging(false),
            () => setIsTriaging(false),
        );

        wsRef.current = ws;

        // Send symptoms once connected
        ws.onopen = () => {
            ws.send(JSON.stringify({ symptoms: input.trim() }));
        };

        setInput('');
    };

    if (!selectedPatientId) {
        return (
            <div className="chat-interface chat-empty">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="empty-state"
                >
                    <div className="empty-icon">🏥</div>
                    <h2>AuraTriage</h2>
                    <p>Select a patient to begin clinical triage</p>
                    <div className="empty-features">
                        <div className="feature-pill">🩺 Multi-Agent Diagnosis</div>
                        <div className="feature-pill">💊 Drug Interaction Check</div>
                        <div className="feature-pill">💰 Cost Optimization</div>
                        <div className="feature-pill">🧠 NLP Symptom Extraction</div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="chat-interface">
            {/* Patient header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h3>{patientDetail?.name || 'Loading...'}</h3>
                    <span className="chat-header-meta">
                        {patientDetail?.age}y • {patientDetail?.gender} •{' '}
                        {patientDetail?.insurance_tier}
                    </span>
                </div>
                {currentRisk && (
                    <div
                        className="chat-risk-badge"
                        style={{ backgroundColor: currentRisk.triage_color }}
                    >
                        <span className="risk-score-value">{currentRisk.score}</span>
                        <span className="risk-label">{currentRisk.triage_label}</span>
                    </div>
                )}
            </div>

            {/* Patient quick-stats */}
            {patientDetail && (
                <div className="patient-stats-bar">
                    {patientDetail.vitals?.[0] && (
                        <>
                            <div className="stat">
                                <span className="stat-label">HR</span>
                                <span className="stat-value">{patientDetail.vitals[0].heart_rate}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">BP</span>
                                <span className="stat-value">
                                    {patientDetail.vitals[0].blood_pressure_systolic}/
                                    {patientDetail.vitals[0].blood_pressure_diastolic}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">SpO2</span>
                                <span className="stat-value">{patientDetail.vitals[0].oxygen_saturation}%</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Temp</span>
                                <span className="stat-value">{patientDetail.vitals[0].temperature}°F</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">RR</span>
                                <span className="stat-value">{patientDetail.vitals[0].respiratory_rate}</span>
                            </div>
                        </>
                    )}
                    {patientDetail.allergies?.length > 0 && (
                        <div className="stat stat-warning">
                            <span className="stat-label">⚠️ Allergies</span>
                            <span className="stat-value">{patientDetail.allergies.length}</span>
                        </div>
                    )}
                    {patientDetail.medications?.length > 0 && (
                        <div className="stat">
                            <span className="stat-label">💊 Meds</span>
                            <span className="stat-value">
                                {patientDetail.medications.filter((m) => m.status === 'Active').length}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="chat-messages">
                <AnimatePresence>
                    {chatMessages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`chat-msg chat-msg-${msg.role}`}
                        >
                            <div className="msg-content">{msg.content}</div>
                            <div className="msg-time">
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTriaging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="chat-msg chat-msg-system thinking"
                    >
                        <div className="thinking-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>Agents deliberating...</span>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        isTriaging
                            ? 'Agents are working...'
                            : 'Describe symptoms or ask a clinical question...'
                    }
                    disabled={isTriaging}
                    className="chat-input"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTriaging}
                    className="chat-send-btn"
                >
                    {isTriaging ? '⏳' : '⚡'}
                </button>
            </form>
        </div>
    );
}
