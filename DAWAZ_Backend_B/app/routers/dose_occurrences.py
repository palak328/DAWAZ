
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence
)
from app.schemas.medication_schedule import DoseOccurrenceResponse
from app.routers.users import get_current_user
from app.services.dose_occurrences import generate_dose_occurrences


router = APIRouter(
    prefix="/dose-occurrences",
    tags=["Dose Occurrences"]
)


@router.post(
    "/generate/{schedule_id}",
    response_model=list[DoseOccurrenceResponse]
)
def generate_occurrences(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    schedule = db.query(MedicationSchedule).filter(
        MedicationSchedule.id == schedule_id,
        MedicationSchedule.patient_id == patient.id
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Medication schedule not found"
        )

    try:
        occurrences = generate_dose_occurrences(db, schedule)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    return occurrences


@router.get(
    "",
    response_model=list[DoseOccurrenceResponse]
)
def get_dose_occurrences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    occurrences = db.query(DoseOccurrence).filter(
        DoseOccurrence.patient_id == patient.id
    ).order_by(
        DoseOccurrence.scheduled_for.asc()
    ).all()

    return occurrences
