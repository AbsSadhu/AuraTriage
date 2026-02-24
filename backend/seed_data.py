"""Seed the database with realistic Indian healthcare data."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import supabase


def seed():
    """Seed the Supabase database with Indian healthcare data. Uses upsert to handle re-runs."""

    # Clear existing data (order matters due to foreign keys)
    for table in ["lab_results", "allergies", "vitals", "medications", "encounters",
                  "jan_aushadhi_drugs", "diagnostic_centers", "consent_log", "patients"]:
        try:
            supabase.table(table).delete().neq("patient_id" if table != "jan_aushadhi_drugs" and table != "diagnostic_centers" else "drug_id" if table == "jan_aushadhi_drugs" else "center_id", "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING").execute()
        except Exception:
            pass  # Table might not exist yet

    # Seed patients
    patients = [
        {"patient_id": p[0], "abha_number": p[1], "name": p[2], "dob": p[3], "age": p[4], "gender": p[5], "insurance_tier": p[6], "city": p[7], "pincode": p[8], "phone": p[9]}
        for p in PATIENTS
    ]
    supabase.table("patients").upsert(patients).execute()

    # Seed encounters
    encounters = [
        {"encounter_id": e[0], "patient_id": e[1], "date": e[2], "chief_complaint": e[3], "symptoms": e[4], "notes": e[5]}
        for e in ENCOUNTERS
    ]
    supabase.table("encounters").upsert(encounters).execute()

    # Seed medications
    medications = [
        {"med_id": m[0], "patient_id": m[1], "drug_name": m[2], "dosage": m[3], "frequency": m[4], "status": m[5]}
        for m in MEDICATIONS
    ]
    supabase.table("medications").upsert(medications).execute()

    # Seed vitals
    vitals = [
        {"vital_id": v[0], "patient_id": v[1], "timestamp": v[2], "heart_rate": v[3], "blood_pressure_systolic": v[4], "blood_pressure_diastolic": v[5], "temperature": v[6], "oxygen_saturation": int(v[7]), "respiratory_rate": v[8]}
        for v in VITALS
    ]
    supabase.table("vitals").upsert(vitals).execute()

    # Seed allergies
    allergies = [
        {"allergy_id": a[0], "patient_id": a[1], "allergen": a[2], "reaction": a[3], "severity": a[4]}
        for a in ALLERGIES
    ]
    supabase.table("allergies").upsert(allergies).execute()

    # Seed lab results
    labs = [
        {"lab_id": l[0], "patient_id": l[1], "test_name": l[2], "result_value": l[3], "unit": l[4], "reference_range": l[5], "status": l[6], "date": l[7]}
        for l in LAB_RESULTS
    ]
    supabase.table("lab_results").upsert(labs).execute()

    # Seed Jan Aushadhi drugs
    jan_drugs = [
        {"drug_id": j[0], "generic_name": j[1], "brand_name": j[2], "category": j[3], "brand_price_inr": j[4], "jan_aushadhi_price_inr": j[5], "pmbjp_available": j[6], "molecule": j[7], "savings_percent": round((1 - j[5]/j[4]) * 100, 1) if j[4] > 0 else 0}
        for j in JAN_AUSHADHI_DRUGS
    ]
    supabase.table("jan_aushadhi_drugs").upsert(jan_drugs).execute()

    # Seed diagnostic centers
    centers = [
        {"center_id": d[0], "center_name": d[1], "city": d[2], "pincode": d[3], "test_name": d[4], "price_inr": d[5], "distance_km": d[6], "turnaround_hours": d[7]}
        for d in DIAGNOSTIC_CENTERS
    ]
    supabase.table("diagnostic_centers").upsert(centers).execute()

    print(f"🇮🇳 Seeded Supabase database: {len(PATIENTS)} patients (ABHA), "
          f"{len(ENCOUNTERS)} encounters, {len(MEDICATIONS)} medications, "
          f"{len(VITALS)} vitals, {len(ALLERGIES)} allergies, "
          f"{len(LAB_RESULTS)} lab results, {len(JAN_AUSHADHI_DRUGS)} Jan Aushadhi drugs, "
          f"{len(DIAGNOSTIC_CENTERS)} diagnostic centers")


if __name__ == "__main__":
    seed()



# ─── Indian Patients with ABHA Numbers ──────────────────────────────────────

PATIENTS = [
    # (patient_id, abha_number, name, dob, age, gender, insurance_tier, city, pincode, phone)
    ("P001", "91-1234-5678-9012", "Rajesh Kumar Sharma", "1958-03-12", 67, "M", "PMJAY", "Delhi", "110001", "+919876543210"),
    ("P002", "91-2345-6789-0123", "Priya Nair", "1990-07-24", 35, "F", "Private", "Mumbai", "400001", "+919876543211"),
    ("P003", "91-3456-7890-1234", "Anita Devi", "1975-11-05", 50, "F", "CGHS", "Lucknow", "226001", "+919876543212"),
    ("P004", "91-4567-8901-2345", "Mohammed Irfan Khan", "2001-01-18", 25, "M", "ESIC", "Hyderabad", "500001", "+919876543213"),
    ("P005", "91-5678-9012-3456", "Kamala Devi Agarwal", "1945-06-30", 80, "F", "PMJAY", "Varanasi", "221001", "+919876543214"),
    ("P006", "91-6789-0123-4567", "Suresh Babu Reddy", "1983-09-14", 42, "M", "Private", "Bengaluru", "560001", "+919876543215"),
    ("P007", "91-7890-1234-5678", "Fatima Begum", "1969-02-22", 57, "F", "PMJAY", "Patna", "800001", "+919876543216"),
    ("P008", "91-8901-2345-6789", "Arjun Singh Thakur", "1995-12-01", 30, "M", "Self-Pay", "Jaipur", "302001", "+919876543217"),
    ("P009", "91-9012-3456-7890", "Lakshmi Iyer", "1952-08-19", 73, "F", "CGHS", "Chennai", "600001", "+919876543218"),
    ("P010", "91-0123-4567-8901", "Vikram Patel", "1988-04-07", 37, "M", "ESIC", "Ahmedabad", "380001", "+919876543219"),
]

# ─── Encounters with Hinglish + Indian symptoms ─────────────────────────────

ENCOUNTERS = [
    ("E001", "P001", "2026-02-20", "Seene mein dard (chest pain)", "Substernal chest pain radiating to left arm with pasina aana (diaphoresis), saans phoolna (shortness of breath). ECG ordered stat.", "Triage level 2 — suspected ACS. Referred from PHC Sarojini Nagar."),
    ("E002", "P002", "2026-02-21", "Severe migraine", "Severe throbbing sir dard (headache) for 3 days, photophobia, ulti (vomiting), visual aura. OPD visit — 3rd episode this month.", "History of menstrual migraine. Tried Dolo 650 at home — no relief."),
    ("E003", "P003", "2026-02-19", "Sugar follow-up (Diabetic)", "Zyada peshab aana (polyuria), zyada pyaas lagna (polydipsia), dhundla dikhna (blurred vision), pairon mein jhunjhunahat (tingling in feet)", "HbA1c trending up from 7.2 to 9.1. Non-compliant with Glycomet. District hospital referral."),
    ("E004", "P004", "2026-02-22", "Dengue suspected", "Tez bukhar (high fever) 104°F for 3 days, severe body ache, jodon mein dard (joint pain), skin rash, low platelet count suspected", "Came from local clinic after paracetamol not working. NS1 antigen ordered."),
    ("E005", "P005", "2026-02-18", "Bhoolna / Cognitive decline", "Yaaddaasht kamzor (memory loss), confusion, shabd nahi milte (difficulty finding words), raat ko bhatakna (wandering at night)", "Family worried — brought in by beta (son). MMSE score 18/30."),
    ("E006", "P006", "2026-02-22", "Ghabrahat (Anxiety attack)", "Dil ki dhadkan tez (palpitations), kaanpna (trembling), seene mein jakdan (chest tightness), sapne mein lag raha hai (derealization)", "Known GAD. IT professional — high work stress. Currently on Nexito 10mg."),
    ("E007", "P007", "2026-02-21", "BP bahut zyada (Hypertension crisis)", "Tez sir dard (severe headache), dhundla dikhna (blurred vision), BP 195/120, naak se khoon (epistaxis)", "Non-compliant with Telmisartan. Brought from Anganwadi worker referral."),
    ("E008", "P008", "2026-02-23", "Pet mein dard (Abdominal pain)", "Pet ke daayein neeche mein tez dard (sharp RLQ pain), ulti (nausea), halka bukhar (low-grade fever), rebound tenderness", "Appendicitis suspected. Surgical consult stat. Patient drove from village 40km away."),
    ("E009", "P009", "2026-02-20", "Saans ki taklif (COPD exacerbation)", "Saans phoolna badh rahi hai (worsening dyspnea), balgam wali khansi — hara balgam (productive cough with green sputum), seeti ki awaaz (wheezing)", "SpO2 88% on room air. Known COPD Gold Stage III. Using Tiova Rotacaps."),
    ("E010", "P010", "2026-02-22", "Chamdi pe dane (Skin rash)", "Pet aur baahon pe laal dane (erythematous papular rash on trunk and arms), khujli (pruritic), 5 din se", "No known allergen exposure. Rule out viral exanthem vs drug reaction."),
]

# ─── Indian Medications (Brand Names) ────────────────────────────────────────

MEDICATIONS = [
    ("M001", "P001", "Ecosprin 75", "75mg", "OD", "Active"),
    ("M002", "P001", "Atorva 40 (Atorvastatin)", "40mg", "OD HS", "Active"),
    ("M003", "P001", "Metolar XR (Metoprolol)", "50mg", "BD", "Active"),
    ("M004", "P002", "Suminat 50 (Sumatriptan)", "50mg", "SOS", "Active"),
    ("M005", "P003", "Glycomet GP 2 (Metformin+Glimepiride)", "1000mg/2mg", "BD PC", "Active"),
    ("M006", "P003", "Glynase MF (Glipizide+Metformin)", "5mg/500mg", "OD BBF", "Active"),
    ("M007", "P003", "Covance 20 (Losartan)", "20mg", "OD", "Active"),
    ("M008", "P005", "Donep 10 (Donepezil)", "10mg", "OD HS", "Active"),
    ("M009", "P005", "Admenta 10 (Memantine)", "10mg", "BD", "Active"),
    ("M010", "P006", "Nexito 10 (Escitalopram)", "10mg", "OD", "Active"),
    ("M011", "P007", "Amlodac 10 (Amlodipine)", "10mg", "OD", "Active"),
    ("M012", "P007", "Telma 40 (Telmisartan)", "40mg", "OD", "Non-compliant"),
    ("M013", "P007", "Aquazide 12.5 (Hydrochlorothiazide)", "12.5mg", "OD", "Non-compliant"),
    ("M014", "P009", "Tiova Rotacap (Tiotropium)", "18mcg", "OD inhaler", "Active"),
    ("M015", "P009", "Asthalin Inhaler (Salbutamol)", "100mcg", "SOS", "Active"),
    ("M016", "P009", "Omnacortil 40 (Prednisolone)", "40mg", "Taper 5 days", "Active"),
    ("M017", "P004", "Dolo 650 (Paracetamol)", "650mg", "TDS SOS", "Active"),
    ("M018", "P008", "Pan-D (Pantoprazole+Domperidone)", "40mg/30mg", "OD BBF", "Active"),
]

# ─── Vitals (Temperature in °C) ─────────────────────────────────────────────

VITALS = [
    # (vital_id, patient_id, timestamp, hr, sys_bp, dia_bp, temp_celsius, spo2, rr)
    ("V001", "P001", "2026-02-20 14:30:00", 102, 165, 95, 37.1, 96.0, 22),
    ("V002", "P002", "2026-02-21 09:15:00", 78, 125, 82, 36.8, 99.0, 16),
    ("V003", "P003", "2026-02-19 11:00:00", 88, 142, 90, 37.0, 98.0, 18),
    ("V004", "P004", "2026-02-22 16:45:00", 108, 100, 65, 40.0, 97.0, 22),
    ("V005", "P005", "2026-02-18 10:30:00", 68, 138, 84, 36.5, 97.0, 16),
    ("V006", "P006", "2026-02-22 13:00:00", 112, 148, 92, 37.0, 99.0, 24),
    ("V007", "P007", "2026-02-21 08:00:00", 96, 195, 120, 37.2, 97.0, 20),
    ("V008", "P008", "2026-02-23 07:30:00", 94, 130, 85, 38.4, 98.0, 20),
    ("V009", "P009", "2026-02-20 12:00:00", 92, 145, 88, 37.4, 88.0, 28),
    ("V010", "P010", "2026-02-22 15:00:00", 74, 122, 78, 37.0, 99.0, 16),
]

ALLERGIES = [
    ("A001", "P001", "Penicillin", "Anaphylaxis", "Severe"),
    ("A002", "P001", "Shellfish (Jhinga)", "Hives", "Moderate"),
    ("A003", "P003", "Sulfonamides", "Rash", "Mild"),
    ("A004", "P005", "Latex", "Contact dermatitis", "Moderate"),
    ("A005", "P007", "ACE Inhibitors", "Angioedema", "Severe"),
    ("A006", "P008", "Codeine", "Nausea/vomiting", "Moderate"),
    ("A007", "P009", "Aspirin", "Bronchospasm", "Severe"),
    ("A008", "P004", "Chloroquine", "Rash and itching", "Moderate"),
]

LAB_RESULTS = [
    ("L001", "P001", "Troponin I", "0.08", "ng/mL", "0.00-0.04", "HIGH", "2026-02-20"),
    ("L002", "P001", "BNP", "450", "pg/mL", "0-100", "HIGH", "2026-02-20"),
    ("L003", "P003", "HbA1c", "9.1", "%", "4.0-5.6", "HIGH", "2026-02-19"),
    ("L004", "P003", "Fasting Glucose", "210", "mg/dL", "70-100", "HIGH", "2026-02-19"),
    ("L005", "P003", "Creatinine", "1.8", "mg/dL", "0.7-1.3", "HIGH", "2026-02-19"),
    ("L006", "P005", "TSH", "5.8", "mIU/L", "0.4-4.0", "HIGH", "2026-02-18"),
    ("L007", "P005", "Vitamin B12", "180", "pg/mL", "200-900", "LOW", "2026-02-18"),
    ("L008", "P008", "WBC", "14200", "cells/mcL", "4500-11000", "HIGH", "2026-02-23"),
    ("L009", "P008", "CRP", "8.5", "mg/dL", "0-1.0", "HIGH", "2026-02-23"),
    ("L010", "P009", "ABG pH", "7.32", "", "7.35-7.45", "LOW", "2026-02-20"),
    ("L011", "P009", "ABG pCO2", "52", "mmHg", "35-45", "HIGH", "2026-02-20"),
    ("L012", "P010", "CBC", "Normal", "", "", "NORMAL", "2026-02-22"),
    ("L013", "P004", "Platelet Count", "85000", "cells/mcL", "150000-400000", "LOW", "2026-02-22"),
    ("L014", "P004", "NS1 Antigen", "Positive", "", "Negative", "HIGH", "2026-02-22"),
    ("L015", "P004", "Dengue IgM", "Positive", "", "Negative", "HIGH", "2026-02-22"),
]

# ─── Jan Aushadhi Drug Price Comparison (PMBJP Data) ────────────────────────

JAN_AUSHADHI_DRUGS = [
    # (drug_id, generic_name, brand_name, brand_manufacturer, brand_price_inr, generic_price_inr, pmbjp_available, molecule, category)
    ("JA001", "Paracetamol 650mg", "Dolo 650", "Micro Labs", 32.00, 6.50, True, "Paracetamol", "Analgesic"),
    ("JA002", "Amoxicillin+Clavulanic Acid 625mg", "Augmentin 625", "GSK", 210.00, 42.00, True, "Amoxicillin+Clavulanate", "Antibiotic"),
    ("JA003", "Atorvastatin 40mg", "Atorva 40", "Zydus", 185.00, 28.00, True, "Atorvastatin", "Statin"),
    ("JA004", "Metformin 1000mg", "Glycomet 1000", "USV", 115.00, 18.00, True, "Metformin", "Anti-diabetic"),
    ("JA005", "Telmisartan 40mg", "Telma 40", "Glenmark", 142.00, 22.00, True, "Telmisartan", "Anti-hypertensive"),
    ("JA006", "Amlodipine 10mg", "Amlodac 10", "Zydus", 98.00, 12.00, True, "Amlodipine", "Anti-hypertensive"),
    ("JA007", "Pantoprazole 40mg", "Pan 40", "Alkem", 125.00, 15.00, True, "Pantoprazole", "PPI"),
    ("JA008", "Azithromycin 500mg", "Azee 500", "Cipla", 98.00, 18.50, True, "Azithromycin", "Antibiotic"),
    ("JA009", "Cetirizine 10mg", "Alerid 10", "Cipla", 45.00, 5.00, True, "Cetirizine", "Antihistamine"),
    ("JA010", "Omeprazole 20mg", "Omez 20", "Dr Reddy's", 85.00, 10.00, True, "Omeprazole", "PPI"),
    ("JA011", "Metoprolol 50mg", "Metolar XR 50", "Cipla", 78.00, 14.00, True, "Metoprolol", "Beta-blocker"),
    ("JA012", "Losartan 50mg", "Covance 50", "Ranbaxy", 112.00, 16.00, True, "Losartan", "ARB"),
    ("JA013", "Clopidogrel 75mg", "Clopitab 75", "Lupin", 135.00, 20.00, True, "Clopidogrel", "Antiplatelet"),
    ("JA014", "Rosuvastatin 10mg", "Rosuvas 10", "Ranbaxy", 165.00, 25.00, True, "Rosuvastatin", "Statin"),
    ("JA015", "Glimepiride 2mg", "Amaryl 2", "Sanofi", 158.00, 12.00, True, "Glimepiride", "Anti-diabetic"),
    ("JA016", "Escitalopram 10mg", "Nexito 10", "Sun Pharma", 120.00, 18.00, True, "Escitalopram", "SSRI"),
    ("JA017", "Montelukast 10mg", "Montair 10", "Cipla", 175.00, 22.00, True, "Montelukast", "Anti-asthmatic"),
    ("JA018", "Rabeprazole 20mg", "Razo 20", "Dr Reddy's", 110.00, 14.00, True, "Rabeprazole", "PPI"),
    ("JA019", "Hydrochlorothiazide 12.5mg", "Aquazide 12.5", "Sun Pharma", 35.00, 5.00, True, "Hydrochlorothiazide", "Diuretic"),
    ("JA020", "Prednisolone 40mg", "Omnacortil 40", "Macleods", 95.00, 15.00, True, "Prednisolone", "Corticosteroid"),
]

# ─── Diagnostic Centers (Mock Tata 1mg / Pharmeasy / Local Labs) ─────────────

DIAGNOSTIC_CENTERS = [
    # (center_id, center_name, city, pincode, test_name, price_inr, distance_km, turnaround_hours)
    ("DC001", "Dr. Lal PathLabs", "Delhi", "110001", "Lipid Profile", 450, 1.2, 6),
    ("DC002", "SRL Diagnostics", "Delhi", "110003", "Lipid Profile", 520, 3.5, 8),
    ("DC003", "Thyrocare", "Delhi", "110005", "Lipid Profile", 350, 5.0, 12),
    ("DC004", "Dr. Lal PathLabs", "Delhi", "110001", "CBC (Complete Blood Count)", 250, 1.2, 4),
    ("DC005", "Metropolis", "Delhi", "110002", "CBC (Complete Blood Count)", 310, 2.0, 6),
    ("DC006", "Thyrocare", "Delhi", "110005", "CBC (Complete Blood Count)", 199, 5.0, 8),
    ("DC007", "Tata 1mg Labs", "Mumbai", "400001", "Dengue NS1 + IgM Panel", 650, 1.5, 6),
    ("DC008", "SRL Diagnostics", "Mumbai", "400003", "Dengue NS1 + IgM Panel", 800, 3.0, 8),
    ("DC009", "Thyrocare", "Mumbai", "400005", "Dengue NS1 + IgM Panel", 550, 4.0, 12),
    ("DC010", "Dr. Lal PathLabs", "Delhi", "110001", "HbA1c", 380, 1.2, 6),
    ("DC011", "Tata 1mg Labs", "Delhi", "110002", "HbA1c", 320, 2.0, 8),
    ("DC012", "Thyrocare", "Delhi", "110005", "HbA1c", 280, 5.0, 12),
    ("DC013", "Metropolis", "Bengaluru", "560001", "Liver Function Test", 500, 1.8, 6),
    ("DC014", "Dr. Lal PathLabs", "Bengaluru", "560002", "Liver Function Test", 450, 3.0, 8),
    ("DC015", "Thyrocare", "Bengaluru", "560005", "Liver Function Test", 380, 4.5, 12),
    ("DC016", "SRL Diagnostics", "Chennai", "600001", "Thyroid Profile (T3/T4/TSH)", 420, 2.0, 6),
    ("DC017", "Thyrocare", "Chennai", "600005", "Thyroid Profile (T3/T4/TSH)", 300, 5.0, 8),
    ("DC018", "Dr. Lal PathLabs", "Hyderabad", "500001", "Troponin I", 900, 1.5, 4),
    ("DC019", "Tata 1mg Labs", "Hyderabad", "500003", "Troponin I", 750, 3.0, 6),
    ("DC020", "Thyrocare", "Hyderabad", "500005", "Troponin I", 650, 5.0, 8),
]



