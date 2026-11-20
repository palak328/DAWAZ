
import re

from app.services.medicine_matching.catalog import load_catalog


DOSE_WORDS = (
    "what dose",
    "what dosage",
    "dosage",
    "dose",
    "how much should",
    "how much do i take",
    "how many tablets",
    "how many capsules",
    "how many times",
    "how often should",
    "when should i take",
)

SAFETY_WORDS = (
    "interaction",
    "interact",
    "allergy",
    "allergic",
    "safe for me",
    "side effect",
    "side effects",
    "adverse effect",
    "adverse reaction",
    "pregnant",
    "pregnancy",
    "breastfeeding",
    "missed dose",
    "contraindication",
    "contraindications",
)

QUESTION_FIELDS = {
    "strength": (
        "strength",
        "strengths",
        "available strength",
        "available strengths",
        "how many mg",
        "how much mg",
    ),
    "ingredients": (
        "ingredient",
        "ingredients",
        "composition",
        "composed of",
        "contains",
    ),
    "form": (
    "medicine form",
    "dosage form",
    "available form",
    "available forms",
    "what form",
    "what is the form",
    "what is its form",
    "form of",
    "which form",
    "tablet or capsule",
    "available as",
),
    "release_type": (
        "release type",
        "release formulation",
        "extended release",
        "sustained release",
        "immediate release",
    ),
}


def normalize_text(value):
    """Normalize text for consistent medicine-name matching."""
    return re.sub(r"\s+", " ", str(value).lower()).strip()


def is_reviewed(item):
    """Only allow explicitly reviewed catalog records."""
    return isinstance(item, dict) and item.get("reviewed") is True


def find_medicines(question, items):
    """
    Find exact medicine names and aliases.

    Prefer the longest matching name so that a specific formulation
    such as Oxcarbazepine SR takes precedence over Oxcarbazepine.
    """
    text = normalize_text(question)
    matches = []

    for item in items:
        if not is_reviewed(item):
            continue

        names = [item.get("name", "")]
        names.extend(item.get("aliases", []))

        matched_lengths = []

        for name in names:
            if not isinstance(name, str) or not name.strip():
                continue

            normalized_name = normalize_text(name)

            pattern = (
                r"(?<![a-z0-9])"
                + re.escape(normalized_name)
                + r"(?![a-z0-9])"
            )

            if re.search(pattern, text):
                matched_lengths.append(len(normalized_name))

        if matched_lengths:
            matches.append((max(matched_lengths), item))

    if not matches:
        return []

    # Keep only the longest medicine-name matches.
    longest_length = max(length for length, item in matches)

    return [
        item
        for length, item in matches
        if length == longest_length
    ]


def identify_question_field(question):
    """Identify which catalog field the user wants."""
    text = normalize_text(question)

    for field, keywords in QUESTION_FIELDS.items():
        if any(keyword in text for keyword in keywords):
            return field

    return "general_information"


def format_catalog_value(value):
    """Convert catalog values into readable text."""
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)

    if value is None:
        return ""

    return str(value).strip()


def answer_question(question: str, confirmed_plan=None, catalog=None) -> dict:
    """
    Answer basic medicine questions using reviewed catalog records.

    Does not diagnose, prescribe doses, confirm drug interactions,
    or provide individualized medical advice.
    """

    if not isinstance(question, str) or not question.strip():
        return {
            "answer": "Please enter a medicine name and your question.",
            "source": None,
            "safe_to_personalize": False,
            "status": "EMPTY_QUESTION",
        }

    text = normalize_text(question)

    # Preserve the existing personalized prescription safety rule.
    if any(word in text for word in DOSE_WORDS):
        if confirmed_plan:
            return {
                "answer": (
                    "Please follow only the dose written in your confirmed "
                    "prescription. Check the exact medicine and instruction "
                    "on your prescription screen."
                ),
                "source": "Patient's confirmed prescription (must be supplied by Member 3)",
                "safe_to_personalize": True,
                "status": "CONFIRMED_PLAN_REQUIRED",
            }

        return {
            "answer": (
                "I cannot determine your prescribed dose because no confirmed "
                "prescription instruction was provided. Please check with "
                "your doctor or pharmacist."
            ),
            "source": None,
            "safe_to_personalize": False,
            "status": "DOSE_NOT_AVAILABLE",
        }

    # Preserve restrictions on medical advice.
    if any(word in text for word in SAFETY_WORDS):
        return {
            "answer": (
                "I cannot confirm personal interaction, allergy, side-effect "
                "or safety risks. Please ask your doctor or pharmacist."
            ),
            "source": None,
            "safe_to_personalize": False,
            "status": "PROFESSIONAL_ADVICE_REQUIRED",
        }

    # Load only reviewed catalog records.
    try:
        items = catalog if catalog is not None else load_catalog()
    except (OSError, ValueError, TypeError):
        items = []

    if not isinstance(items, list):
        items = []

    reviewed_items = [item for item in items if is_reviewed(item)]

    if not reviewed_items:
        return {
            "answer": (
                "DAWAZ does not currently have reviewed medicine information "
                "available. Please consult a pharmacist or doctor."
            ),
            "source": None,
            "safe_to_personalize": False,
            "status": "NO_REVIEWED_MEDICINES",
        }

    matches = find_medicines(text, reviewed_items)

    if not matches:
        return {
            "answer": (
                "I could not find an exact reviewed medicine name in the "
                "DAWAZ catalog. Please check the spelling or consult "
                "a pharmacist."
            ),
            "source": None,
            "safe_to_personalize": False,
            "status": "MEDICINE_NOT_FOUND",
        }

    if len(matches) > 1:
        names = [item.get("name", "Unknown medicine") for item in matches]

        return {
            "answer": (
                "I found multiple possible medicine formulations. "
                "Please specify the exact medicine."
            ),
            "candidates": names,
            "source": None,
            "safe_to_personalize": False,
            "status": "MULTIPLE_MEDICINES_FOUND",
        }

    medicine = matches[0]
    medicine_name = medicine.get("name", "Unknown medicine")

    field = identify_question_field(text)

    value = format_catalog_value(medicine.get(field))

    if not value or value.lower() in (
        "not specified",
        "none",
        "unknown",
        "not available",
    ):
        return {
            "answer": (
                f"The DAWAZ catalog does not currently contain reviewed "
                f"information about {field.replace('_', ' ')} for "
                f"{medicine_name}."
            ),
            "medicine": medicine_name,
            "source": None,
            "safe_to_personalize": False,
            "status": "INFORMATION_NOT_AVAILABLE",
        }

    labels = {
        "general_information": "General information",
        "strength": "Listed strengths",
        "ingredients": "Ingredients",
        "form": "Medicine form",
        "release_type": "Release type",
    }

    return {
        "answer": f"{medicine_name} — {labels[field]}: {value}",
        "medicine": medicine_name,
        "question_category": field,
        "source": medicine.get("source_url"),
        "safe_to_personalize": False,
        "status": "ANSWERED_FROM_CATALOG",
    }
