# PRD: AuraTriage — AI Clinical Orchestrator for Indian Healthcare

## 1. Executive Summary

AuraTriage is an India-first, multi-agent clinical triage system built for the Indian healthcare ecosystem. It deploys a **4-agent CrewAI swarm** powered by the Groq API (LLaMA 3.3 70B) that ingests patient data via ABHA (Ayushman Bharat Health Account) numbers, debates clinical findings using ICMR/NMC protocols, cross-references medications against the **Jan Aushadhi (PMBJP) generic drug database**, routes diagnostics to the cheapest local labs, and delivers financially optimized treatment plans with costs in ₹ — all in real-time via WebSocket streaming.

### What Makes This Different
- **ABDM Compliant**: 14-digit ABHA Health IDs, consent PIN verification, HIE-CM simulation
- **Jan Aushadhi Integration**: Every branded drug flagged with ₹ savings vs generic equivalent
- **Hinglish NLP**: "seene mein dard" → chest pain → ICD-10: R07.9 — decoded natively
- **Prescription OCR**: Snap a photo of a handwritten OPD slip → Gemini Vision decodes the chicken-scratch
- **Voice Dictation**: Hold-to-talk Hinglish → Groq Whisper transcription → auto-triage
- **Diagnostic Lab Routing**: Top 3 cheapest labs near patient's pincode (Dr. Lal, SRL, Thyrocare, Tata 1mg)

---

## 2. Tech Stack & Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | SPA with server components |
| **Styling** | Tailwind CSS v4, Framer Motion | Dark-mode brutalist HUD + animations |
| **State** | Zustand | Cross-component reactive state |
| **Backend** | Python, FastAPI, Uvicorn | REST API + WebSocket server |
| **Agent Swarm** | CrewAI (3 agents, sequential process) | Multi-agent clinical triage |
| **LLM Engine** | DeepSeek-R1 via OpenRouter API | Elite medical reasoning logic |
| **Prescription OCR** | Google Gemini 1.5 Flash (Vision) | Handwritten prescription decoder |
| **Audio Transcription** | Groq Whisper (whisper-large-v3-turbo) | Hinglish doctor dictation |
| **PDF Parsing** | PyMuPDF (fitz) | Fast discharge summary extraction |
| **Database/MCP** | SQLite + Python FHIR Client | ABDM-compliant FHIR R4 mock DB |
| **Smooth Scroll** | Lenis | Buttery momentum scrolling |

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS FRONTEND                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │PatientList│  │ CommandView  │  │   AgentTimeline          │  │
│  │(ABHA IDs) │  │🎙️📸📄 Input │  │ 4-Agent Debate Stream    │  │
│  │PMJAY/CGHS │  │°C Vitals    │  │ NLP Tags + Risk Score    │  │
│  └──────┬───┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │  Zustand     │ WebSocket           │                  │
└─────────┼──────────────┼────────────────────┼──────────────────┘
          │  REST API    │  /ws/triage/{id}   │
┌─────────┼──────────────┼────────────────────┼──────────────────┐
│         ▼              ▼                    ▼                  │
│                    FASTAPI BACKEND                              │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │NLP Engine │  │Risk Score│  │OCR Engine  │  │Audio Engine│  │
│  │(Hinglish) │  │(°C/India)│  │(Gemini)    │  │(Whisper)   │  │
│  └─────┬─────┘  └────┬─────┘  └────────────┘  └────────────┘  │
│        │              │                                         │
│  ┌─────▼──────────────▼─────────────────────────────────────┐  │
│  │              CREWAI AGENT SWARM (Sequential)              │  │
│  │ 🩺 Diagnostician → 💊 Pharmacologist → ₹ Auditor → 🛡️ ABHA │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
│                        │                                        │
│  ┌─────────────────────▼─────────────────────────────────────┐  │
│  │                    SQLite Database                         │  │
│  │ patients (ABHA) │ jan_aushadhi_drugs │ diagnostic_centers │  │
│  │ encounters      │ medications        │ consent_log (ABDM) │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. The Multi-Agent Swarm

