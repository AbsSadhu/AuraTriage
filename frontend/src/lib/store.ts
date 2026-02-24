import { create } from 'zustand';

export interface Patient {
    patient_id: string;
    abha_number?: string;
    name: string;
    dob: string;
    age: number;
    gender: string;
    insurance_tier: string;
    city?: string;
    pincode?: string;
    phone?: string;
    risk?: RiskScore;
}

export interface RiskScore {
    score: number;
    triage_level: 'BLACK' | 'RED' | 'YELLOW' | 'GREEN';
    triage_label: string;
    triage_color: string;
    breakdown: Record<string, number>;
}

export interface PatientDetail extends Patient {
    encounters: Encounter[];
    medications: Medication[];
    vitals: Vital[];
    allergies: Allergy[];
    lab_results: LabResult[];
}

export interface Encounter {
    encounter_id: string;
    patient_id: string;
    date: string;
    chief_complaint: string;
    symptoms: string;
    notes: string;
}

export interface Medication {
    med_id: string;
    patient_id: string;
    drug_name: string;
    dosage: string;
    frequency: string;
    status: string;
}

export interface Vital {
    vital_id: string;
    patient_id: string;
    timestamp: string;
    heart_rate: number;
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    temperature: number;
    oxygen_saturation: number;
    respiratory_rate: number;
}

export interface Allergy {
    allergy_id: string;
    patient_id: string;
    allergen: string;
    reaction: string;
    severity: string;
}

export interface LabResult {
    lab_id: string;
    patient_id: string;
    test_name: string;
    result_value: string;
    unit: string;
    reference_range: string;
    flag: string;
    date: string;
}

export interface AgentMessage {
    type: 'agent_thinking' | 'agent_result' | 'triage_complete' | 'nlp_extraction' | 'risk_score' | 'error';
    agent?: string;
    avatar?: string;
    index?: number;
    content?: string;
    confidence?: number;
    symptoms?: NlpSymptom[];
    report?: string;
    risk?: RiskScore;
    message?: string;
    summary?: string;
}

export interface NlpSymptom {
    symptom: string;
    icd10: string;
    severity: string;
    body_part: string | null;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'system';
    content: string;
    timestamp: Date;
}

interface AppState {
    // Patients
    patients: Patient[];
    selectedPatientId: string | null;
    patientDetail: PatientDetail | null;
    setPatients: (patients: Patient[]) => void;
    setSelectedPatientId: (id: string | null) => void;
    setPatientDetail: (detail: PatientDetail | null) => void;

    // Chat
    chatMessages: ChatMessage[];
    addChatMessage: (msg: ChatMessage) => void;
    clearChat: () => void;

    // Agent Debate
    agentMessages: AgentMessage[];
    addAgentMessage: (msg: AgentMessage) => void;
    clearAgentMessages: () => void;

    // Risk
    currentRisk: RiskScore | null;
    setCurrentRisk: (risk: RiskScore | null) => void;

    // NLP
    nlpSymptoms: NlpSymptom[];
    setNlpSymptoms: (symptoms: NlpSymptom[]) => void;

    // Loading
    isTriaging: boolean;
    setIsTriaging: (v: boolean) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

export const useStore = create<AppState>((set) => ({
    patients: [],
    selectedPatientId: null,
    patientDetail: null,
    setPatients: (patients) => set({ patients }),
    setSelectedPatientId: (id) => set({ selectedPatientId: id }),
    setPatientDetail: (detail) => set({ patientDetail: detail }),

    chatMessages: [],
    addChatMessage: (msg) =>
        set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
    clearChat: () => set({ chatMessages: [] }),

    agentMessages: [],
    addAgentMessage: (msg) =>
        set((state) => ({ agentMessages: [...state.agentMessages, msg] })),
    clearAgentMessages: () => set({ agentMessages: [] }),

    currentRisk: null,
    setCurrentRisk: (risk) => set({ currentRisk: risk }),

    nlpSymptoms: [],
    setNlpSymptoms: (symptoms) => set({ nlpSymptoms: symptoms }),

    isTriaging: false,
    setIsTriaging: (v) => set({ isTriaging: v }),
    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
}));
