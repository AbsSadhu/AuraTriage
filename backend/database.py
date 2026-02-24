"""Database layer — Supabase (Postgres) with FHIR R4 compliant schema."""
import os
import uuid
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_db():
    """No-op for Supabase — schema is managed via SQL Editor migration."""
    pass


# ─── READ: Patients ──────────────────────────────────────────────────────────

def get_all_patients():
    result = supabase.table("patients").select("*").order("name").execute()
    return result.data


def get_patient(patient_id: str):
    result = supabase.table("patients").select("*").eq("patient_id", patient_id).execute()
    return result.data[0] if result.data else None


def get_patient_by_abha(abha_number: str):
    result = supabase.table("patients").select("*").eq("abha_number", abha_number).execute()
    return result.data[0] if result.data else None


def get_patient_encounters(patient_id: str):
    result = supabase.table("encounters").select("*").eq("patient_id", patient_id).order("date", desc=True).execute()
    return result.data


def get_patient_medications(patient_id: str):
    result = supabase.table("medications").select("*").eq("patient_id", patient_id).order("status").execute()
    return result.data


def get_patient_vitals(patient_id: str):
    result = supabase.table("vitals").select("*").eq("patient_id", patient_id).order("timestamp", desc=True).limit(5).execute()
    return result.data


def get_patient_allergies(patient_id: str):
    result = supabase.table("allergies").select("*").eq("patient_id", patient_id).execute()
    return result.data


def get_patient_lab_results(patient_id: str):
    result = supabase.table("lab_results").select("*").eq("patient_id", patient_id).order("date", desc=True).execute()
    return result.data


def get_full_patient_record(patient_id: str):
    """Aggregate all data for a patient into a single dict."""
    patient = get_patient(patient_id)
    if not patient:
        return None
    patient["encounters"] = get_patient_encounters(patient_id)
    patient["medications"] = get_patient_medications(patient_id)
    patient["vitals"] = get_patient_vitals(patient_id)
    patient["allergies"] = get_patient_allergies(patient_id)
    patient["lab_results"] = get_patient_lab_results(patient_id)
    return patient


# ─── CRUD: Patients ──────────────────────────────────────────────────────────

