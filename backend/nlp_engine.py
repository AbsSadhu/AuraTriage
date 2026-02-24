"""NLP Symptom Extraction Engine — India-specific with Hinglish + prescription abbreviations."""
import re
from typing import Optional


# ─── Indian Prescription Abbreviations ──────────────────────────────────────
PRESCRIPTION_ABBREVS = {
    "OD": "Once daily",
    "BD": "Twice daily",
    "TDS": "Thrice daily (Three times a day)",
    "QDS": "Four times a day",
    "SOS": "If needed (as required)",
    "HS": "At bedtime (Hora Somni)",
    "BBF": "Before breakfast",
    "ABF": "After breakfast",
    "PC": "After food (Post Cibum)",
    "AC": "Before food (Ante Cibum)",
    "STAT": "Immediately",
    "PRN": "As needed",
    "TAB": "Tablet",
    "CAP": "Capsule",
    "SYP": "Syrup",
    "INJ": "Injection",
    "IU": "International Units",
    "ML": "Millilitres",
    "GM": "Grams",
    "MG": "Milligrams",
    "MCG": "Micrograms",
}


# ─── Hinglish → English Symptom Mappings ────────────────────────────────────
HINGLISH_MAP = {
    # Hindi/Hinglish phrase → standard English symptom
    "seene mein dard": "chest pain",
    "chhati mein dard": "chest pain",
    "sine mein dard": "chest pain",
    "dil mein dard": "chest pain",
    "sir dard": "headache",
    "sar dard": "headache",
    "sir mein dard": "headache",
    "ulti": "vomiting",
    "matli": "nausea",
    "ji machlana": "nausea",
    "bukhar": "fever",
    "tez bukhar": "high fever",
    "badan garam": "fever",
    "khansi": "cough",
    "suukhi khansi": "dry cough",
    "balgam wali khansi": "productive cough",
    "saans phoolna": "shortness of breath",
    "saans lene mein taklif": "shortness of breath",
    "dam ghutna": "shortness of breath",
    "chakkar aana": "dizziness",
    "sir ghoomna": "dizziness",
    "aankhon ke aage andhera": "syncope",
    "pet dard": "abdominal pain",
    "pet mein dard": "abdominal pain",
    "pet mein marod": "abdominal cramps",
    "kamar dard": "back pain",
    "peeth dard": "back pain",
    "jodon mein dard": "joint pain",
    "haath pair mein dard": "limb pain",
    "ghutno mein dard": "knee pain",
    "sujan": "swelling",
    "soojan": "swelling",
    "khujli": "pruritus",
    "chamdi pe dane": "skin rash",
    "dane nikal aaye": "skin rash",
    "dhundla dikhna": "blurred vision",
    "nazar kamzor": "blurred vision",
    "bhoolna": "memory loss",
    "yaaddaasht kamzor": "memory loss",
    "ghabrahat": "anxiety",
    "neend nahi aati": "insomnia",
    "kaanpna": "tremor",
    "jhunjhunahat": "tingling",
    "sunnpan": "numbness",
    "seeti ki awaaz": "wheezing",
    "gala kharab": "sore throat",
    "dast": "diarrhea",
    "qabz": "constipation",
    "wajan kam hona": "weight loss",
    "zyada peshab": "polyuria",
    "zyada pyaas": "polydipsia",
    "pasina aana": "diaphoresis",
    "naak se khoon": "epistaxis",
    "neel padna": "bruising",
    "dil ki dhadkan tez": "palpitations",
    "jakdan": "chest tightness",
    "thakan": "fatigue",
    "kamzori": "weakness",
    "pairon mein sujan": "pedal edema",
    "khoon ki ulti": "hematemesis",
    "latrine mein khoon": "rectal bleeding",
    "zyada peshab aana": "polyuria",
    "zyada pyaas lagna": "polydipsia",
    "pairon mein jhunjhunahat": "peripheral neuropathy",
}


# ─── Symptom → ICD-10 Mapping (expanded for India) ──────────────────────────
ICD10_MAP = {
    # General
    "chest pain": "R07.9",
    "shortness of breath": "R06.0",
    "dyspnea": "R06.0",
    "headache": "R51.9",
    "migraine": "G43.909",
    "nausea": "R11.0",
    "vomiting": "R11.10",
    "fever": "R50.9",
    "high fever": "R50.9",
    "cough": "R05.9",
    "dry cough": "R05.9",
    "productive cough": "R05.09",
    "fatigue": "R53.83",
    "weakness": "R53.1",
    "dizziness": "R42",
    "syncope": "R55",
    "palpitations": "R00.2",
    "chest tightness": "R07.89",
    "abdominal pain": "R10.9",
    "abdominal cramps": "R10.84",
    "back pain": "M54.9",
    "joint pain": "M25.50",
    "knee pain": "M25.569",
    "limb pain": "M79.609",
    "swelling": "R60.9",
    "pedal edema": "R60.0",
    "skin rash": "R21",
    "pruritus": "L29.9",
    "blurred vision": "H53.8",
    "memory loss": "R41.3",
    "confusion": "R41.0",
    "anxiety": "F41.9",
    "depression": "F32.9",
    "insomnia": "G47.00",
    "tremor": "R25.1",
    "numbness": "R20.0",
    "tingling": "R20.2",
    "peripheral neuropathy": "G62.9",
    "wheezing": "R06.2",
    "sore throat": "J02.9",
    "diarrhea": "R19.7",
    "constipation": "K59.00",
    "weight loss": "R63.4",
    "polyuria": "R35.8",
    "polydipsia": "R63.1",
    "diaphoresis": "R61",
    "epistaxis": "R04.0",
    "bruising": "R23.3",
    "rebound tenderness": "R10.9",
    "hematemesis": "K92.0",
    "rectal bleeding": "K62.5",

    # India-prevalent tropical / infectious diseases
    "dengue": "A90",
    "dengue hemorrhagic fever": "A91",
    "typhoid": "A01.0",
    "malaria": "B50.9",
    "falciparum malaria": "B50.0",
    "vivax malaria": "B51.9",
    "tuberculosis": "A15.0",
    "pulmonary TB": "A15.0",
    "chikungunya": "A92.0",
    "leptospirosis": "A27.9",
    "Japanese encephalitis": "A83.0",
    "kala-azar": "B55.0",
    "filariasis": "B74.9",
    "cholera": "A00.9",
    "hepatitis A": "B15.9",
    "hepatitis E": "B17.2",
    "scrub typhus": "A75.3",
    "H1N1 influenza": "J09.X2",
}


