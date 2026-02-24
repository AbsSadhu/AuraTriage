"""FastAPI Backend — India-Centric REST + WebSocket server for AuraTriage."""
import json
import asyncio
import os
import sys
import uuid
import base64

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import (
    init_db, get_all_patients, get_patient, get_full_patient_record,
    get_patient_by_abha, get_jan_aushadhi_alternative, get_all_jan_aushadhi_drugs,
    get_jan_aushadhi_by_molecule, get_diagnostic_centers,
    create_consent_request, verify_consent,
    create_patient, update_patient, delete_patient,
    create_encounter, delete_encounter,
    create_medication, update_medication, delete_medication,
    create_vitals,
    create_allergy, delete_allergy,
    create_lab_result,
)
from seed_data import seed
from nlp_engine import extract_symptoms, format_extraction_report, normalize_hinglish, decode_prescription_abbreviations
from risk_scorer import calculate_risk_score
from agents import run_crew_streaming
from ocr_engine import decode_prescription_image
from audio_engine import transcribe_audio
from pdf_parser import parse_pdf


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and seed data on startup."""
    init_db()
    seed()
    print("🇮🇳 AuraTriage India — Database initialized and seeded.")
    yield


app = FastAPI(
    title="AuraTriage India API",
    description="AI Clinical Orchestrator — Multi-Agent Triage System for Indian Healthcare (ABDM Compliant)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── REST Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/patients")
async def list_patients():
    """Get all patients — lightweight query (no sub-resource fetching)."""
    patients = get_all_patients()
    # Lightweight risk: age-based only (full risk calculated on patient detail view)
    for p in patients:
        age = p.get("age", 30)
        if age >= 70:
            p["risk"] = {"score": 55, "triage_level": "YELLOW"}
        elif age >= 50:
            p["risk"] = {"score": 35, "triage_level": "GREEN"}
        elif age <= 5:
            p["risk"] = {"score": 45, "triage_level": "YELLOW"}
        else:
            p["risk"] = {"score": 20, "triage_level": "GREEN"}
    return {"patients": patients}


@app.get("/api/patients/{patient_id}")
async def get_patient_detail(patient_id: str):
    """Get full patient record with risk score."""
    record = get_full_patient_record(patient_id)
    if not record:
        raise HTTPException(status_code=404, detail="Patient not found")
    risk = calculate_risk_score(record)
    return {"patient": record, "risk": risk}


@app.get("/api/patients/abha/{abha_number}")
async def get_patient_by_abha_number(abha_number: str):
    """Look up patient by 14-digit ABHA Health ID."""
    patient = get_patient_by_abha(abha_number)
    if not patient:
        raise HTTPException(status_code=404, detail="ABHA number not found")
    record = get_full_patient_record(patient["patient_id"])
    risk = calculate_risk_score(record)
    return {"patient": record, "risk": risk}


# ─── Patient CRUD ────────────────────────────────────────────────────────────

@app.post("/api/patients")
async def create_patient_endpoint(payload: dict):
    """Create a new patient record (FHIR Patient resource)."""
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Patient name is required")
    patient = create_patient(payload)
    return {"patient": patient, "message": "Patient created successfully"}


@app.put("/api/patients/{patient_id}")
async def update_patient_endpoint(patient_id: str, payload: dict):
    """Update an existing patient record."""
    existing = get_patient(patient_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")
    updated = update_patient(patient_id, payload)
    return {"patient": updated, "message": "Patient updated successfully"}


@app.delete("/api/patients/{patient_id}")
async def delete_patient_endpoint(patient_id: str):
    """Delete a patient and all associated records (cascade)."""
    deleted = delete_patient(patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": f"Patient {patient_id} and all records deleted"}


# ─── Encounter CRUD ──────────────────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/encounters")
async def create_encounter_endpoint(patient_id: str, payload: dict):
    """Create a new clinical encounter for a patient."""
    existing = get_patient(patient_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")
    encounter = create_encounter(patient_id, payload)
    return {"encounter": encounter, "message": "Encounter created"}


@app.delete("/api/encounters/{encounter_id}")
async def delete_encounter_endpoint(encounter_id: str):
    deleted = delete_encounter(encounter_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return {"message": "Encounter deleted"}


# ─── Medication CRUD ─────────────────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/medications")
async def create_medication_endpoint(patient_id: str, payload: dict):
    """Add a medication to a patient's chart."""
    if not payload.get("drug_name"):
        raise HTTPException(status_code=400, detail="drug_name is required")
    med = create_medication(patient_id, payload)
    return {"medication": med, "message": "Medication added"}


