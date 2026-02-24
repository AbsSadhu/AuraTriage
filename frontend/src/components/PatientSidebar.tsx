'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore, Patient } from '@/lib/store';
import { fetchPatients, fetchPatientDetail } from '@/lib/api';

const tierColors: Record<string, string> = {
    Platinum: '#a78bfa',
    Gold: '#fbbf24',
    Silver: '#94a3b8',
    Bronze: '#d97706',
};

const triageGlow: Record<string, string> = {
    BLACK: '0 0 12px rgba(26, 26, 46, 0.8)',
    RED: '0 0 12px rgba(231, 76, 60, 0.6)',
    YELLOW: '0 0 12px rgba(243, 156, 18, 0.5)',
    GREEN: '0 0 12px rgba(46, 204, 113, 0.5)',
};

export default function PatientSidebar() {
    const {
        patients,
        setPatients,
        selectedPatientId,
        setSelectedPatientId,
        setPatientDetail,
        setCurrentRisk,
        searchQuery,
        setSearchQuery,
        clearChat,
        clearAgentMessages,
    } = useStore();

    useEffect(() => {
        fetchPatients()
            .then((data) => setPatients(data.patients))
            .catch(console.error);
    }, [setPatients]);

    const handleSelect = async (patient: Patient) => {
        setSelectedPatientId(patient.patient_id);
        clearChat();
        clearAgentMessages();
        try {
            const data = await fetchPatientDetail(patient.patient_id);
            setPatientDetail(data.patient);
            setCurrentRisk(data.risk);
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = patients.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="patient-sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">
                    <span className="title-icon">👥</span>
                    PATIENTS
                </h2>
                <span className="patient-count">{patients.length}</span>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="patient-list">
                {filtered.map((patient, i) => (
                    <motion.div
                        key={patient.patient_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`patient-card ${selectedPatientId === patient.patient_id ? 'selected' : ''
                            }`}
                        onClick={() => handleSelect(patient)}
                    >
                        <div className="patient-card-top">
                            <div className="patient-name">{patient.name}</div>
                            {patient.risk && (
                                <div
                                    className="triage-badge"
                                    style={{ backgroundColor: patient.risk.triage_color }}
                                >
                                    {patient.risk.score}
                                </div>
                            )}
                        </div>
                        <div className="patient-meta">
                            <span>
                                {patient.age}y • {patient.gender}
                            </span>
                            <span
                                className="insurance-badge"
                                style={{
                                    color: tierColors[patient.insurance_tier] || '#64748b',
                                }}
                            >
                                {patient.insurance_tier}
                            </span>
                        </div>
                        {patient.risk && (
                            <div className="triage-bar-container">
                                <motion.div
                                    className="triage-bar"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${patient.risk.score}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.05 }}
                                    style={{ backgroundColor: patient.risk.triage_color }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
