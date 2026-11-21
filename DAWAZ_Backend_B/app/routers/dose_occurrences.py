from app.models.medication_schedule import MedicationSchedule
from app.models.prescription import PrescriptionItem

from app.services.stock_service import (
    deduct_stock_for_dose,
    reverse_stock_deduction
)
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
from app.models.prescription import Prescription, PrescriptionItem
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

    try:
        if report.status == "taken":

            schedule = db.query(MedicationSchedule).filter(
                MedicationSchedule.id == occurrence.schedule_id,
                MedicationSchedule.patient_id == patient.id
            ).first()

            if not schedule:
                raise ValueError("Medication schedule not found")

            prescription_item = db.query(PrescriptionItem).join(
                Prescription,
                PrescriptionItem.prescription_id == Prescription.id
            ).filter(
                PrescriptionItem.id == schedule.prescription_item_id,
                Prescription.patient_id == patient.id,
                Prescription.status == "active"
            ).first()

            if not prescription_item:
                raise ValueError("Active prescription item not found")

            if (
                prescription_item.dose_quantity is None
                or not prescription_item.dose_unit
            ):
                raise ValueError(
                    "Reviewed dose quantity and unit are required"
                )

            deduct_stock_for_dose(
                db=db,
                patient_id=patient.id,
                prescription_item_id=prescription_item.id,
                occurrence_id=occurrence.id,
                quantity_to_deduct=prescription_item.dose_quantity,
                dose_unit=prescription_item.dose_unit
            )

        occurrence.status = report.status
        occurrence.notes = report.notes
        occurrence.reported_at = datetime.now(
            timezone.utc
        ).replace(tzinfo=None)

        db.commit()
        db.refresh(occurrence)

        return occurrence

    except ValueError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=str(error)
        )

    except Exception:
        db.rollback()
        raise
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

    try:
        # Taken -> skipped: restore previously deducted stock.
        if occurrence.status == "taken" and correction.status == "skipped":

            reverse_stock_deduction(
                db=db,
                occurrence_id=occurrence.id
            )

        # Skipped -> taken: deduct stock again.
        elif occurrence.status == "skipped" and correction.status == "taken":

            schedule = db.query(MedicationSchedule).filter(
                MedicationSchedule.id == occurrence.schedule_id,
                MedicationSchedule.patient_id == patient.id
            ).first()

            if not schedule:
                raise ValueError("Medication schedule not found")

            prescription_item = db.query(PrescriptionItem).join(
                Prescription,
                PrescriptionItem.prescription_id == Prescription.id
            ).filter(
                PrescriptionItem.id == schedule.prescription_item_id,
                Prescription.patient_id == patient.id,
                Prescription.status == "active"
            ).first()

            if not prescription_item:
                raise ValueError("Active prescription item not found")

            if (
                prescription_item.dose_quantity is None
                or not prescription_item.dose_unit
            ):
                raise ValueError(
                    "Reviewed dose quantity and unit are required"
                )

            deduct_stock_for_dose(
                db=db,
                patient_id=patient.id,
                prescription_item_id=prescription_item.id,
                occurrence_id=occurrence.id,
                quantity_to_deduct=prescription_item.dose_quantity,
                dose_unit=prescription_item.dose_unit
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

    except ValueError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=str(error)
        )

    except Exception:
        db.rollback()
        raise

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