@app.put("/api/medications/{med_id}")
async def update_medication_endpoint(med_id: str, payload: dict):
    updated = update_medication(med_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"message": "Medication updated"}


@app.delete("/api/medications/{med_id}")
async def delete_medication_endpoint(med_id: str):
    deleted = delete_medication(med_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"message": "Medication deleted"}


# ─── Vitals CRUD ─────────────────────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/vitals")
async def create_vitals_endpoint(patient_id: str, payload: dict):
    """Record new vitals for a patient."""
    vitals = create_vitals(patient_id, payload)
    return {"vitals": vitals, "message": "Vitals recorded"}


# ─── Allergy CRUD ────────────────────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/allergies")
async def create_allergy_endpoint(patient_id: str, payload: dict):
    """Add an allergy to a patient's chart."""
    if not payload.get("allergen"):
        raise HTTPException(status_code=400, detail="allergen is required")
    allergy = create_allergy(patient_id, payload)
    return {"allergy": allergy, "message": "Allergy added"}


@app.delete("/api/allergies/{allergy_id}")
async def delete_allergy_endpoint(allergy_id: str):
    deleted = delete_allergy(allergy_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Allergy not found")
    return {"message": "Allergy deleted"}


# ─── Lab Results CRUD ────────────────────────────────────────────────────────

@app.post("/api/patients/{patient_id}/labs")
async def create_lab_result_endpoint(patient_id: str, payload: dict):
    """Add a lab result to a patient's chart."""
    if not payload.get("test_name"):
        raise HTTPException(status_code=400, detail="test_name is required")
    lab = create_lab_result(patient_id, payload)
    return {"lab_result": lab, "message": "Lab result added"}


@app.post("/api/extract-symptoms")
async def extract_symptoms_endpoint(payload: dict):
    """Extract symptoms from free text (supports Hinglish) using NLP engine."""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    # Normalize Hinglish → English first
    normalized = normalize_hinglish(text)
    symptoms = extract_symptoms(text)
    report = format_extraction_report(symptoms)
    
    # Also decode any prescription abbreviations
    decoded = decode_prescription_abbreviations(text)
    
    return {
        "symptoms": symptoms,
        "report": report,
        "original_text": text,
        "normalized_text": normalized,
        "decoded_abbreviations": decoded,
    }


# ─── Jan Aushadhi / PMBJP Endpoints ─────────────────────────────────────────

@app.get("/api/jan-aushadhi")
async def list_jan_aushadhi_drugs():
    """Get all Jan Aushadhi generic drug alternatives."""
    drugs = get_all_jan_aushadhi_drugs()
    return {"drugs": drugs, "count": len(drugs)}


@app.get("/api/jan-aushadhi/search/{query}")
async def search_jan_aushadhi(query: str):
    """Search Jan Aushadhi alternatives by brand name or molecule."""
    by_molecule = get_jan_aushadhi_by_molecule(query)
    by_brand = get_jan_aushadhi_alternative(query)
    results = by_molecule if by_molecule else ([by_brand] if by_brand else [])
    return {"query": query, "alternatives": results}


# ─── Diagnostic Center Routing ───────────────────────────────────────────────

@app.get("/api/diagnostics/{test_name}")
async def find_diagnostic_centers(test_name: str, pincode: str = None):
    """Find cheapest diagnostic labs for a test near patient's pincode."""
    centers = get_diagnostic_centers(test_name, pincode, limit=5)
    return {"test": test_name, "pincode": pincode, "centers": centers}


# ─── Prescription OCR ────────────────────────────────────────────────────────

@app.post("/api/ocr-prescription")
async def ocr_prescription(file: UploadFile = File(...)):
    """Decode a handwritten Indian prescription via Gemini Vision."""
    image_data = await file.read()
    mime_type = file.content_type or "image/jpeg"
    result = decode_prescription_image(image_data, mime_type)
    return result


# ─── Audio Transcription ────────────────────────────────────────────────────

@app.post("/api/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """Transcribe doctor's audio dictation via Groq Whisper (Hinglish supported)."""
    audio_data = await file.read()
    result = transcribe_audio(audio_data, file.filename or "recording.webm")
    return result


# ─── PDF Parsing ─────────────────────────────────────────────────────────────

@app.post("/api/parse-pdf")
async def parse_pdf_endpoint(file: UploadFile = File(...)):
    """Extract text from a discharge summary PDF via PyMuPDF."""
    pdf_data = await file.read()
    result = parse_pdf(pdf_data)
    return result


# ─── ABHA Consent Flow (ABDM Simulation) ────────────────────────────────────

@app.post("/api/abha/request-consent")
async def request_consent(payload: dict):
    """
    Simulate ABHA consent request.
    In production, this would trigger an OTP via ABDM HIE-CM.
    """
    patient_id = payload.get("patient_id")
    doctor_id = payload.get("doctor_id", "DOC001")
    purpose = payload.get("purpose", "Clinical triage and treatment")
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id required")
    
    # Generate a mock 4-digit consent PIN
    pin = str(uuid.uuid4().int)[:4]
    consent_id = create_consent_request(patient_id, doctor_id, purpose, pin)
    
    return {
        "consent_id": consent_id,
        "patient_id": patient_id,
        "status": "PENDING",
        "message": f"Consent PIN sent to patient's registered mobile. (Demo PIN: {pin})",
        "demo_pin": pin,  # Only in demo mode — remove in production
    }


@app.post("/api/abha/verify-consent")
async def verify_consent_endpoint(payload: dict):
    """Verify the consent PIN and unlock patient records."""
    consent_id = payload.get("consent_id")
    pin = payload.get("pin")
    
    if not consent_id or not pin:
        raise HTTPException(status_code=400, detail="consent_id and pin required")
    
    granted = verify_consent(consent_id, pin)
    
    if granted:
        return {
            "status": "GRANTED",
            "message": "Consent verified. Patient records unlocked for this session.",
            "consent_id": consent_id,
        }
    else:
        raise HTTPException(status_code=403, detail="Invalid consent PIN or expired consent request.")


# ─── Synchronous Triage ─────────────────────────────────────────────────────

@app.post("/api/triage")
async def triage_sync(payload: dict):
    """Synchronous triage (non-streaming). Use WebSocket for streaming."""
    patient_id = payload.get("patient_id")
    symptoms_text = payload.get("symptoms", "")

    record = get_full_patient_record(patient_id)
    if not record:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Extract NLP symptoms (with Hinglish normalization)
    nlp_symptoms = extract_symptoms(symptoms_text)
    nlp_report = format_extraction_report(nlp_symptoms)

    # Risk score
    risk = calculate_risk_score(record)

    # Format patient context for agents
    patient_context = _format_patient_context(record)

    # Run crew (blocking)
    results = await run_crew_streaming(
        patient_context=patient_context,
        symptoms_text=symptoms_text,
    )

    return {
        "patient_id": patient_id,
        "risk": risk,
        "nlp_extraction": {"symptoms": nlp_symptoms, "report": nlp_report},
        "agent_results": {
            "diagnostician": results[0] if len(results) > 0 else "",
            "pharmacologist": results[1] if len(results) > 1 else "",
            "financial_auditor": results[2] if len(results) > 2 else "",
            "abha_compliance": results[3] if len(results) > 3 else "",
        },
    }


# ─── WebSocket Endpoint (Streaming Agent Debate) ────────────────────────────

@app.websocket("/ws/triage/{patient_id}")
async def websocket_triage(websocket: WebSocket, patient_id: str):
    """Stream real-time agent debate for a patient triage."""
    await websocket.accept()

    try:
        # Wait for the clinician's symptom input
        data = await websocket.receive_text()
        message = json.loads(data)
        symptoms_text = message.get("symptoms", "")

        # Get patient record
        record = get_full_patient_record(patient_id)
        if not record:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Patient not found",
            }))
            await websocket.close()
            return

        # Send NLP extraction (with Hinglish support)
        nlp_symptoms = extract_symptoms(symptoms_text)
        nlp_report = format_extraction_report(nlp_symptoms)
        await websocket.send_text(json.dumps({
            "type": "nlp_extraction",
            "symptoms": nlp_symptoms,
            "report": nlp_report,
        }))

        # Send risk score
        risk = calculate_risk_score(record)
        await websocket.send_text(json.dumps({
            "type": "risk_score",
            "risk": risk,
        }))

        # Format context for agents
        patient_context = _format_patient_context(record)

        # Stream agent outputs
        async def stream_callback(event: dict):
            await websocket.send_text(json.dumps(event))

        await run_crew_streaming(
            patient_context=patient_context,
            symptoms_text=symptoms_text,
            on_agent_output=stream_callback,
        )

    except WebSocketDisconnect:
        print(f"Client disconnected for patient {patient_id}")
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": str(e),
            }))
        except Exception:
            pass


