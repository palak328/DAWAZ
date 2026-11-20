import re
import io
import fitz
from PIL import Image
from app.services.ocr.ocr_service import extract_text_from_image

def read_prescription_file(file_bytes: bytes, filename: str) -> dict:
    """Read a PDF's text or run OCR on an image. This is not handwriting interpretation."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        try:
            document = fitz.open(stream=file_bytes, filetype="pdf")
            pages = [page.get_text() for page in document]
            return {"raw_text": "\n".join(pages), "pages_read": len(pages), "ocr_available": True}
        except Exception:
            return {"raw_text": "", "pages_read": 0, "ocr_available": False}
    result = extract_text_from_image(file_bytes)
    return {
        "raw_text": result["raw_text"],
        "pages_read": 1,
        "ocr_available": result["available"],
        "message": result["message"],
    }

def make_prescription_draft(raw_text: str) -> dict:
    """Extract only obvious fields; uncertain instructions stay null for human review."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    medicine_mentions = []

    # This deliberately does not guess a dose or timing from free text.
    for line in lines:
        if re.search(r"\b(mg|mcg|ml|tablet|tab|capsule|cap|syrup)\b", line, re.I):
            medicine_mentions.append({
                "raw_line": line,
                "medicine_name": None,
                "strength": None,
                "form": None,
                "dose": None,
                "route": None,
                "frequency": None,
                "timing": None,
                "duration": None,
                "needs_review": True,
                "unresolved_fields": [
                    "medicine_name", "strength", "form", "dose",
                    "route", "frequency", "timing", "duration"
                ],
            })

    return {
        "raw_text": raw_text,
        "medicines": medicine_mentions,
        "status": "DRAFT_REQUIRES_PATIENT_REVIEW",
        "reminders_may_be_created": False,
        "message": "Please review every medicine and instruction. Unclear fields must be confirmed with the prescriber or pharmacist.",
    }
