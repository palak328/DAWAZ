
import re

from app.services.medicine_matching.catalog import load_catalog


DOSE_WORDS = (
    "what dose", "what dosage", "dosage", "dose",
    "how much should", "how much do i take",
    "how many tablets", "how many capsules",
    "how many times", "how often should", "when should i take",
    "खुराक", "मात्रा", "कितनी गोली", "कितनी गोलियां",
    "कितनी कैप्सूल", "कितनी बार", "कब लेना चाहिए",
    "कितना लेना चाहिए", "दवा कैसे लें",
)

SAFETY_WORDS = (
    "interaction", "interact", "allergy", "allergic",
    "safe for me", "side effect", "side effects",
    "adverse effect", "adverse reaction", "pregnant",
    "pregnancy", "breastfeeding", "missed dose",
    "contraindication", "contraindications",
    "दुष्प्रभाव", "साइड इफेक्ट", "एलर्जी",
    "सुरक्षित है", "सुरक्षित हैं", "गर्भवती",
    "गर्भावस्था", "स्तनपान", "दवाओं के बीच प्रतिक्रिया",
    "दवा छूट गई", "खुराक छूट गई",
)

QUESTION_FIELDS = {
    "strength": (
        "strength", "strengths", "available strength",
        "available strengths", "how many mg", "how much mg",
        "ताकत", "कितने एमजी", "कितने mg",
        "कौन सी स्ट्रेंथ", "उपलब्ध ताकत",
    ),
    "ingredients": (
        "ingredient", "ingredients", "composition",
        "composed of", "contains",
        "सामग्री", "घटक", "कौन से तत्व",
        "किससे बनी", "किससे बना", "इसमें क्या है",
    ),
    "form": (
        "medicine form", "dosage form", "available form",
        "available forms", "what form", "what is the form",
        "what is its form", "form of", "which form",
        "tablet or capsule", "available as",
        "दवा का रूप", "किस रूप में", "गोली या कैप्सूल",
        "टैबलेट या कैप्सूल", "कौन सा रूप",
    ),
    "release_type": (
        "release type", "release formulation",
        "extended release", "sustained release",
        "immediate release",
        "रिलीज प्रकार", "धीरे रिलीज", "लंबे समय तक रिलीज",
    ),
}


MESSAGES = {
    "en-IN": {
        "empty": "Please enter a medicine name and your question.",
        "dose_plan": (
            "Please follow only the dose written in your confirmed "
            "prescription. Check the exact medicine and instruction "
            "on your prescription screen."
        ),
        "dose_missing": (
            "I cannot determine your prescribed dose because no confirmed "
            "prescription instruction was provided. Please check with "
            "your doctor or pharmacist."
        ),
        "safety": (
            "I cannot confirm personal interaction, allergy, side-effect "
            "or safety risks. Please ask your doctor or pharmacist."
        ),
        "no_catalog": (
            "DAWAZ does not currently have reviewed medicine information "
            "available. Please consult a pharmacist or doctor."
        ),
        "not_found": (
            "I could not find an exact reviewed medicine name in the "
            "DAWAZ catalog. Please check the spelling or consult a pharmacist."
        ),
        "multiple": (
            "I found multiple possible medicine formulations. "
            "Please specify the exact medicine."
        ),
        "information_missing": (
            "The DAWAZ catalog does not currently contain reviewed "
            "information about {field} for {medicine}."
        ),
        "labels": {
            "general_information": "General information",
            "strength": "Listed strengths",
            "ingredients": "Ingredients",
            "form": "Medicine form",
            "release_type": "Release type",
        },
    },
    "hi-IN": {
        "empty": "कृपया दवा का नाम और अपना प्रश्न लिखें।",
        "dose_plan": (
            "कृपया केवल अपनी पुष्टि की गई प्रिस्क्रिप्शन में लिखी खुराक "
            "का पालन करें। अपनी प्रिस्क्रिप्शन स्क्रीन पर दवा और निर्देश "
            "ध्यान से जांचें।"
        ),
        "dose_missing": (
            "आपकी पुष्टि की गई प्रिस्क्रिप्शन का निर्देश उपलब्ध नहीं है, "
            "इसलिए मैं आपकी निर्धारित खुराक नहीं बता सकता। कृपया अपने "
            "डॉक्टर या फार्मासिस्ट से पूछें।"
        ),
        "safety": (
            "मैं व्यक्तिगत दवा-परस्पर प्रतिक्रिया, एलर्जी, दुष्प्रभाव "
            "या सुरक्षा जोखिमों की पुष्टि नहीं कर सकता। कृपया अपने "
            "डॉक्टर या फार्मासिस्ट से सलाह लें।"
        ),
        "no_catalog": (
            "DAWAZ में अभी सत्यापित दवा की जानकारी उपलब्ध नहीं है। "
            "कृपया फार्मासिस्ट या डॉक्टर से सलाह लें।"
        ),
        "not_found": (
            "DAWAZ कैटलॉग में इस दवा का सटीक सत्यापित नाम नहीं मिला। "
            "कृपया वर्तनी जांचें या फार्मासिस्ट से पूछें।"
        ),
        "multiple": (
            "इस नाम से दवा के एक से अधिक संभावित रूप मिले हैं। "
            "कृपया दवा का सटीक नाम बताएं।"
        ),
        "information_missing": (
            "DAWAZ कैटलॉग में {medicine} के लिए {field} की "
            "सत्यापित जानकारी अभी उपलब्ध नहीं है।"
        ),
        "labels": {
            "general_information": "सामान्य जानकारी",
            "strength": "उपलब्ध ताकत",
            "ingredients": "सामग्री",
            "form": "दवा का रूप",
            "release_type": "दवा रिलीज़ प्रकार",
        },
    },
}