def _format_patient_context(record: dict) -> str:
    """Format a full patient record into a readable text block for agents."""
    lines = []
    lines.append(f"**Patient:** {record['name']} (ID: {record['patient_id']})")
    lines.append(f"**ABHA Number:** {record.get('abha_number', 'N/A')}")
    lines.append(f"**Age:** {record.get('age', 'N/A')} | **Gender:** {record.get('gender', 'N/A')} | **Insurance:** {record.get('insurance_tier', 'N/A')}")
    lines.append(f"**City:** {record.get('city', 'N/A')} | **Pincode:** {record.get('pincode', 'N/A')}")

    # Vitals (°C)
    vitals = record.get("vitals", [])
    if vitals:
        v = vitals[0]
        lines.append(f"\n**Latest Vitals:** HR {v.get('heart_rate')} | BP {v.get('blood_pressure_systolic')}/{v.get('blood_pressure_diastolic')} | "
                      f"Temp {v.get('temperature')}°C | SpO2 {v.get('oxygen_saturation')}% | RR {v.get('respiratory_rate')}")

    # Medications (Indian brand names)
    meds = record.get("medications", [])
    if meds:
        lines.append("\n**Active Medications:**")
        for m in meds:
            lines.append(f"- {m['drug_name']} {m['dosage']} ({m.get('frequency', '')}) — Status: {m['status']}")

    # Allergies
    allergies = record.get("allergies", [])
    if allergies:
        lines.append("\n**Allergies:**")
        for a in allergies:
            lines.append(f"- ⚠️ {a['allergen']} → {a.get('reaction', 'Unknown')} (Severity: {a.get('severity', 'Unknown')})")

    # Recent encounters (Hinglish descriptions)
    encounters = record.get("encounters", [])
    if encounters:
        enc = encounters[0]
        lines.append(f"\n**Latest Encounter ({enc.get('date', 'N/A')}):**")
        lines.append(f"- Chief Complaint: {enc.get('chief_complaint', 'N/A')}")
        lines.append(f"- Symptoms: {enc.get('symptoms', 'N/A')}")
        lines.append(f"- Notes: {enc.get('notes', 'N/A')}")

    # Lab results
    labs = record.get("lab_results", [])
    if labs:
        lines.append("\n**Lab Results:**")
        for l in labs:
            flag = f" [{l['flag']}]" if l.get("flag") and l["flag"] != "NORMAL" else ""
            lines.append(f"- {l['test_name']}: {l['result_value']} {l.get('unit', '')}{flag} (Ref: {l.get('reference_range', 'N/A')})")

    return "\n".join(lines)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
