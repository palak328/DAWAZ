from app.services.medicine_matching.matcher import match_medicine
from app.services.prescription_extraction.extractor import make_prescription_draft
from app.services.prescription_checking.reconciler import reconcile_with_confirmed_plan
from app.services.question_answering.answerer import answer_question
from app.services.image_quality.quality_checker import check_image_quality
from PIL import Image
import io

def test_fuzzy_candidate_is_not_auto_confirmed():
    catalog = [{
        "id": "demo-1",
        "name": "Example Medicine",
        "aliases": ["ExampleMed"],
        "strength": "10 mg",
        "form": "tablet",
        "reviewed": True
    }]
    result = match_medicine("Example Medicine 10 mg tablet", catalog)
    assert result["identity_status"] == "CANDIDATE_FOUND"
    assert result["matched_medicine"] is None

def test_prescription_is_only_a_draft():
    draft = make_prescription_draft("Example medicine 10 mg tablet")
    assert draft["status"] == "DRAFT_REQUIRES_PATIENT_REVIEW"
    assert draft["reminders_may_be_created"] is False
    assert draft["medicines"][0]["dose"] is None

def test_unknown_identity_cannot_match_plan():
    result = reconcile_with_confirmed_plan(
        {"identity_status": "UNCERTAIN"},
        [{"name": "Example", "strength": "10 mg", "form": "tablet"}],
        True
    )
    assert result["relation_status"] == "UNKNOWN_IDENTITY"

def test_strength_conflict_is_not_match():
    result = reconcile_with_confirmed_plan(
        {
            "identity_status": "CONFIRMED_FOR_DEMO",
            "matched_medicine": {"name": "Example", "strength": "20 mg", "form": "tablet"}
        },
        [{"name": "Example", "strength": "10 mg", "form": "tablet"}],
        True
    )
    assert result["relation_status"] == "STRENGTH_OR_FORM_CONFLICT"

def test_dose_question_without_confirmed_plan_does_not_guess():
    result = answer_question("How much should I take?", confirmed_plan=None, catalog=[])
    assert result["safe_to_personalize"] is False
    assert "cannot determine" in result["answer"].lower()

def test_image_quality_returns_guidance():
    image = Image.new("RGB", (300, 200), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    result = check_image_quality(buffer.getvalue())
    assert "is_usable" in result
    assert "messages" in result
