
import os

import httpx
from sqlalchemy.orm import Session

from app.models.prescription import Prescription
from app.schemas.voice_question import VoiceQuestionResponse


MEMBER2_API_URL = os.getenv(
    "MEMBER2_API_URL",
    "http://127.0.0.1:8001"
)

REQUEST_TIMEOUT = 15.0
SUPPORTED_LANGUAGES = {"en-IN", "hi-IN"}


def get_confirmed_plan(patient_id: int, db: Session) -> list:
    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.patient_id == patient_id,
            Prescription.status.in_(["confirmed", "active"])
        )
        .order_by(Prescription.id.desc())
        .all()
    )

    confirmed_plan = []

    for prescription in prescriptions:
        for item in prescription.items:

            if (
                item.identity_confirmed is not True
                or item.needs_review is True
                or item.unresolved_fields
            ):
                continue

            confirmed_plan.append({
                "medicine_name": item.medicine_name,
                "strength": item.strength,
                "dosage_form": item.dosage_form,
                "dose": item.dose,
                "dose_quantity": (
                    str(item.dose_quantity)
                    if item.dose_quantity is not None
                    else None
                ),
                "dose_unit": item.dose_unit,
                "route": item.route,
                "frequency": item.frequency,
                "timing": item.timing,
                "duration_days": item.duration_days,
                "food_instruction": item.food_instruction,
                "additional_instructions": item.additional_instructions,
            })

    return confirmed_plan


async def forward_question(
    question: str,
    language: str,
    patient_id: int,
    db: Session
) -> VoiceQuestionResponse:

    question = question.strip()

    if not question:
        raise ValueError("Question cannot be empty")

    if len(question) > 500:
        raise ValueError("Question must not exceed 500 characters")

    if language not in SUPPORTED_LANGUAGES:
        raise ValueError("Unsupported language")

    confirmed_plan = get_confirmed_plan(patient_id, db)

    payload = {
        "question": question,
        "language": language,
        "confirmed_plan": confirmed_plan
    }

    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT
    ) as client:

        response = await client.post(
            f"{MEMBER2_API_URL}/member2/questions",
            json=payload
        )

        response.raise_for_status()

        result = response.json()

        if not isinstance(result, dict):
            raise ValueError("Invalid response from Backend A")

        return VoiceQuestionResponse.model_validate(result)
