
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.dose_occurrences import generate_dose_occurrences
from app.database import get_db
from app.models.patient import Patient
from app.models.prescription import Prescription, PrescriptionItem
from app.models.medication_schedule import MedicationSchedule
from app.models.user import User
from app.schemas.medication_schedule import (
    MedicationScheduleCreate,
    MedicationScheduleResponse
)
from app.routers.users import get_current_user


router = APIRouter(
    prefix="/medication-schedules",
    tags=["Medication Schedules"]
)


@router.post(
    "",
    response_model=MedicationScheduleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_medication_schedule(
    schedule_data: MedicationScheduleCreate,
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

    prescription_item = db.query(PrescriptionItem).join(
        Prescription
    ).filter(
        PrescriptionItem.id == schedule_data.prescription_item_id,
        Prescription.patient_id == patient.id
    ).first()

    if not prescription_item:
        raise HTTPException(
            status_code=404,
            detail="Prescription item not found"
        )

    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_item.prescription_id,
        Prescription.patient_id == patient.id
    ).first()

    if prescription.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Only active prescriptions can have schedules"
        )

    if not prescription_item.dose:
        raise HTTPException(
            status_code=400,
            detail="Dose information must be reviewed before scheduling"
        )

    if schedule_data.end_date < schedule_data.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    if (
        prescription_item.start_date
        and schedule_data.start_date < prescription_item.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="Schedule starts before the prescription item"
        )

    if (
        prescription_item.end_date
        and schedule_data.end_date > prescription_item.end_date
    ):
        raise HTTPException(
            status_code=400,
            detail="Schedule ends after the prescription item"
        )

    new_schedule = MedicationSchedule(
        patient_id=patient.id,
        prescription_item_id=schedule_data.prescription_item_id,
        scheduled_time=schedule_data.scheduled_time,
        start_date=schedule_data.start_date,
        end_date=schedule_data.end_date,
        timezone=schedule_data.timezone,
        is_active="true"
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    try:
        generate_dose_occurrences(db, new_schedule)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Schedule created but dose generation failed"
        )

    return new_schedule


@router.get(
    "",
    response_model=list[MedicationScheduleResponse]
)
def get_medication_schedules(
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

    return db.query(MedicationSchedule).filter(
        MedicationSchedule.patient_id == patient.id
    ).all()
