
import json
import re
from pathlib import Path
from difflib import SequenceMatcher


APP_DIR = Path(__file__).resolve().parent.parent
CATALOG_PATH = APP_DIR / "data" / "medicine_catalog.json"


def normalize(value):
    if value is None:
        return ""

    value = str(value).lower()
    value = re.sub(r"[^a-z0-9.+% ]", " ", value)
    return " ".join(value.split())


def normalize_strength(value):
    return re.sub(r"\s+", "", normalize(value))


def load_catalog():
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(
            f"Catalog not found: {CATALOG_PATH}"
        )

    with open(CATALOG_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    medicines = data.get("medicines")

    if not isinstance(medicines, list):
        raise ValueError("Catalog must contain a medicines list.")

    return medicines


def get_names(medicine):
    names = []

    if medicine.get("name"):
        names.append(medicine["name"])

    aliases = medicine.get("aliases", [])

    if isinstance(aliases, str):
        aliases = [aliases]

    names.extend(
        alias for alias in aliases
        if isinstance(alias, str) and alias.strip()
    )

    return names


def extract_strengths(text):
    pattern = (
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:mg|mcg|g|ml|iu|%|meq)\b"
    )

    return {
        normalize_strength(value)
        for value in re.findall(pattern, text, re.IGNORECASE)
    }


def calculate_name_similarity(name, ocr_text):
    name = normalize(name)
    text = normalize(ocr_text)

    if not name or not text:
        return 0.0

    if name in text:
        return 1.0

    words = text.split()
    best_score = 0.0

    for start in range(len(words)):
        for size in range(1, min(5, len(words) - start + 1)):
            phrase = " ".join(words[start:start + size])

            score = SequenceMatcher(
                None, name, phrase
            ).ratio()

            best_score = max(best_score, score)

    return best_score


def compare_medicine(medicine, ocr_text):
    names = get_names(medicine)

    best_name = ""
    best_similarity = 0.0

    for name in names:
        similarity = calculate_name_similarity(
            name, ocr_text
        )

        if similarity > best_similarity:
            best_similarity = similarity
            best_name = name

    catalog_strengths = extract_strengths(
        medicine.get("strength", "")
    )

    ocr_strengths = extract_strengths(ocr_text)

    strength_match = bool(
        catalog_strengths.intersection(ocr_strengths)
    )

    medicine_form = normalize(medicine.get("form", ""))
    normalized_ocr = normalize(ocr_text)

    form_match = (
        medicine_form not in ("", "not specified")
        and medicine_form in normalized_ocr
    )

    ingredient_names = medicine.get("ingredients", [])

    if isinstance(ingredient_names, str):
        ingredient_names = [ingredient_names]

    ingredient_match = any(
        normalize(ingredient) in normalized_ocr
        for ingredient in ingredient_names
        if ingredient
    )

    release_type = normalize(
        medicine.get("release_type", "")
    )

    release_match = (
        release_type not in ("", "not specified")
        and release_type in normalized_ocr
    )

    score = (
        best_similarity * 60
        + (15 if strength_match else 0)
        + (10 if form_match else 0)
        + (10 if ingredient_match else 0)
        + (5 if release_match else 0)
    )

    score = round(min(score, 100), 2)

    if best_similarity >= 0.80:
        status = "CANDIDATE_REQUIRES_CONFIRMATION"
    elif best_similarity >= 0.55:
        status = "POSSIBLE_CANDIDATE_REVIEW_REQUIRED"
    else:
        status = "LOW_SIMILARITY"

    return {
        "medicine_id": medicine.get("id"),
        "name": medicine.get("name"),
        "matched_name": best_name,
        "score": score,
        "status": status,
        "evidence": {
            "name_similarity": round(best_similarity, 3),
            "strength_match": strength_match,
            "form_match": form_match,
            "ingredient_match": ingredient_match,
            "release_type_match": release_match
        },
        "requires_human_confirmation": True
    }


def match_medicine(ocr_text, top_k=5):
    if not isinstance(ocr_text, str) or not ocr_text.strip():
        return {
            "success": False,
            "message": "No OCR text provided.",
            "candidates": []
        }

    try:
        catalog = load_catalog()

        results = [
            compare_medicine(medicine, ocr_text)
            for medicine in catalog
        ]

        results.sort(
            key=lambda item: item["score"],
            reverse=True
        )

        candidates = [
            result for result in results
            if result["status"] != "LOW_SIMILARITY"
        ][:max(1, top_k)]

        return {
            "success": True,
            "catalog_records_checked": len(catalog),
            "candidate_count": len(candidates),
            "identity_confirmed": False,
            "message": "Candidate matching completed. Human confirmation is required.",
            "candidates": candidates
        }

    except (FileNotFoundError, ValueError, json.JSONDecodeError) as error:
        return {
            "success": False,
            "message": str(error),
            "candidates": []
        }
