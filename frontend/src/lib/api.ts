const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// ─── Patient APIs ───────────────────────────────────────────────────────────

export async function fetchPatients() {
    const res = await fetch(`${API_BASE}/api/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
}

export async function fetchPatientDetail(patientId: string) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch patient');
    return res.json();
}

export async function fetchPatientByABHA(abhaNumber: string) {
    const res = await fetch(`${API_BASE}/api/patients/abha/${abhaNumber}`);
    if (!res.ok) throw new Error('ABHA number not found');
    return res.json();
}

// ─── Patient CRUD ───────────────────────────────────────────────────────────

export async function createPatient(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create patient');
    return res.json();
}

export async function updatePatient(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
}

export async function deletePatient(patientId: string) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete patient');
    return res.json();
}

// ─── Sub-resource CRUD ──────────────────────────────────────────────────────

export async function addEncounter(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add encounter');
    return res.json();
}

export async function addMedication(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add medication');
    return res.json();
}

export async function deleteMedication(medId: string) {
    const res = await fetch(`${API_BASE}/api/medications/${medId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete medication');
    return res.json();
}

export async function addVitals(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add vitals');
    return res.json();
}

export async function addAllergy(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/allergies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add allergy');
    return res.json();
}

export async function addLabResult(patientId: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add lab result');
    return res.json();
}

// ─── NLP / Symptom Extraction ───────────────────────────────────────────────

export async function extractSymptoms(text: string) {
    const res = await fetch(`${API_BASE}/api/extract-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to extract symptoms');
    return res.json();
}

// ─── Jan Aushadhi (PMBJP) ───────────────────────────────────────────────────

export async function fetchJanAushadhiDrugs() {
    const res = await fetch(`${API_BASE}/api/jan-aushadhi`);
    if (!res.ok) throw new Error('Failed to fetch Jan Aushadhi drugs');
    return res.json();
}

export async function searchJanAushadhi(query: string) {
    const res = await fetch(`${API_BASE}/api/jan-aushadhi/search/${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search Jan Aushadhi');
    return res.json();
}

// ─── Diagnostic Center Routing ──────────────────────────────────────────────

export async function fetchDiagnosticCenters(testName: string, pincode?: string) {
    const url = new URL(`${API_BASE}/api/diagnostics/${encodeURIComponent(testName)}`);
    if (pincode) url.searchParams.set('pincode', pincode);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch diagnostic centers');
    return res.json();
}

// ─── Prescription OCR ───────────────────────────────────────────────────────

export async function uploadPrescription(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/ocr-prescription`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to decode prescription');
    return res.json();
}

// ─── Audio Transcription (Groq Whisper) ─────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob, filename = 'recording.webm') {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);
    const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to transcribe audio');
    return res.json();
}

// ─── PDF Parsing ────────────────────────────────────────────────────────────

export async function parsePDF(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/parse-pdf`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to parse PDF');
    return res.json();
}

// ─── ABHA Consent Flow ──────────────────────────────────────────────────────

export async function requestABHAConsent(patientId: string, doctorId = 'DOC001') {
    const res = await fetch(`${API_BASE}/api/abha/request-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, doctor_id: doctorId }),
    });
    if (!res.ok) throw new Error('Failed to request ABHA consent');
    return res.json();
}

export async function verifyABHAConsent(consentId: string, pin: string) {
    const res = await fetch(`${API_BASE}/api/abha/verify-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_id: consentId, pin }),
    });
    if (!res.ok) throw new Error('Consent verification failed');
    return res.json();
}

// ─── WebSocket (Streaming Agent Debate) ─────────────────────────────────────

export function createTriageWebSocket(
    patientId: string,
    onMessage: (data: unknown) => void,
    onClose?: () => void,
    onError?: (e: Event) => void,
): WebSocket {
    const ws = new WebSocket(`${WS_BASE}/ws/triage/${patientId}`);

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch {
            console.error('Failed to parse WS message:', event.data);
        }
    };

    ws.onclose = () => onClose?.();
    ws.onerror = (e) => onError?.(e);

    return ws;
}
