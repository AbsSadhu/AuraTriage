'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPatients, deletePatient } from '@/lib/api';
import type { Patient } from '@/lib/store';
import AddPatientModal from './AddPatientModal';

const triageColor = (level: string) => {
    switch (level) {
        case 'BLACK': return 'text-purple-400';
        case 'RED': return 'text-red-500';
        case 'YELLOW': return 'text-amber-500';
        case 'GREEN': return 'text-green-500';
        default: return 'text-zinc-500';
    }
};

const triageDot = (level: string) => {
    switch (level) {
        case 'BLACK': return 'bg-purple-400';
        case 'RED': return 'bg-red-500';
        case 'YELLOW': return 'bg-amber-500';
        case 'GREEN': return 'bg-green-500';
        default: return 'bg-zinc-500';
    }
};

const insuranceBadge = (tier: string) => {
    switch (tier) {
        case 'PMJAY': return { label: 'PMJAY', color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' };
        case 'CGHS': return { label: 'CGHS', color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' };
        case 'ESIC': return { label: 'ESIC', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' };
        case 'Private': return { label: 'PVT', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' };
        case 'Self-Pay': return { label: 'SELF', color: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5' };
        default: return { label: tier, color: 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5' };
    }
};

const sparklinePath = (id: string) => {
    const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const points = Array.from({ length: 12 }, (_, i) => {
        const v = 10 + Math.sin(seed * 7 + i) * 6 + Math.cos(seed * 3 + i * 2) * 4;
        return `${i * 7},${20 - v}`;
    }).join(' ');
    return points;
};

export default function PatientList({
    activeId,
    onSelect,
}: {
    activeId: string;
    onSelect: (id: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadPatients = () => {
        setLoading(true);
        fetchPatients().then(data => {
            setPatients(data.patients);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load patients:", err);
            setLoading(false);
        });
    };

    useEffect(() => { loadPatients(); }, []);

    const handlePatientCreated = (newPatient: Patient) => {
        loadPatients();
        onSelect(newPatient.patient_id);
    };

    const handleDelete = async (e: React.MouseEvent, patientId: string) => {
        e.stopPropagation();
        if (!confirm(`Delete patient ${patientId} and ALL their records? This cannot be undone.`)) return;
        try {
            await deletePatient(patientId);
            setPatients(prev => prev.filter(p => p.patient_id !== patientId));
            if (activeId === patientId && patients.length > 1) {
                const remaining = patients.filter(p => p.patient_id !== patientId);
                if (remaining.length > 0) onSelect(remaining[0].patient_id);
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const filtered = useMemo(
        () => patients.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.abha_number && p.abha_number.includes(search)) ||
            (p.city && p.city.toLowerCase().includes(search.toLowerCase()))
        ),
        [search, patients]
    );

    return (
        <>
            <aside className="w-72 h-screen flex flex-col border-r border-white/[0.04] bg-[#07090d]">
                {/* Header */}
                <div className="px-4 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">AuraTriage 🇮🇳</h2>
                        <span className="text-[9px] font-mono text-zinc-700">ABDM v2.0</span>
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, ABHA, city..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] transition-colors"
                    />
                </div>

                {/* Add Patient Button */}
                <div className="px-4 pb-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/20 text-[11px] font-semibold text-teal-400 hover:from-teal-500/30 hover:to-emerald-500/30 hover:text-teal-300 transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="text-sm">+</span> Register New Patient
                    </button>
                </div>

                {/* Patients header */}
                <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-600 tracking-[0.15em] uppercase">OPD Queue</span>
                    <span className="text-[9px] font-mono text-zinc-700">{filtered.length}</span>
                </div>

                {/* Patient list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="px-4 py-8 text-center text-[11px] text-zinc-600 font-mono">Loading patients...</div>
                    ) : (
                        <AnimatePresence>
                            {filtered.map((p) => {
                                const risk = p.risk;
                                const triageLevel = risk?.triage_level || 'GREEN';
                                const score = risk?.score ?? 0;
                                const badge = insuranceBadge(p.insurance_tier);

                                return (
                                    <motion.div
                                        key={p.patient_id}
                                        className={`relative group transition-colors hover:bg-white/[0.02] ${activeId === p.patient_id ? 'bg-white/[0.03]' : ''}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {activeId === p.patient_id && (
                                            <motion.div
                                                layoutId="active-patient"
                                                className="absolute left-0 top-0 bottom-0 w-[2px] bg-white"
                                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                            />
                                        )}

                                        <button
                                            onClick={() => onSelect(p.patient_id)}
                                            className="w-full text-left px-4 py-3.5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-medium text-zinc-200 truncate">{p.name}</p>
                                                    <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
                                                        {p.age}y / {p.gender} / {p.city}
                                                    </p>
                                                    <p className="text-[9px] font-mono text-zinc-700 mt-0.5">
                                                        ABHA: {p.abha_number || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${triageDot(triageLevel)}`} />
                                                        <span className={`text-[11px] font-mono font-bold tabular-nums ${triageColor(triageLevel)}`}>
                                                            {score}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <svg width="100%" height="16" className="opacity-30 mt-1.5">
                                                <polyline
                                                    points={sparklinePath(p.patient_id)}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    className="text-zinc-500"
                                                />
                                            </svg>
                                        </button>

                                        {/* Delete button — appears on hover */}
                                        <button
                                            onClick={(e) => handleDelete(e, p.patient_id)}
                                            className="absolute top-2 right-2 w-5 h-5 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                            title="Delete patient"
                                        >
                                            ✕
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/[0.04] text-[9px] font-mono text-zinc-700">
                    <div className="flex justify-between">
                        <span>NHA ABDM: COMPLIANT</span>
                        <span>🇮🇳 HIE-CM</span>
                    </div>
                </div>
            </aside>

            <AddPatientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onPatientCreated={handlePatientCreated}
            />
        </>
    );
}
