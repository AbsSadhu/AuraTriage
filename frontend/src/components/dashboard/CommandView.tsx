'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { createTriageWebSocket, uploadPrescription, transcribeAudio, parsePDF } from '@/lib/api';

export default function CommandView({ patientId }: { patientId: string }) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const pdfRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const {
        patientDetail,
        chatMessages,
        addChatMessage,
        addAgentMessage,
        setNlpSymptoms,
        setCurrentRisk,
        isTriaging,
        setIsTriaging,
    } = useStore();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, isTriaging]);

    const handleSend = () => {
        if (!input.trim() || !patientId) return;

        addChatMessage({
            id: Date.now().toString(),
            role: 'user',
            content: `› ${input}`,
            timestamp: new Date(),
        });

        setIsTriaging(true);

        try {
            if (wsRef.current) wsRef.current.close();

            const ws = createTriageWebSocket(
                patientId,
                (data: any) => {
                    if (data.type === 'nlp_extraction') {
                        if (data.symptoms) setNlpSymptoms(data.symptoms);
                    } else if (data.type === 'risk_score') {
                        if (data.risk) setCurrentRisk(data.risk);
                    } else if (data.type === 'agent_thinking') {
                        addAgentMessage({ ...data, type: 'agent_thinking' });
                    } else if (data.type === 'agent_result') {
                        addAgentMessage({ ...data, type: 'agent_result' });
                    } else if (data.type === 'triage_complete') {
                        addChatMessage({
                            id: Date.now().toString(),
                            role: 'system',
                            content: `⏎ TRIAGE_COMPLETE\n\n${data.summary}`,
                            timestamp: new Date(),
                        });
                        setIsTriaging(false);
                        ws.close();
                    } else if (data.type === 'error') {
                        addChatMessage({
                            id: Date.now().toString(),
                            role: 'system',
                            content: `⚠ SYS_ERROR: ${data.message}`,
                            timestamp: new Date(),
                        });
                        setIsTriaging(false);
                        ws.close();
                    }
                },
                () => setIsTriaging(false),
                (err) => {
                    console.error('WS Error:', err);
                    setIsTriaging(false);
                }
            );

            ws.onopen = () => {
                ws.send(JSON.stringify({ symptoms: input }));
            };

            wsRef.current = ws;
        } catch (e) {
            console.error(e);
            setIsTriaging(false);
        }

        setInput('');
    };

    // ─── Prescription OCR ───────────────────────────────────────────
    const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addChatMessage({
            id: Date.now().toString(),
            role: 'user',
            content: `📸 Uploaded prescription: ${file.name}`,
            timestamp: new Date(),
        });

        try {
            const result = await uploadPrescription(file);
            const meds = result.result?.medications || [];
            const medList = meds.map((m: any) => `  • ${m.drug_name} (${m.generic_molecule}) — ${m.dosage} ${m.frequency}`).join('\n');

            addChatMessage({
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `🔍 PRESCRIPTION OCR [${result.mode}]\n\nDiagnosis: ${result.result?.diagnosis || 'N/A'}\n\nMedications decoded:\n${medList}\n\nSpecial instructions: ${result.result?.special_instructions || 'None'}\nConfidence: ${(result.result?.confidence * 100)?.toFixed(0)}%`,
                timestamp: new Date(),
            });

            // Auto-fill the medication names as input for triage
            if (meds.length > 0) {
                const symptomHint = result.result?.diagnosis || meds.map((m: any) => m.generic_molecule).join(', ');
                setInput(`Patient prescribed: ${symptomHint}`);
            }
        } catch (err) {
            addChatMessage({
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `⚠ OCR failed: ${err}`,
                timestamp: new Date(),
            });
        }
        // Reset file input
        if (fileRef.current) fileRef.current.value = '';
    };

    // ─── PDF Upload ─────────────────────────────────────────────────
    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addChatMessage({
            id: Date.now().toString(),
            role: 'user',
            content: `📄 Uploaded discharge summary: ${file.name}`,
            timestamp: new Date(),
        });

        try {
            const result = await parsePDF(file);
            addChatMessage({
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `📄 PDF PARSED [${result.pages} pages, ${result.char_count} chars]\n\n${result.text?.substring(0, 500)}${(result.text?.length || 0) > 500 ? '...' : ''}`,
                timestamp: new Date(),
            });
            // Pre-fill input with extracted text snippet for triage
            if (result.text) {
                setInput(result.text.substring(0, 200));
            }
        } catch (err) {
            addChatMessage({
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `⚠ PDF parsing failed: ${err}`,
                timestamp: new Date(),
            });
        }
        if (pdfRef.current) pdfRef.current.value = '';
    };

    // ─── Audio Recording (Hold-to-Talk) ─────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                addChatMessage({
                    id: Date.now().toString(),
                    role: 'user',
                    content: `🎙️ Voice dictation recorded (${(audioBlob.size / 1024).toFixed(1)}KB)`,
                    timestamp: new Date(),
                });

                try {
                    const result = await transcribeAudio(audioBlob);
                    if (result.success && result.text) {
                        addChatMessage({
                            id: (Date.now() + 1).toString(),
                            role: 'system',
                            content: `🎙️ WHISPER TRANSCRIPTION:\n"${result.text}"`,
                            timestamp: new Date(),
                        });
                        setInput(result.text);
                    } else {
                        addChatMessage({
                            id: (Date.now() + 1).toString(),
                            role: 'system',
                            content: `⚠ Transcription: ${result.message}`,
                            timestamp: new Date(),
                        });
                    }
                } catch (err) {
                    addChatMessage({
                        id: (Date.now() + 1).toString(),
                        role: 'system',
                        content: `⚠ Transcription failed: ${err}`,
                        timestamp: new Date(),
                    });
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access denied:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#05070b]">
            {/* Vitals header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-[#07090d]">
                <div className="flex items-center gap-4">
                    <span className="text-[13px] font-semibold text-white">{patientDetail?.name || 'Select Patient'}</span>
                    {patientDetail && (
                        <span className="text-[10px] font-mono text-zinc-600">
                            {patientDetail.age}y / {patientDetail.gender} / {patientDetail.insurance_tier} / {patientDetail.city}
                        </span>
                    )}
                    {patientDetail?.abha_number && (
                        <span className="text-[9px] font-mono text-teal-400/60 bg-teal-400/5 px-2 py-0.5 rounded border border-teal-400/10">
                            ABHA: {patientDetail.abha_number}
                        </span>
                    )}
                </div>

                {/* Vitals strip (°C) */}
                <div className="flex items-center gap-5">
                    {patientDetail?.vitals && patientDetail.vitals.length > 0 ? (
                        <>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">HR</p>
                                <p className={`text-sm font-mono font-bold tabular-nums ${patientDetail.vitals[0].heart_rate > 100 ? 'text-amber-500' : 'text-white'}`}>
                                    {patientDetail.vitals[0].heart_rate} <span className="text-[9px] text-zinc-600 font-normal">bpm</span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">BP</p>
                                <p className={`text-sm font-mono font-bold tabular-nums ${patientDetail.vitals[0].blood_pressure_systolic > 140 ? 'text-red-400' : 'text-white'}`}>
                                    {patientDetail.vitals[0].blood_pressure_systolic}/{patientDetail.vitals[0].blood_pressure_diastolic}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">SpO₂</p>
                                <p className={`text-sm font-mono font-bold tabular-nums ${patientDetail.vitals[0].oxygen_saturation < 95 ? 'text-amber-500' : 'text-white'}`}>
                                    {patientDetail.vitals[0].oxygen_saturation}<span className="text-[9px] text-zinc-600 font-normal">%</span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">Temp</p>
                                <p className={`text-sm font-mono font-bold tabular-nums ${patientDetail.vitals[0].temperature > 38.3 ? 'text-red-400' : 'text-white'}`}>
                                    {patientDetail.vitals[0].temperature}<span className="text-[9px] text-zinc-600 font-normal">°C</span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">RR</p>
                                <p className={`text-sm font-mono font-bold tabular-nums ${patientDetail.vitals[0].respiratory_rate > 24 ? 'text-amber-500' : 'text-white'}`}>
                                    {patientDetail.vitals[0].respiratory_rate}<span className="text-[9px] text-zinc-600 font-normal">/min</span>
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-zinc-600 font-mono">NO VITALS</p>
                    )}
                </div>
            </div>

            {/* Terminal output */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px]">
                {chatMessages.map((entry) => (
                    <div key={entry.id} className="mb-4">
                        <span className="text-[10px] text-zinc-700 mr-2">{entry.timestamp.toLocaleTimeString()}</span>
                        <div className={`whitespace-pre-wrap leading-relaxed ${entry.role === 'user' ? 'text-zinc-300' : 'text-zinc-500 max-w-2xl'}`}>
                            {entry.content}
                        </div>
                    </div>
                ))}

                {isTriaging && (
                    <div className="mb-4">
                        <span className="text-[10px] text-zinc-700 mr-2">{new Date().toLocaleTimeString()}</span>
                        <div className="text-amber-500/80 whitespace-pre-wrap leading-relaxed">
                            {`⏎ MULTI-AGENT SWARM ACTIVE — 4 agents (Diagnostician, Jan Aushadhi Pharmacologist, Financial Auditor, ABHA Officer)...\n`}
                        </div>
                    </div>
                )}

                <motion.span
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 0.5, 1] }}
                    className="inline-block w-[7px] h-[15px] bg-teal-400 ml-1"
                />
            </div>

            {/* Hidden file inputs */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePrescriptionUpload} />
            <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePDFUpload} />

            {/* Input bar with upload buttons */}
            <div className="px-5 py-4 border-t border-white/[0.04] bg-[#07090d]">
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-3">
                    <span className="text-teal-400/70 text-sm font-mono">$</span>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Hinglish OK — e.g. 'seene mein dard, tez bukhar 3 din se'..."
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none font-mono"
                        disabled={isTriaging}
                    />

                    {/* Mic button */}
                    <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        className={`p-1.5 rounded-lg border text-[11px] font-mono transition-colors ${isRecording
                                ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                                : 'bg-white/[0.04] border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.08]'
                            }`}
                        title="Hold to dictate (Hinglish supported)"
                    >
                        🎙️
                    </button>

                    {/* Prescription OCR button */}
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Upload prescription photo (OCR)"
                    >
                        📸
                    </button>

                    {/* PDF upload button */}
                    <button
                        onClick={() => pdfRef.current?.click()}
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Upload discharge summary PDF"
                    >
                        📄
                    </button>

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={isTriaging || !input.trim()}
                        className="px-4 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[11px] font-mono text-zinc-400 hover:bg-white/[0.1] hover:text-white transition-colors disabled:opacity-50"
                    >
                        {isTriaging ? 'WAIT' : 'SEND'}
                    </button>
                </div>
                <p className="text-[9px] font-mono text-zinc-700 mt-2 text-center">
                    🎙️ Hold mic for Hinglish dictation • 📸 Snap prescription • 📄 Upload discharge PDF
                </p>
            </div>
        </div>
    );
}
