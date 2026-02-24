import os
from fastapi import FastAPI, UploadFile, File
from groq import Groq
import fitz

app = FastAPI()

def transcribe_audio_file():
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    with open("/tmp/doctor_notes.wav", "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
            response_format="json"
        )
    return transcription.text

def parse_pdf_document(pdf_bytes: bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

@app.post("/api/transcribe")
def transcribe():
    text = transcribe_audio_file()
    return {"transcription": text}

@app.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    content = await file.read()
    text = parse_pdf_document(content)
    return {"text": text}
