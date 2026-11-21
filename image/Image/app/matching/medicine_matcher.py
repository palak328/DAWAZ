
import re
from rapidfuzz import fuzz
from app.services.medicine_matching.catalog import load_catalog


def normalize_text(value: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        " ",
        (value or "").lower()
    ).strip()


def find_candidates(raw_text: str, catalog=None) -> list:
    """
    Finds possible medicine matches using name similarity.
    A candidate is NOT a confirmed medicine identity.
    """

    if not raw_text or not raw_text.strip():
        return []

    catalog = catalog if catalog is not None else load_catalog()

    source = normalize_text(raw_text)
    results = []

    for item in catalog:
        names = [item.get("name", "")]

        aliases = item.get("aliases") or []
        if isinstance(aliases, list):
            names.extend(aliases)

        valid_names = [
            normalize_text(name)
            for name in names
            if isinstance(name, str) and name.strip()
        ]

        if not valid_names:
            continue

        best_score = max(
            fuzz.partial_ratio(name, source)
            for name in valid_names
        )

        if best_score >= 70:
            results.append({
                "medicine_id": item.get("id"),
                "name": item.get("name"),
                "strength": item.get("strength"),
                "form": item.get("form"),
                "release_type": item.get("release_type"),
                "name_similarity": int(best_score),
                "identity_confirmed": False
            })

    return sorted(
        results,
        key=lambda row: row["name_similarity"],
        reverse=True
    )[:5]


def match_medicine(raw_text: str, catalog=None) -> dict:
    """Returns medicine candidates without confirming identity."""

    if not raw_text or not raw_text.strip():
        return {
            "identity_status": "UNIDENTIFIED",
            "matched_medicine": None,
            "candidates": [],
            "message": "No readable medicine text found. Please upload a clearer image."
        }

    candidates = find_candidates(raw_text, catalog)

    if not candidates:
        return {
            "identity_status": "UNIDENTIFIED",
            "matched_medicine": None,
            "candidates": [],
            "message": "Medicine not identified in the available catalog. Please consult a pharmacist."
        }

    return {
        "identity_status": "CANDIDATE_FOUND",
        "matched_medicine": None,
        "candidates": candidates,
        "message": "Possible candidates found. Verify name, strength, ingredients and form."
    }
