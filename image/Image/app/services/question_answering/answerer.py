from app.services.medicine_matching.catalog import load_catalog

DOSE_WORDS = ("how much", "what dose", "dosage", "how many", "dose")

def answer_question(question: str, confirmed_plan=None, catalog=None) -> dict:
    """Small rule-based Q&A. No diagnosis, dose invention or interaction clearance."""
    text = (question or "").strip().lower()

    if any(word in text for word in DOSE_WORDS):
        if confirmed_plan:
            return {
                "answer": "Please follow only the dose written in your confirmed prescription. Check the exact medicine and instruction on your prescription screen.",
                "source": "Patient's confirmed prescription (must be supplied by Member 3)",
                "safe_to_personalize": True,
            }
        return {
            "answer": "I cannot determine your prescribed dose because no confirmed prescription instruction was provided. Please check with your doctor or pharmacist.",
            "source": None,
            "safe_to_personalize": False,
        }

    if any(word in text for word in ("interaction", "interact", "allergy", "safe for me", "side effect")):
        return {
            "answer": "I cannot confirm personal interaction, allergy or safety risks. Please ask your doctor or pharmacist.",
            "source": None,
            "safe_to_personalize": False,
        }

    if any(word in text for word in ("what is", "used for", "purpose")):
        items = catalog if catalog is not None else load_catalog()
        for item in items:
            names = [item.get("name", "")] + item.get("aliases", [])
            if any(name and name.lower() in text for name in names):
                info = item.get("general_information")
                if info:
                    return {
                        "answer": info,
                        "source": item.get("source_url"),
                        "safe_to_personalize": False,
                    }
        return {
            "answer": "I do not have a reviewed information source for that medicine yet. Please ask a pharmacist.",
            "source": None,
            "safe_to_personalize": False,
        }

    return {
        "answer": "I can help with basic medicine information, but I cannot decide or change your dose. Please ask a doctor or pharmacist if the instruction is unclear.",
        "source": None,
        "safe_to_personalize": False,
    }
