-- AuraTriage Supabase Migration — FHIR R4 Compliant Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ═══════════════════════════════════════════════════════════════════
-- 1. PATIENTS (FHIR: Patient Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS patients (
    patient_id TEXT PRIMARY KEY,
    abha_number TEXT UNIQUE,
    name TEXT NOT NULL,
    dob DATE,
    age INTEGER,
    gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
    insurance_tier TEXT DEFAULT 'Self-Pay',
    city TEXT,
    pincode TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- 2. ENCOUNTERS (FHIR: Encounter Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS encounters (
    encounter_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    chief_complaint TEXT,
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- 3. MEDICATIONS (FHIR: MedicationStatement Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS medications (
    med_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- 4. VITALS (FHIR: Observation Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vitals (
    vital_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature REAL,
    oxygen_saturation INTEGER,
    respiratory_rate INTEGER
);

-- ═══════════════════════════════════════════════════════════════════
-- 5. ALLERGIES (FHIR: AllergyIntolerance Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS allergies (
    allergy_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    severity TEXT DEFAULT 'moderate',
    reaction TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- 6. LAB RESULTS (FHIR: DiagnosticReport Resource)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lab_results (
    lab_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    result_value TEXT,
    unit TEXT,
    reference_range TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'final'
);

-- ═══════════════════════════════════════════════════════════════════
-- 7. JAN AUSHADHI DRUGS (PMBJP Generic Drug Registry)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jan_aushadhi_drugs (
    drug_id TEXT PRIMARY KEY,
    generic_name TEXT NOT NULL,
    brand_name TEXT,
    molecule TEXT,
    brand_price_inr REAL,
    jan_aushadhi_price_inr REAL,
    savings_percent REAL,
    pmbjp_available BOOLEAN DEFAULT TRUE,
    category TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- 8. DIAGNOSTIC CENTERS (Lab Routing)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS diagnostic_centers (
    center_id TEXT PRIMARY KEY,
    center_name TEXT NOT NULL,
    city TEXT,
    pincode TEXT,
    test_name TEXT,
    price_inr REAL,
    distance_km REAL,
    turnaround_hours INTEGER
);

-- ═══════════════════════════════════════════════════════════════════
-- 9. CONSENT LOG (ABDM Compliance)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS consent_log (
    consent_id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id TEXT,
    purpose TEXT,
    consent_pin TEXT,
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING'
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Enable for production)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE jan_aushadhi_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Allow anon key full access for now (tighten later with auth)
CREATE POLICY "Allow all for anon" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON encounters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON medications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON allergies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lab_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON jan_aushadhi_drugs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON diagnostic_centers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON consent_log FOR ALL USING (true) WITH CHECK (true);
