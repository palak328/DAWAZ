from PIL import Image
import io
import pytesseract
from app.core.config import OCR_LANGUAGE, TESSERACT_CMD

if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def extract_text_from_image(image_bytes: bytes) -> dict:
    """Return raw OCR text. Never auto-correct uncertain characters."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        raw_text = pytesseract.image_to_string(image, lang=OCR_LANGUAGE)
        return {
            "available": True,
            "raw_text": raw_text,
            "message": None if raw_text.strip() else "No readable text was found.",
        }
    except pytesseract.TesseractNotFoundError:
        return {
            "available": False,
            "raw_text": "",
            "message": "OCR engine is not installed. Install Tesseract and try again.",
        }
    except Exception as exc:
        return {
            "available": False,
            "raw_text": "",
            "message": "OCR could not process this image.",
        }