def create_patient(data: dict) -> dict:
    patient_id = data.get("patient_id", f"P{uuid.uuid4().hex[:6].upper()}")
    row = {
        "patient_id": patient_id,
        "abha_number": data.get("abha_number"),
        "name": data["name"],
        "dob": data.get("dob"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "insurance_tier": data.get("insurance_tier", "Self-Pay"),
        "city": data.get("city"),
        "pincode": data.get("pincode"),
        "phone": data.get("phone"),
    }
    supabase.table("patients").insert(row).execute()
    return get_patient(patient_id)


def update_patient(patient_id: str, data: dict) -> dict:
    update_fields = {}
    for key in ["abha_number", "name", "dob", "age", "gender", "insurance_tier", "city", "pincode", "phone"]:
        if key in data:
            update_fields[key] = data[key]
    if update_fields:
        supabase.table("patients").update(update_fields).eq("patient_id", patient_id).execute()
    return get_patient(patient_id)


def delete_patient(patient_id: str) -> bool:
    # CASCADE handles child records automatically in Supabase/Postgres
    result = supabase.table("patients").delete().eq("patient_id", patient_id).execute()
    return len(result.data) > 0 if result.data else False


# ─── CRUD: Encounters ────────────────────────────────────────────────────────

def create_encounter(patient_id: str, data: dict) -> dict:
    encounter_id = data.get("encounter_id", f"E{uuid.uuid4().hex[:8].upper()}")
    row = {
        "encounter_id": encounter_id,
        "patient_id": patient_id,
        "date": data.get("date", date.today().isoformat()),
        "chief_complaint": data.get("chief_complaint", ""),
        "symptoms": data.get("symptoms", ""),
        "notes": data.get("notes", ""),
    }
    supabase.table("encounters").insert(row).execute()
    return {"encounter_id": encounter_id, "patient_id": patient_id, **data}


def delete_encounter(encounter_id: str) -> bool:
    result = supabase.table("encounters").delete().eq("encounter_id", encounter_id).execute()
    return len(result.data) > 0 if result.data else False


# ─── CRUD: Medications ───────────────────────────────────────────────────────

def create_medication(patient_id: str, data: dict) -> dict:
    med_id = data.get("med_id", f"M{uuid.uuid4().hex[:8].upper()}")
    row = {
        "med_id": med_id,
        "patient_id": patient_id,
        "drug_name": data["drug_name"],
        "dosage": data.get("dosage", ""),
        "frequency": data.get("frequency", "OD"),
        "status": data.get("status", "active"),
    }
    supabase.table("medications").insert(row).execute()
    return {"med_id": med_id, "patient_id": patient_id, **data}


def update_medication(med_id: str, data: dict) -> bool:
    update_fields = {}
    for key in ["drug_name", "dosage", "frequency", "status"]:
        if key in data:
            update_fields[key] = data[key]
    if not update_fields:
        return False
    supabase.table("medications").update(update_fields).eq("med_id", med_id).execute()
    return True


def delete_medication(med_id: str) -> bool:
    result = supabase.table("medications").delete().eq("med_id", med_id).execute()
    return len(result.data) > 0 if result.data else False


# ─── CRUD: Vitals ────────────────────────────────────────────────────────────

def create_vitals(patient_id: str, data: dict) -> dict:
    vital_id = data.get("vital_id", f"V{uuid.uuid4().hex[:8].upper()}")
    row = {
        "vital_id": vital_id,
        "patient_id": patient_id,
        "timestamp": data.get("timestamp", datetime.now().isoformat()),
        "heart_rate": data.get("heart_rate"),
        "blood_pressure_systolic": data.get("blood_pressure_systolic"),
        "blood_pressure_diastolic": data.get("blood_pressure_diastolic"),
        "temperature": data.get("temperature"),
        "oxygen_saturation": data.get("oxygen_saturation"),
        "respiratory_rate": data.get("respiratory_rate"),
    }
    supabase.table("vitals").insert(row).execute()
    return {"vital_id": vital_id, "patient_id": patient_id, **data}


# ─── CRUD: Allergies ─────────────────────────────────────────────────────────

def create_allergy(patient_id: str, data: dict) -> dict:
    allergy_id = data.get("allergy_id", f"A{uuid.uuid4().hex[:8].upper()}")
    row = {
        "allergy_id": allergy_id,
        "patient_id": patient_id,
        "allergen": data["allergen"],
        "severity": data.get("severity", "moderate"),
        "reaction": data.get("reaction", ""),
    }
    supabase.table("allergies").insert(row).execute()
    return {"allergy_id": allergy_id, "patient_id": patient_id, **data}


def delete_allergy(allergy_id: str) -> bool:
    result = supabase.table("allergies").delete().eq("allergy_id", allergy_id).execute()
    return len(result.data) > 0 if result.data else False


# ─── CRUD: Lab Results ───────────────────────────────────────────────────────

def create_lab_result(patient_id: str, data: dict) -> dict:
    lab_id = data.get("lab_id", f"L{uuid.uuid4().hex[:8].upper()}")
    row = {
        "lab_id": lab_id,
        "patient_id": patient_id,
        "test_name": data["test_name"],
        "result_value": data.get("result_value", ""),
        "unit": data.get("unit", ""),
        "reference_range": data.get("reference_range", ""),
        "date": data.get("date", date.today().isoformat()),
        "status": data.get("status", "final"),
    }
    supabase.table("lab_results").insert(row).execute()
    return {"lab_id": lab_id, "patient_id": patient_id, **data}


# ─── Jan Aushadhi Queries ────────────────────────────────────────────────────

def get_jan_aushadhi_alternative(brand_name: str):
    result = supabase.table("jan_aushadhi_drugs").select("*").ilike("brand_name", f"%{brand_name}%").eq("pmbjp_available", True).execute()
    return result.data[0] if result.data else None


def get_all_jan_aushadhi_drugs():
    result = supabase.table("jan_aushadhi_drugs").select("*").order("generic_name").execute()
    return result.data


def get_jan_aushadhi_by_molecule(molecule: str):
    result = supabase.table("jan_aushadhi_drugs").select("*").or_(f"molecule.ilike.%{molecule}%,generic_name.ilike.%{molecule}%").execute()
    return result.data


# ─── Diagnostic Center Queries ───────────────────────────────────────────────

def get_diagnostic_centers(test_name: str, pincode: str = None, limit: int = 3):
    query = supabase.table("diagnostic_centers").select("*").ilike("test_name", f"%{test_name}%").order("price_inr").limit(limit)
    result = query.execute()
    return result.data


# ─── ABHA Consent ────────────────────────────────────────────────────────────

def create_consent_request(patient_id: str, doctor_id: str, purpose: str, pin: str):
    consent_id = f"C{uuid.uuid4().hex[:8].upper()}"
    row = {
        "consent_id": consent_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "purpose": purpose,
        "consent_pin": pin,
        "granted_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=1)).isoformat(),
        "status": "PENDING",
    }
    supabase.table("consent_log").insert(row).execute()
    return consent_id


def verify_consent(consent_id: str, pin: str) -> bool:
    result = supabase.table("consent_log").select("*").eq("consent_id", consent_id).eq("consent_pin", pin).eq("status", "PENDING").execute()
    if result.data:
        supabase.table("consent_log").update({"status": "GRANTED"}).eq("consent_id", consent_id).execute()
        return True
    return False
