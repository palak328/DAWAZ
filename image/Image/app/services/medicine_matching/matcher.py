import re
from rapidfuzz import fuzz
from app.services.medicine_matching.catalog import load_catalog

def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()

def find_candidates(raw_text: str, catalog=None) -> list:
    """Fuzzy name retrieval only. Candidate retrieval does not confirm identity."""
    catalog = catalog if catalog is not None else load_catalog()
    source = normalize_text(raw_text)
    results = []

    for item in catalog:
        names = [item.get("name", "")] + item.get("aliases", [])
        best_score = max(
            [fuzz.partial_ratio(normalize_text(name), source) for name in names if name] or [0]
        )
        if best_score >= 65:
            results.append({
                "medicine_id": item.get("id"),
                "name": item.get("name"),
                "strength": item.get("strength"),
                "form": item.get("form"),
                "release_type": item.get("release_type"),
                "name_similarity": int(best_score),
            })

    return sorted(results, key=lambda row: row["name_similarity"], reverse=True)

def match_medicine(raw_text: str, catalog=None) -> dict:
    candidates = find_candidates(raw_text, catalog)
    if not candidates:
        return {
            "identity_status": "UNCERTAIN",
            "matched_medicine": None,
            "candidates": [],
            "message": "Could not identify this medicine. Please scan again or ask a pharmacist.",
        }

    # Do not turn fuzzy name similarity into a confirmed identity.
    return {
        "identity_status": "CANDIDATE_FOUND",
        "matched_medicine": None,
        "candidates": candidates[:5],
        "message": "Possible medicine found. Check the name, strength and form before proceeding.",
    }
