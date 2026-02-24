"""Fast PDF Parser — PyMuPDF (fitz) for discharge summaries and medical documents."""
import os

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False


def parse_pdf(pdf_data: bytes) -> dict:
    """
    Parse a PDF document and extract text content.
    
    Uses PyMuPDF (fitz) for blazing-fast extraction — 
    10-50x faster than heavy parsers like Docling.
    Perfect for shredding through discharge summaries.
    """
    if not PYMUPDF_AVAILABLE:
        return {
            "success": False,
            "text": "",
            "pages": 0,
            "message": "PyMuPDF (fitz) not installed. Run: pip install PyMuPDF"
        }

    try:
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        
        page_count = len(doc)
        doc.close()
        
        return {
            "success": True,
            "text": text.strip(),
            "pages": page_count,
            "char_count": len(text),
            "message": f"Parsed {page_count} page(s) successfully via PyMuPDF."
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "pages": 0,
            "message": f"PDF parsing failed: {str(e)}"
        }


def parse_pdf_file(file_path: str) -> str:
    """Convenience function to parse from a file path."""
    if not PYMUPDF_AVAILABLE:
        return "[PyMuPDF unavailable — pip install PyMuPDF]"
    
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return f"[PDF parsing error: {str(e)}]"
