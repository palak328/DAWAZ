
import re
import json
from pathlib import Path

import fitz
from app.services.ocr.ocr_service import extract_text_from_image


APP_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = APP_DIR / "data" / "medicine_catalog.json"


def read_prescription_file(file_bytes: bytes, filename: str) -> dict:
    """Read PDF text or extract text from an image using the existing OCR service."""

    lower = filename.lower()

    if lower.endswith(".pdf"):
        try:
            document = fitz.open(
                stream=file_bytes,
                filetype="pdf"
            )

            pages = [page.get_text() for page in document]

            return {
                "raw_text": "\n".join(pages),
                "pages_read": len(pages),
                "ocr_available": True,
                "message": "PDF text extracted."
            }

        except Exception as error:
            return {
                "raw_text": "",
                "pages_read": 0,
                "ocr_available": False,
                "message": str(error)
            }

    result = extract_text_from_image(file_bytes)

    return {
        "raw_text": result.get("raw_text", ""),
        "pages_read": 1,
        "ocr_available": result.get("available", False),
        "message": result.get("message", "")
    }


def normalize_text(text):
    text = str(text or "").lower()
    return " ".join(
        re.sub(r"[^a-z0-9.+% ]", " ", text).split()
    )


def load_medicine_catalog():
    """Load the existing 20-record catalog. Do not create another catalog."""

    if not CATALOG_PATH.exists():
        return []

    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)

        medicines = data.get("medicines", [])

        return medicines if isinstance(medicines, list) else []

    except (json.JSONDecodeError, OSError):
        return []


def find_catalog_medicines(text, catalog):
    """Find exact catalog-name or alias mentions. No fuzzy identity guessing."""

    normalized_text = normalize_text(text)
    matches = []

    for medicine in catalog:
        names = [medicine.get("name", "")]

        aliases = medicine.get("aliases", [])

        if isinstance(aliases, str):
            aliases = [aliases]

        names.extend(aliases)

        for name in names:
            normalized_name = normalize_text(name)

            if normalized_name and re.search(
                r"(?<![a-z0-9])"
                + re.escape(normalized_name)
                + r"(?![a-z0-9])",
                normalized_text
            ):
                matches.append(medicine)
                break

    return matches


def extract_field(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(0).strip() if match else None


def extract_instruction_fields(text, medicine=None):
    """Extract only explicit, recognizable prescription information."""

    strength = extract_field(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|%|meq)\b",
        text
    )

    dose = extract_field(
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:tablets?|tabs?|capsules?|caps?|ml|drops?|puffs?|sachets?)\b",
        text
    )

    frequency = extract_field(
        r"\b(?:once|twice|thrice)\s+(?:a\s+)?daily\b"
        r"|\b(?:once|twice|three|four)\s+times\s+(?:a\s+)?day\b"
        r"|\bevery\s+\d+\s+hours?\b"
        r"|\bas\s+needed\b",
        text
    )

    duration = extract_field(
        r"\b(?:for\s+)?\d+\s*(?:days?|weeks?|months?)\b",
        text
    )

    route = extract_field(
        r"\b(?:by mouth|oral|orally|topical|inhalation|"
        r"intravenous|intramuscular|subcutaneous)\b",
        text
    )

    timing = extract_field(
        r"\b(?:before meals?|after meals?|with meals?|"
        r"at bedtime|in the morning|at night)\b",
        text
    )

    medicine_form = None

    if medicine:
        form = medicine.get("form")

        if form and normalize_text(form) != "not specified":
            medicine_form = form

    return {
        "strength": strength,
        "form": medicine_form,
        "dose": dose,
        "route": route,
        "frequency": frequency,
        "timing": timing,
        "duration": duration
    }


def make_prescription_draft(raw_text: str) -> dict:
    """
    Create an editable prescription draft.

    Exact catalog mentions are candidate matches only.
    Missing or unclear fields are never guessed.
    """

    if not isinstance(raw_text, str) or not raw_text.strip():
        return {
            "raw_text": raw_text,
            "medicines": [],
            "status": "DRAFT_REQUIRES_PATIENT_REVIEW",
            "reminders_may_be_created": False,
            "message": "No prescription text was provided."
        }

    lines = [
        line.strip()
        for line in raw_text.splitlines()
        if line.strip()
    ]

    catalog = load_medicine_catalog()

    # Find catalog medicine mentions and their line positions.
    medicine_positions = []

    for index, line in enumerate(lines):
        matches = find_catalog_medicines(line, catalog)

        for medicine in matches:
            medicine_positions.append((index, medicine))

    medicine_positions.sort(key=lambda item: item[0])

    extracted = []

    if medicine_positions:
        # Group each medicine line with its following instruction lines.
        for position, (start_index, medicine) in enumerate(
            medicine_positions
        ):
            end_index = (
                medicine_positions[position + 1][0]
                if position + 1 < len(medicine_positions)
                else len(lines)
            )

            block_lines = lines[start_index:end_index]
            block_text = "\n".join(block_lines)

            fields = extract_instruction_fields(
                block_text,
                medicine
            )

            unresolved = [
                field for field, value in fields.items()
                if value is None
            ]

            extracted.append({
                "raw_line": lines[start_index],
                "raw_instruction_text": block_text,
                "medicine_name": medicine.get("name"),
                "medicine_id": medicine.get("id"),
                "identity_confirmed": False,
                **fields,
                "needs_review": True,
                "unresolved_fields": unresolved
            })

    else:
        # Preserve medication-like text even when no catalog
        # identity can safely be identified.
        for line in lines:
            if re.search(
                r"\b(mg|mcg|ml|tablet|tab|capsule|cap|syrup)\b",
                line,
                re.IGNORECASE
            ):
                fields = extract_instruction_fields(line)

                unresolved = [
                    field for field, value in fields.items()
                    if value is None
                ]

                unresolved.append("medicine_name")

                extracted.append({
                    "raw_line": line,
                    "raw_instruction_text": line,
                    "medicine_name": None,
                    "medicine_id": None,
                    "identity_confirmed": False,
                    **fields,
                    "needs_review": True,
                    "unresolved_fields": unresolved
                })

    return {
        "raw_text": raw_text,
        "medicines": extracted,
        "status": "DRAFT_REQUIRES_PATIENT_REVIEW",
        "reminders_may_be_created": False,
        "active_prescription_created": False,
        "message": (
            "Review every extracted medicine and instruction. "
            "Unclear fields must be confirmed with the prescriber "
            "or pharmacist."
        )
    }
