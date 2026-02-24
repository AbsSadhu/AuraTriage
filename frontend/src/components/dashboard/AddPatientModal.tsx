'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPatient } from '@/lib/api';

const INSURANCE_OPTIONS = ['PMJAY', 'CGHS', 'ESIC', 'Private', 'Self-Pay'];
const GENDER_OPTIONS = ['M', 'F', 'Other'];

interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPatientCreated: (patient: any) => void;
}

export default function AddPatientModal({ isOpen, onClose, onPatientCreated }: AddPatientModalProps) {
    const [form, setForm] = useState({
        name: '',
        age: '',
        gender: 'M',
        abha_number: '',
        phone: '',
        city: '',
        pincode: '',
        insurance_tier: 'Self-Pay',
        dob: '',
        chief_complaint: '',
        // Vitals
        heart_rate: '',
        bp_systolic: '',
        bp_diastolic: '',
        temperature: '',
        oxygen_saturation: '',
        respiratory_rate: '',
        // Medications
        medications: '',
        // Allergies
        allergies: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Patient name is required');
            return;
        }

        setSaving(true);
        try {
            const result = await createPatient({
                name: form.name,
                age: form.age ? parseInt(form.age) : undefined,
                gender: form.gender,
                abha_number: form.abha_number || undefined,
                phone: form.phone || undefined,
                city: form.city || undefined,
                pincode: form.pincode || undefined,
                insurance_tier: form.insurance_tier,
                dob: form.dob || undefined,
            });
            onPatientCreated(result.patient);
            // Reset form
            setForm({
                name: '', age: '', gender: 'M', abha_number: '', phone: '', city: '',
                pincode: '', insurance_tier: 'Self-Pay', dob: '', chief_complaint: '',
                heart_rate: '', bp_systolic: '', bp_diastolic: '', temperature: '',
                oxygen_saturation: '', respiratory_rate: '', medications: '', allergies: '',
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create patient');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="w-[520px] max-h-[85vh] overflow-y-auto bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-[#0c0e14] px-6 pt-5 pb-3 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-white">Register New Patient</h2>
                                    <p className="text-[10px] font-mono text-zinc-600 mt-0.5">FHIR R4 • ABDM Compliant</p>
                                </div>
                                <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                                    ✕
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
                            {/* Demographics Section */}
                            <fieldset>
                                <legend className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-3">👤 Demographics</legend>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Full Name *</label>
                                        <input name="name" value={form.name} onChange={handleChange} required
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="e.g. Rajesh Kumar Sharma" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Age</label>
                                        <input name="age" type="number" value={form.age} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="45" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Gender</label>
                                        <select name="gender" value={form.gender} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors">
                                            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Date of Birth</label>
                                        <input name="dob" type="date" value={form.dob} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Phone</label>
                                        <input name="phone" value={form.phone} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="+91 98765 43210" />
                                    </div>
                                </div>
                            </fieldset>

                            {/* ABHA & Location */}
                            <fieldset>
                                <legend className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-3">🏥 ABHA & Location</legend>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">ABHA Number (14-digit Health ID)</label>
                                        <input name="abha_number" value={form.abha_number} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="91-5678-9012-3456" maxLength={19} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">City</label>
                                        <input name="city" value={form.city} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="e.g. Mumbai" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Pincode</label>
                                        <input name="pincode" value={form.pincode} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-teal-500/30 transition-colors"
                                            placeholder="400001" maxLength={6} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-mono text-zinc-500 mb-1 block">Insurance Tier</label>
                                        <select name="insurance_tier" value={form.insurance_tier} onChange={handleChange}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/30 transition-colors">
                                            {INSURANCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </fieldset>

                            {/* Chief Complaint */}
                            <fieldset>
                                <legend className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-3">📝 Chief Complaint</legend>
                                <textarea name="chief_complaint" value={form.chief_complaint} onChange={handleChange}
                                    rows={2}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/30 transition-colors resize-none"
                                    placeholder="e.g. seene mein dard, bukhar 3 din se (Hinglish OK)" />
                            </fieldset>

                            {/* Error */}
                            {error && (
                                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-mono">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end gap-3 pt-2 pb-1">
                                <button type="button" onClick={onClose}
                                    className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-400 text-white text-xs font-semibold hover:from-teal-400 hover:to-emerald-300 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
                                    {saving ? 'Creating...' : '+ Register Patient'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