def normalize_text(value):
    """Normalize text for consistent medicine-name matching."""
    return re.sub(r"\s+", " ", str(value).lower()).strip()


def is_reviewed(item):
    """Only allow explicitly reviewed catalog records."""
    return isinstance(item, dict) and item.get("reviewed") is True


def find_medicines(question, items):
    """Find exact medicine names and aliases."""
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

    longest_length = max(length for length, item in matches)

    return [
        item for length, item in matches
        if length == longest_length
    ]


def identify_question_field(question):
    """Identify the requested catalog field in English or Hindi."""
    text = normalize_text(question)

    for field, keywords in QUESTION_FIELDS.items():
        if any(keyword in text for keyword in keywords):
            return field

    return "general_information"


def format_catalog_value(value):
    """Convert catalog values into readable text without changing them."""
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)

    if value is None:
        return ""

    return str(value).strip()


def answer_question(
    question: str,
    confirmed_plan=None,
    catalog=None,
    language="en-IN",
) -> dict:
    """
    Answer medicine questions in English or Hindi.

    Medicine facts are taken only from reviewed catalog records.
    Does not diagnose, prescribe doses or confirm personal drug safety.
    """

    language = language if language in MESSAGES else "en-IN"
    msg = MESSAGES[language]

    if not isinstance(question, str) or not question.strip():
        return {
            "answer": msg["empty"],
            "source": None,
            "safe_to_personalize": False,
            "status": "EMPTY_QUESTION",
        }

    text = normalize_text(question)

    # Never invent or calculate a patient's dose.
    if any(word in text for word in DOSE_WORDS):
        if confirmed_plan:
            return {
                "answer": msg["dose_plan"],
                "source": (
                    "Patient's confirmed prescription "
                    "(must be supplied by Member 3)"
                ),
                "safe_to_personalize": True,
                "status": "CONFIRMED_PLAN_REQUIRED",
            }

        return {
            "answer": msg["dose_missing"],
            "source": None,
            "safe_to_personalize": False,
            "status": "DOSE_NOT_AVAILABLE",
        }

    # Personal safety questions require a medical professional.
    if any(word in text for word in SAFETY_WORDS):
        return {
            "answer": msg["safety"],
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

    reviewed_items = [
        item for item in items
        if is_reviewed(item)
    ]

    if not reviewed_items:
        return {
            "answer": msg["no_catalog"],
            "source": None,
            "safe_to_personalize": False,
            "status": "NO_REVIEWED_MEDICINES",
        }

    matches = find_medicines(text, reviewed_items)

    if not matches:
        return {
            "answer": msg["not_found"],
            "source": None,
            "safe_to_personalize": False,
            "status": "MEDICINE_NOT_FOUND",
        }

    if len(matches) > 1:
        names = [
            item.get("name", "Unknown medicine")
            for item in matches
        ]

        return {
            "answer": msg["multiple"],
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
        field_label = msg["labels"].get(
            field, field.replace("_", " ")
        )

        return {
            "answer": msg["information_missing"].format(
                field=field_label,
                medicine=medicine_name,
            ),
            "medicine": medicine_name,
            "source": None,
            "safe_to_personalize": False,
            "status": "INFORMATION_NOT_AVAILABLE",
        }

    label = msg["labels"][field]

    if language == "hi-IN":
        answer = f"{medicine_name} — {label}: {value}"
    else:
        answer = f"{medicine_name} — {label}: {value}"

    return {
        "answer": answer,
        "medicine": medicine_name,
        "question_category": field,
        "source": medicine.get("source_url"),
        "safe_to_personalize": False,
        "status": "ANSWERED_FROM_CATALOG",
    }