SEVERITY_KEYWORDS = {
    "severe": "high",
    "tez": "high",     # Hindi for intense/fast
    "bahut": "high",   # Hindi for very much
    "acute": "high",
    "intense": "high",
    "excruciating": "high",
    "worsening": "high",
    "badh rahi": "high",  # increasing (Hindi)
    "critical": "high",
    "jyada": "high",   # more/excessive (Hindi)
    "moderate": "medium",
    "thoda": "low",    # a little (Hindi)
    "halka": "low",    # light/mild (Hindi)
    "mild": "low",
    "slight": "low",
    "intermittent": "low",
    "chronic": "medium",
    "persistent": "medium",
    "kabhi kabhi": "low",  # sometimes (Hindi)
}

BODY_PARTS = [
    "head", "chest", "abdomen", "back", "neck", "throat", "arm", "leg",
    "knee", "ankle", "wrist", "shoulder", "hip", "foot", "hand", "eye",
    "ear", "stomach", "lung", "heart", "liver", "kidney", "spine",
    "pelvis", "groin", "flank", "trunk",
    # Hindi body parts
    "sir", "seena", "pet", "peeth", "kamar", "gala", "baazu", "tang",
    "ghutna", "haath", "pair", "aankh", "kaan", "dil", "jigar", "gurda",
]


def normalize_hinglish(text: str) -> str:
    """Translate Hinglish symptoms to standard English before extraction."""
    text_lower = text.lower()
    for hindi, english in sorted(HINGLISH_MAP.items(), key=lambda x: -len(x[0])):
        text_lower = text_lower.replace(hindi, english)
    return text_lower


def decode_prescription_abbreviations(text: str) -> str:
    """Replace Indian prescription abbreviations with full text."""
    result = text
    for abbrev, full in PRESCRIPTION_ABBREVS.items():
        # Match abbreviation as a whole word
        result = re.sub(rf'\b{abbrev}\b', f"{abbrev} ({full})", result, flags=re.IGNORECASE)
    return result


def extract_symptoms(text: str) -> list[dict]:
    """Extract structured symptoms from free-text clinician input (supports Hinglish)."""
    # First normalize Hinglish
    text_normalized = normalize_hinglish(text)
    text_lower = text_normalized.lower()
    found = []

    for symptom, icd_code in ICD10_MAP.items():
        if symptom in text_lower:
            severity = _detect_severity(text_lower, symptom)
            body_part = _detect_body_part(text_lower, symptom)
            found.append({
                "symptom": symptom,
                "icd10": icd_code,
                "severity": severity,
                "body_part": body_part,
            })

    return found


def _detect_severity(text: str, symptom: str) -> str:
    """Detect severity modifiers near the symptom mention."""
    idx = text.find(symptom)
    if idx == -1:
        return "unknown"

    window_start = max(0, idx - 80)
    window_end = min(len(text), idx + len(symptom) + 80)
    window = text[window_start:window_end]

    for keyword, level in SEVERITY_KEYWORDS.items():
        if keyword in window:
            return level
    return "medium"


def _detect_body_part(text: str, symptom: str) -> Optional[str]:
    """Detect body part mentions near the symptom."""
    idx = text.find(symptom)
    if idx == -1:
        return None

    window_start = max(0, idx - 50)
    window_end = min(len(text), idx + len(symptom) + 50)
    window = text[window_start:window_end]

    for part in BODY_PARTS:
        if part in window:
            return part
    return None


def format_extraction_report(symptoms: list[dict]) -> str:
    """Format extracted symptoms into a readable clinical summary."""
    if not symptoms:
        return "No specific symptoms could be extracted from the input."

    lines = ["## NLP Symptom Extraction Report", ""]
    for i, s in enumerate(symptoms, 1):
        severity_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(s["severity"], "⚪")
        body = f" ({s['body_part']})" if s["body_part"] else ""
        lines.append(
            f"{i}. {severity_emoji} **{s['symptom'].title()}**{body} — ICD-10: `{s['icd10']}` | Severity: {s['severity']}"
        )
    return "\n".join(lines)
