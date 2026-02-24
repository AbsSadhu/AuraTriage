"""Risk Scoring Engine — India-specific weighted triage model with °C temperatures."""


# Triage levels by score range
TRIAGE_LEVELS = {
    "BLACK":  {"min": 85, "max": 100, "label": "Immediate / Resuscitation", "color": "#1a1a2e"},
    "RED":    {"min": 65, "max": 84,  "label": "Emergency", "color": "#e74c3c"},
    "YELLOW": {"min": 40, "max": 64,  "label": "Urgent", "color": "#f39c12"},
    "GREEN":  {"min": 0,  "max": 39,  "label": "Non-Urgent / OPD", "color": "#2ecc71"},
}


def calculate_risk_score(patient_record: dict) -> dict:
    """
    Calculate a 0-100 risk score from patient data.

    Factors weighted:
    - Age (older = higher risk, pediatric = elevated)
    - Vital sign abnormalities (°C temperature scale)
    - Active medication count (polypharmacy risk)
    - Symptom severity from encounter (Hinglish + English keywords)
    - Lab result flags
    - Allergy count (interaction risk)
    - India-specific tropical disease keywords
    """
    score = 0.0
    breakdown = {}

    # --- Age factor (0-15 points) ---
    age = patient_record.get("age", 30)
    if age >= 75:
        age_score = 15
    elif age >= 65:
        age_score = 12
    elif age >= 50:
        age_score = 8
    elif age <= 5:
        age_score = 10  # Pediatric risk
    elif age <= 1:
        age_score = 14  # Neonatal risk
    else:
        age_score = 3
    score += age_score
    breakdown["age"] = age_score

    # --- Vitals factor (0-30 points) — Temperature in °C ---
    vitals_score = 0
    vitals = patient_record.get("vitals", [])
    if vitals:
        latest = vitals[0]
        hr = latest.get("heart_rate", 75)
        sys_bp = latest.get("blood_pressure_systolic", 120)
        dia_bp = latest.get("blood_pressure_diastolic", 80)
        temp = latest.get("temperature", 37.0)  # °C
        spo2 = latest.get("oxygen_saturation", 99)
        rr = latest.get("respiratory_rate", 16)

        # Heart rate
        if hr > 120 or hr < 50:
            vitals_score += 8
        elif hr > 100 or hr < 60:
            vitals_score += 4

        # Blood pressure
        if sys_bp > 180 or sys_bp < 90:
            vitals_score += 8
        elif sys_bp > 140 or dia_bp > 90:
            vitals_score += 4

        # Temperature (°C scale)
        if temp > 39.5 or temp < 35.0:    # ~103°F+ or hypothermia
            vitals_score += 6
        elif temp > 38.3:                  # ~100.9°F — low-grade fever
            vitals_score += 3

        # Oxygen saturation
        if spo2 < 90:
            vitals_score += 8
        elif spo2 < 94:
            vitals_score += 4

        # Respiratory rate
        if rr > 24 or rr < 10:
            vitals_score += 5
        elif rr > 20:
            vitals_score += 2

    vitals_score = min(vitals_score, 30)
    score += vitals_score
    breakdown["vitals"] = vitals_score

    # --- Medication count / polypharmacy (0-10 points) ---
    meds = patient_record.get("medications", [])
    active_meds = [m for m in meds if m.get("status") == "Active"]
    if len(active_meds) >= 5:
        med_score = 10
    elif len(active_meds) >= 3:
        med_score = 6
    elif len(active_meds) >= 1:
        med_score = 3
    else:
        med_score = 0
    score += med_score
    breakdown["medications"] = med_score

    # --- Symptom severity from encounters (0-20 points) ---
    symptom_score = 0
    encounters = patient_record.get("encounters", [])
    if encounters:
        latest_enc = encounters[0]
        symptoms_text = (latest_enc.get("symptoms", "") + " " + latest_enc.get("chief_complaint", "")).lower()

        # High severity (universal + India-specific)
        high_severity_keywords = [
            "chest pain", "seene mein dard", "seizure", "unconscious", "anaphylaxis",
            "stroke", "hemorrhage", "cardiac arrest", "respiratory failure", "sepsis",
            "radiating", "diaphoresis", "rebound tenderness",
            # India-specific tropical emergencies
            "dengue", "dengue hemorrhagic", "typhoid", "malaria", "falciparum",
            "meningitis", "encephalitis", "snakebite", "hematemesis",
            "platelet count low", "ns1 positive",
        ]
        medium_severity_keywords = [
            "severe", "tez", "bahut", "worsening", "badh rahi",
            "acute", "persistent", "high fever", "tez bukhar",
            "confusion", "non-compliant", "exacerbation",
            "chikungunya", "leptospirosis", "scrub typhus",
            "TB", "tuberculosis",
        ]

        for kw in high_severity_keywords:
            if kw in symptoms_text:
                symptom_score += 5

        for kw in medium_severity_keywords:
            if kw in symptoms_text:
                symptom_score += 3

    symptom_score = min(symptom_score, 20)
    score += symptom_score
    breakdown["symptoms"] = symptom_score

    # --- Lab result flags (0-15 points) ---
    lab_score = 0
    labs = patient_record.get("lab_results", [])
    for lab in labs:
        flag = lab.get("flag", "NORMAL").upper()
        test_name = lab.get("test_name", "").lower()
        if flag == "HIGH":
            # Critical lab values get extra weight
            if any(critical in test_name for critical in ["troponin", "ns1", "dengue", "crp"]):
                lab_score += 5
            else:
                lab_score += 3
        elif flag == "LOW":
            if "platelet" in test_name:
                lab_score += 5  # Low platelets = dengue risk
            else:
                lab_score += 2
    lab_score = min(lab_score, 15)
    score += lab_score
    breakdown["labs"] = lab_score

    # --- Allergy risk (0-10 points) ---
    allergies = patient_record.get("allergies", [])
    severe_allergies = [a for a in allergies if a.get("severity", "").lower() == "severe"]
    allergy_score = min(len(severe_allergies) * 5 + len(allergies) * 1, 10)
    score += allergy_score
    breakdown["allergies"] = allergy_score

    # Clamp to 0-100
    total_score = min(int(score), 100)

    # Determine triage level
    triage_level = "GREEN"
    for level, info in TRIAGE_LEVELS.items():
        if info["min"] <= total_score <= info["max"]:
            triage_level = level
            break

    return {
        "score": total_score,
        "triage_level": triage_level,
        "triage_label": TRIAGE_LEVELS[triage_level]["label"],
        "triage_color": TRIAGE_LEVELS[triage_level]["color"],
        "breakdown": breakdown,
    }
