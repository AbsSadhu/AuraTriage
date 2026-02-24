'use client';

import { useEffect } from 'react';
import PatientList from '@/components/dashboard/PatientList';
import CommandView from '@/components/dashboard/CommandView';
import AgentTimeline from '@/components/dashboard/AgentTimeline';
import { useStore } from '@/lib/store';
import { fetchPatientDetail } from '@/lib/api';

export default function DashboardPage() {
    const { selectedPatientId, setSelectedPatientId, setPatientDetail, clearChat, clearAgentMessages, setCurrentRisk, setNlpSymptoms } = useStore();

    useEffect(() => {
        if (!selectedPatientId) {
            setSelectedPatientId('P001');
            return;
        }

        // On selection change, fetch details and reset agent state
        fetchPatientDetail(selectedPatientId).then(data => {
            setPatientDetail(data.patient);
            clearChat();
            clearAgentMessages();
            setCurrentRisk(data.risk || null);
            setNlpSymptoms([]);
        }).catch(err => console.error(err));
    }, [selectedPatientId, setSelectedPatientId, setPatientDetail, clearChat, clearAgentMessages, setCurrentRisk, setNlpSymptoms]);

    return (
        <div className="flex h-screen bg-[#05070b] text-zinc-100">
            <PatientList activeId={selectedPatientId || ''} onSelect={setSelectedPatientId} />
            <CommandView patientId={selectedPatientId || ''} />
            <AgentTimeline />
        </div>
    );
}