### Agent 1: Clinical Triage Nurse (Gatekeeper)
```
Role: Triage Nurse 
Output: Strictly rejects non-medical queries, summarizes valid medical queries for the Diagnostician.
```

### Agent 2: Chief Diagnostician
```
Role: Expert Medical Diagnostician
Output: Diagnostic plan and treatment recommendations based on patient data.
```

### Agent 3: Jan Aushadhi Auditor
```
Role: Cost-Conscious Auditor
Output: Cross-references treatments, replaces expensive branded drugs with cheap Indian Jan Aushadhi generic alternatives.
```

```python
# LLM Configuration
import os
from crewai import Agent, Task, Crew, Process, LLM

llm = LLM(
    model="openrouter/deepseek/deepseek-r1",
    api_key=os.environ.get("OPENROUTER_API_KEY")
)
```

---

## 4. MCP & ABDM FHIR Database Architecture

**ABDM FHIR R4 Schema** via mock Model Context Protocol:

```sql
-- Patients mapped to ABHA ID
CREATE TABLE patients (
    abha_id TEXT PRIMARY KEY,
    name TEXT,
    dob TEXT,
    gender TEXT
);

-- OPConsultRecord Profile
CREATE TABLE op_consult_records (
    encounter_id TEXT PRIMARY KEY,
    abha_id TEXT,
    date TEXT,
    chief_complaint TEXT,
    hinglish_notes TEXT,
    FOREIGN KEY(abha_id) REFERENCES patients(abha_id)
);

-- Medications mapping
CREATE TABLE medications (
    med_id TEXT PRIMARY KEY,
    encounter_id TEXT,
    drug_name TEXT,
    dosage TEXT,
    is_jan_aushadhi BOOLEAN,
    FOREIGN KEY(encounter_id) REFERENCES op_consult_records(encounter_id)
);
```

We orchestrate ABDM REST communications via `AuraFHIRClient` (`fhir_client.py`), using `fhir.resources` and validating 14-digit ABHA numbers.

### Seeded Data
- **10 Indian patients** — Rajesh Kumar Sharma (Delhi), Priya Nair (Mumbai), Mohammed Irfan Khan (Hyderabad), etc.
- **18 Indian medications** — Dolo 650, Ecosprin 75, Glycomet GP 2, Telma 40, Nexito 10, Tiova Rotacap, etc.
- **20 Jan Aushadhi drugs** — Brand→Generic price comparisons (Augmentin ₹210 → Generic ₹42)
- **20 diagnostic centers** — Dr. Lal PathLabs, SRL, Thyrocare, Tata 1mg, Metropolis
- **Hinglish encounters** — "seene mein dard", "tez bukhar 3 din se", "saans phoolna badh rahi hai"

---

## 5. NLP Engine (Hinglish + Indian Medical)

### Hinglish Symptom Mapping (60+ entries)
```
"seene mein dard"    → chest pain    → ICD-10: R07.9
"sir dard"           → headache      → ICD-10: R51.9
"bukhar"             → fever         → ICD-10: R50.9
"ulti / matli"       → nausea        → ICD-10: R11.0
"saans phoolna"      → dyspnea       → ICD-10: R06.0
"dil ki dhadkan tez" → palpitations  → ICD-10: R00.2
"jhunjhunahat"       → tingling      → ICD-10: R20.2
```

### Indian Prescription Abbreviation Decoder
```
OD  → Once daily          BD  → Twice daily
TDS → Thrice daily        SOS → If needed
HS  → At bedtime          BBF → Before breakfast
PC  → After food          AC  → Before food
```

### Tropical Disease ICD-10 Codes
```
Dengue → A90    Typhoid → A01.0    Malaria → B50.9
TB     → A15.0  Chikungunya → A92.0  Kala-azar → B55.0
```

---

## 6. Multimodal Ingestion Pipeline

