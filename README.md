<![CDATA[<div align="center">

<img src="https://img.shields.io/badge/AuraTriage-AI%20Clinical%20Orchestrator-14b8a6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMiAxMmgyTDUgNWwyIDEybDItOSAyIDYgMi04IDIgMTEgMi03IDIgNWgyIiBzdHJva2U9IiMxNGI4YTYiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=" />

# AuraTriage 🩺

**India's first multi-agent AI clinical orchestrator** — built for real-world emergency departments with ABDM compliance, Hinglish NLP, and production-grade Supabase backend.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

[**Live Demo**](http://localhost:3000) · [**API Docs**](http://localhost:8000/docs) · [**Supabase Dashboard**](https://supabase.com/dashboard)

</div>

---

## What is AuraTriage?

AuraTriage is an AI-powered clinical decision support system designed for Indian hospitals and emergency departments. It uses a **CrewAI multi-agent swarm** to autonomously triage patients, extract symptoms from unstructured notes, generate AI summaries, and recommend treatment paths — all in real-time.

### Key Capabilities
- 🤖 **Multi-Agent Swarm** — Specialist AI agents (Triage, Diagnosis, Medication, Summarizer) debate and converge on high-confidence clinical decisions
- 🇮🇳 **India-First** — ABHA number support, Jan Aushadhi drug substitutions, ICD-10 coding, Hinglish NLP
- 📋 **FHIR R4 Schema** — Production-grade PostgreSQL schema via Supabase
- 🔒 **ABDM Compliant** — Row Level Security, consent logging, data sovereignty
- 📄 **OCR + PDF Parsing** — Upload prescriptions, lab reports, and discharge summaries
- 🎙️ **Voice Transcription** — Groq Whisper for real-time audio-to-text symptom input
- ⚡ **Real-time Dashboard** — Doctor-facing UI with live patient vitals, risk scores, and swarm output

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)              │
│  Landing Page → Auth → Doctor Dashboard              │
│  React + Zustand + Framer Motion + Three.js          │
└─────────────────────┬───────────────────────────────┘
                       │ REST API
┌─────────────────────▼───────────────────────────────┐
│                  Backend (FastAPI)                    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │           CrewAI Agent Swarm                 │    │
│  │  TriageAgent → DiagnosisAgent               │    │
│  │  MedicationAgent → SummarizerAgent          │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  OCR Engine │ PDF Parser │ Audio Transcription       │
│  Risk Scorer │ Jan Aushadhi Lookup                   │
└─────────────────────┬───────────────────────────────┘
                       │ supabase-py
┌─────────────────────▼───────────────────────────────┐
│              Supabase (PostgreSQL)                    │
│  patients │ encounters │ medications │ vitals         │
│  allergies │ lab_results │ consent_log                │
│  jan_aushadhi_drugs │ diagnostic_centers              │
└─────────────────────────────────────────────────────┘
```

### AI Models (via OpenRouter + Gemini API)
| Agent | Model | Role |
|-------|-------|------|
| Triage | `deepseek/deepseek-r1` | Risk stratification |
| Diagnosis | `google/gemini-2.0-flash` | Differential diagnosis |
| Medication | `meta-llama/llama-3.3-70b-instruct` | Drug recommendations |
| Summarizer | `google/gemini-2.0-flash` | Clinical narrative |
| Transcription | `groq/whisper-large-v3` | Audio → text |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Animations** | Framer Motion, Lenis, Three.js / React Three Fiber |
| **State** | Zustand |
| **Backend** | FastAPI, Python 3.13, Uvicorn |
| **AI Orchestration** | CrewAI, LiteLLM, OpenRouter |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT) |
| **OCR** | Google Vision API / Tesseract |
| **Voice** | Groq Whisper |

---

## Project Structure

```
AuraTriage/
├── backend/
│   ├── main.py              # FastAPI app + all REST endpoints
│   ├── agents.py            # CrewAI swarm definition
│   ├── database.py          # Supabase client + CRUD operations
│   ├── seed_data.py         # Indian healthcare seed data
│   ├── risk_scorer.py       # Triage risk scoring engine (0–100)
│   ├── ocr_engine.py        # Image/PDF OCR
│   ├── pdf_parser.py        # Discharge summary parser
│   ├── mcp_db.py            # MCP database bridge
│   ├── supabase_migration.sql  # Database schema (run in Supabase SQL editor)
│   └── .env.example         # Required environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── dashboard/   # Doctor dashboard
│   │   │   └── auth/        # Login/signup
│   │   └── components/
│   │       ├── landing/     # Hero, BentoGrid, Beams, GlowCard
│   │       └── dashboard/   # PatientList, AddPatientModal, SwarmTimeline
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- API keys for: OpenRouter, Gemini, Groq

### 1. Database Setup
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new)
2. Copy and run the contents of `backend/supabase_migration.sql`
3. All 9 tables will be created with RLS policies

### 2. Backend Setup
```bash
cd backend

# Copy and fill in your API keys
cp .env.example .env

# Install dependencies
pip install -r requirements.txt

# Seed the database with Indian healthcare sample data
python -c "from seed_data import seed; seed()"

# Start the API server
python -m uvicorn main:app --port 8000 --reload
```

The API will be live at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be live at `http://localhost:3000`

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | List all patients |
| `POST` | `/api/patients` | Register new patient |
| `DELETE` | `/api/patients/{id}` | Delete patient (cascade) |
| `GET` | `/api/patients/{id}` | Full patient record |
| `POST` | `/api/triage` | Run AI swarm on patient |
| `POST` | `/api/ocr` | Extract text from image |
| `POST` | `/api/transcribe` | Transcribe audio |
| `GET` | `/api/drugs/substitutes/{name}` | Jan Aushadhi lookup |
| `GET` | `/api/diagnostics/{pincode}` | Nearby diagnostic centers |

---

## Features in Detail

### 🤖 AI Multi-Agent Swarm
The swarm is triggered via `POST /api/triage` with a patient ID. Four agents run sequentially:
1. **TriageAgent** — Scores severity (0–100), assigns triage level (GREEN/YELLOW/RED/BLACK)
2. **DiagnosisAgent** — Generates differential diagnosis with ICD-10 codes
3. **MedicationAgent** — Recommends medications with Jan Aushadhi alternatives
4. **SummarizerAgent** — Writes a structured clinical narrative

### 🩺 Risk Scoring Engine
India-specific weighted model considering:
- Vital sign abnormalities (°C temperature scale)
- Age-based risk (elderly + pediatric elevated)
- Active medication count (polypharmacy)
- Symptom severity (Hinglish + English keywords)
- Lab result flags
- Tropical disease keywords (dengue, malaria, typhoid, etc.)

### 📋 Jan Aushadhi Integration
Every medication recommendation includes the PMBJP Jan Aushadhi generic equivalent with savings percentage — reducing patient drug costs by up to 90%.

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

### Backend → Railway / Render
Set all environment variables from `.env.example` in the platform dashboard, then deploy the `backend/` folder with:
```
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## ABDM Compliance Notes
- All patient records use **ABHA numbers** as identifiers
- **Consent logging** via the `consent_log` table before any data access
- **Row Level Security** enabled on all Supabase tables
- No PHI is logged to application logs
- Data residency: Supabase India region recommended

---

## Contributing
Pull requests welcome. For major changes, open an issue first.

---

## License
MIT © 2026 [AbsSadhu](https://github.com/AbsSadhu)

---

<div align="center">
Built for India 🇮🇳 · Powered by AI · Designed for clinicians
</div>
]]>
