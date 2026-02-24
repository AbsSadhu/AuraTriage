"""Audio Transcription Engine — Groq Whisper for Hinglish doctor dictation."""
import os
import tempfile
from pathlib import Path

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")


def transcribe_audio(audio_data: bytes, filename: str = "recording.webm") -> dict:
    """
    Transcribe doctor's audio dictation using Groq Whisper.
    
    Supports Hinglish/multilingual input natively.
    Uses whisper-large-v3-turbo for best price-to-performance.
    """
    if not GROQ_AVAILABLE or not GROQ_API_KEY:
        return {
            "success": False,
            "text": "",
            "message": "Groq SDK not available or GROQ_API_KEY not set."
        }

    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Write audio data to temp file
        suffix = Path(filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        # Transcribe using Groq Whisper
        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=f,
                language="hi",  # Hindi/Hinglish as primary
                response_format="verbose_json",
            )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return {
            "success": True,
            "text": transcription.text,
            "language": getattr(transcription, 'language', 'hi'),
            "duration": getattr(transcription, 'duration', None),
            "message": "Audio transcribed successfully via Groq Whisper."
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "message": f"Transcription failed: {str(e)}"
        }


def transcribe_audio_file(file_path: str) -> str:
    """Convenience function to transcribe from a file path."""
    if not GROQ_AVAILABLE or not GROQ_API_KEY:
        return "[Groq Whisper unavailable — set GROQ_API_KEY]"

    try:
        client = Groq(api_key=GROQ_API_KEY)
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=Path(file_path),
        )
        return transcription.text
    except Exception as e:
        return f"[Transcription error: {str(e)}]"
