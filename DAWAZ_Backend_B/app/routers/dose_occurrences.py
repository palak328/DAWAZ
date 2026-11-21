
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence,
    DoseOccurrenceCorrection
)

from app.schemas.medication_schedule import (
    DoseOccurrenceResponse,
    DoseOccurrenceReportRequest,
    DoseOccurrenceCorrectionRequest,
    DoseOccurrenceCorrectionResponse
)
from app.routers.users import get_current_user
from app.services.dose_occurrences import generate_dose_occurrences
from app.schemas.medication_schedule import DoseOccurrenceReportRequest
from datetime import datetime, timezone
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

@router.post(
    "/{occurrence_id}/report",
    response_model=DoseOccurrenceResponse
)
def report_dose(
    occurrence_id: int,
    report: DoseOccurrenceReportRequest,
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

    occurrence = db.query(DoseOccurrence).filter(
        DoseOccurrence.id == occurrence_id,
        DoseOccurrence.patient_id == patient.id
    ).first()

    if not occurrence:
        raise HTTPException(
            status_code=404,
            detail="Dose occurrence not found"
        )

    if occurrence.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Dose occurrence has already been reported"
        )

    occurrence.status = report.status
    occurrence.notes = report.notes
    occurrence.reported_at = datetime.now(timezone.utc).replace(
        tzinfo=None
    )

    db.commit()
    db.refresh(occurrence)

    return occurrence

@router.post(
    "/{occurrence_id}/correct",
    response_model=DoseOccurrenceResponse
)
def correct_dose_report(
    occurrence_id: int,
    correction: DoseOccurrenceCorrectionRequest,
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

    occurrence = db.query(DoseOccurrence).filter(
        DoseOccurrence.id == occurrence_id,
        DoseOccurrence.patient_id == patient.id
    ).first()

    if not occurrence:
        raise HTTPException(
            status_code=404,
            detail="Dose occurrence not found"
        )

    if occurrence.status not in ["taken", "skipped"]:
        raise HTTPException(
            status_code=409,
            detail="Only reported occurrences can be corrected"
        )

    if occurrence.status == correction.status:
        raise HTTPException(
            status_code=400,
            detail="New status is the same as the existing status"
        )

    correction_record = DoseOccurrenceCorrection(
        occurrence_id=occurrence.id,
        previous_status=occurrence.status,
        corrected_status=correction.status,
        previous_notes=occurrence.notes,
        corrected_notes=correction.notes
    )

    db.add(correction_record)

    occurrence.status = correction.status
    occurrence.notes = correction.notes

    db.commit()
    db.refresh(occurrence)

    return occurrence

@router.get(
    "/{occurrence_id}/history",
    response_model=list[DoseOccurrenceCorrectionResponse]
)
def get_correction_history(
    occurrence_id: int,
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

    occurrence = db.query(DoseOccurrence).filter(
        DoseOccurrence.id == occurrence_id,
        DoseOccurrence.patient_id == patient.id
    ).first()

    if not occurrence:
        raise HTTPException(
            status_code=404,
            detail="Dose occurrence not found"
        )

    history = db.query(DoseOccurrenceCorrection).filter(
        DoseOccurrenceCorrection.occurrence_id == occurrence_id
    ).order_by(
        DoseOccurrenceCorrection.corrected_at.asc()
    ).all()

    return history
