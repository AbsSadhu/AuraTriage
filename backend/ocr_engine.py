"""Prescription OCR Engine — Decode Indian doctor handwriting via Gemini Vision."""
import os
import json
import base64
from typing import Optional

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# Indian prescription decoding prompt
OCR_SYSTEM_PROMPT = """You are an expert Indian clinical pharmacist reading a handwritten OPD prescription slip.

TASK: Decode the handwritten prescription from the image with extreme precision.

IMPORTANT CONTEXT — Indian Medical Abbreviations:
- OD = Once Daily
- BD = Twice Daily  
- TDS = Thrice Daily (Three times a day)
- QDS = Four times a day
- SOS = If needed (as required)
- HS = At bedtime (Hora Somni)
- BBF = Before Breakfast
- ABF = After Breakfast
- PC = After food (Post Cibum)
- AC = Before food (Ante Cibum)
- STAT = Immediately
- Tab = Tablet, Cap = Capsule, Syp = Syrup, Inj = Injection
- s/l = sublingual, c/o = complaining of, k/a = known case of
- Rx = prescription, Dx = diagnosis, Hx = history

INSTRUCTIONS:
1. Identify each medication line from the prescription
2. For each medication, extract:
   - Drug name (map to standard generic molecule if possible)
   - Dosage (in mg/ml/mcg)
   - Frequency (decode OD/BD/TDS/SOS etc.)
   - Duration (days/weeks)
   - Route (oral/IV/IM/topical)
3. Also extract:
   - Patient name (if visible)
   - Doctor name and registration number (if visible)
   - Diagnosis / chief complaint (if written)
   - Any special instructions

CRITICAL: Indian doctors often write in a mix of English and Hindi. Common drug names include:
Dolo, Crocin, Augmentin, Glycomet, Telma, Ecosprin, Pan-D, Shelcal, Neurobion, Zincovit, etc.

Return your response as a JSON object:
{
    "medications": [
        {
            "drug_name": "...",
            "generic_molecule": "...",
            "dosage": "...",
            "frequency": "...",
            "frequency_decoded": "...",
            "duration": "...",
            "route": "oral"
        }
    ],
    "diagnosis": "...",
    "patient_name": "...",
    "doctor_name": "...",
    "special_instructions": "...",
    "confidence": 0.85,
    "raw_text": "..."
}"""


# Mock response for demo without API key
MOCK_OCR_RESPONSE = {
    "medications": [
        {
            "drug_name": "Augmentin 625",
            "generic_molecule": "Amoxicillin + Clavulanic Acid",
            "dosage": "625mg",
            "frequency": "BD",
            "frequency_decoded": "Twice daily after food",
            "duration": "5 days",
            "route": "oral"
        },
        {
            "drug_name": "Pan-D",
            "generic_molecule": "Pantoprazole 40mg + Domperidone 30mg",
            "dosage": "40mg/30mg",
            "frequency": "OD BBF",
            "frequency_decoded": "Once daily before breakfast",
            "duration": "7 days",
            "route": "oral"
        },
        {
            "drug_name": "Dolo 650",
            "generic_molecule": "Paracetamol",
            "dosage": "650mg",
            "frequency": "TDS SOS",
            "frequency_decoded": "Three times a day if needed (for fever/pain)",
            "duration": "3 days",
            "route": "oral"
        },
    ],
    "diagnosis": "Acute tonsillitis with fever",
    "patient_name": "Detected from slip",
    "doctor_name": "Dr. (illegible) — Reg. No. partially visible",
    "special_instructions": "Plenty of fluids. Warm saline gargle BD. Follow up after 5 days.",
    "confidence": 0.82,
    "raw_text": "[MOCK] Prescription decoded in demo mode — connect Google API key for live OCR."
}


def decode_prescription_image(image_data: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Decode a handwritten Indian prescription image.
    
    Uses Gemini 1.5 Flash vision model if API key available,
    otherwise returns mock demo response.
    """
    if not GEMINI_AVAILABLE or not GOOGLE_API_KEY:
        return {
            "success": True,
            "mode": "mock",
            "result": MOCK_OCR_RESPONSE,
            "message": "Running in demo mode (no GOOGLE_API_KEY). Set the key for live OCR."
        }

    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        response = model.generate_content([
            OCR_SYSTEM_PROMPT,
            {"mime_type": mime_type, "data": image_data}
        ])
        
        # Try to parse JSON from response
        response_text = response.text
        
        # Extract JSON if wrapped in markdown code blocks
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()
        
        result = json.loads(json_str)
        
        return {
            "success": True,
            "mode": "live",
            "result": result,
            "message": "Prescription decoded successfully via Gemini Vision."
        }
    except json.JSONDecodeError:
        return {
            "success": True,
            "mode": "live",
            "result": {"raw_text": response_text, "medications": [], "confidence": 0.5},
            "message": "OCR completed but structured parsing partially failed."
        }
    except Exception as e:
        return {
            "success": False,
            "mode": "error",
            "result": MOCK_OCR_RESPONSE,
            "message": f"OCR failed: {str(e)}. Returning mock data."
        }