### Prescription OCR ("Chicken-Scratch Decrypter")
- **Input**: Photo of handwritten OPD prescription
- **Engine**: Google Gemini 1.5 Flash (Vision API)
- **Prompt**: Decode Indian doctor handwriting, map OD/BD/TDS abbreviations, extract drug names → generic molecules
- **Output**: Structured JSON with medications, dosage, frequency, diagnosis
- **Fallback**: Mock demo response if no API key

### Audio Dictation ("Walk-and-Talk")
- **Input**: Hold-to-talk button on dashboard
- **Engine**: Groq Whisper (whisper-large-v3-turbo)
- **Language**: Hindi/Hinglish natively supported
- **Output**: Transcribed text auto-filled into triage input

### PDF Parsing ("Polythene Bag Ingester")
- **Input**: Discharge summary PDF upload
- **Engine**: PyMuPDF (fitz) — 10-50x faster than Docling
- **Output**: Extracted text fed into LLM context window

---

## 7. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/patients` | List all patients with ABHA + risk scores |
| GET | `/api/patients/{id}` | Full patient record |
| GET | `/api/patients/abha/{abha}` | Lookup by 14-digit ABHA number |
| POST | `/api/extract-symptoms` | NLP extraction (Hinglish supported) |
| GET | `/api/jan-aushadhi` | All Jan Aushadhi drug mappings |
| GET | `/api/jan-aushadhi/search/{q}` | Search generic alternatives |
| GET | `/api/diagnostics/{test}` | Cheapest labs near pincode |
| POST | `/api/ocr-prescription` | Decode prescription photo |
| POST | `/api/transcribe` | Whisper audio transcription |
| POST | `/api/parse-pdf` | Extract text from PDF |
| POST | `/api/abha/request-consent` | Initiate ABDM consent PIN |
| POST | `/api/abha/verify-consent` | Verify PIN + unlock records |
| POST | `/api/triage` | Synchronous full triage |
| WS | `/ws/triage/{id}` | Streaming agent debate |

---

## 8. UI/UX — Dark-Mode Clinical HUD

### Dashboard Layout (3 columns)
- **Left sidebar (PatientList)**: ABHA numbers, insurance badges (PMJAY/CGHS/ESIC/Private/Self-Pay), risk score dots, city names, sparkline vitals
- **Center view (CommandView)**: Real-time vitals in °C, terminal-style chat, input bar with 🎙️ mic (hold-to-talk), 📸 prescription OCR upload, 📄 PDF upload, `$` command prompt accepting Hinglish
- **Right sidebar (AgentTimeline)**: 4 color-coded agents streaming deliberation in real-time, composite risk score (0-100), NLP ICD-10 symptom chips, ABDM compliance footer

### Landing Page
- Hero with SplitText char-by-char animation, Spline 3D container
- BentoGrid system capabilities, auto-scrolling testimonial marquee
- Parallax scroll effects via Lenis + Framer Motion

### Other Pages
- **Auth**: Glassmorphic login/signup with animated mesh blobs
- **Patient Portal**: Care plan cards, medication schedule, Swarm chat interface

---

## 9. Risk Scoring Engine

Weighted 0-100 score with Indian-specific factors:

| Factor | Max Points | Indian Specifics |
|--------|-----------|------------------|
| Age | 15 | Pediatric + geriatric weighting |
| Vitals | 30 | °C temperature scale |
| Medications | 10 | Polypharmacy detection |
| Symptoms | 20 | Dengue/typhoid/malaria/TB keywords + Hinglish |
| Lab Results | 15 | Extra weight for NS1 antigen, low platelets |
| Allergies | 10 | Severe allergy multiplier |

**Triage Levels**: BLACK (85-100) → RED (65-84) → YELLOW (40-64) → GREEN (0-39)

---

## 10. Running the Project

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload    # http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                            # http://localhost:3000
```

**Environment Variables** (`.env` in `/backend`):
```
GROQ_API_KEY=gsk_...           # Required — LLM + Whisper
GOOGLE_API_KEY=...             # Optional — Prescription OCR (mock without)
```
