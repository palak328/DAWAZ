import os

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "8388608"))
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")

TESSERACT_CMD = os.getenv("TESSERACT_CMD", "").strip()
