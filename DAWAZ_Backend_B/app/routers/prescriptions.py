
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.prescription import Prescription, PrescriptionItem
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse
)
from app.routers.users import get_current_user


router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"]
)


def get_current_patient(current_user: User, db: Session):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(404, "Patient profile not found")

    return patient


def get_owned_prescription(prescription_id, patient_id, db):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.patient_id == patient_id
    ).first()

    if not prescription:
        raise HTTPException(404, "Prescription not found")

    return prescription


def get_unresolved_fields(item):
    required_fields = {
        "medicine_name": item.medicine_name,
        "strength": item.strength,
        "dose": item.dose,
        "route": item.route,
        "frequency": item.frequency,
        "timing": item.timing,
        "duration_days": item.duration_days,
    }

    return [
        field for field, value in required_fields.items()
        if value is None or (
            isinstance(value, str) and not value.strip()
        )
    ]


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)

    new_prescription = Prescription(
        patient_id=patient.id,
        prescription_date=prescription_data.prescription_date,
        notes=prescription_data.notes,
        status="draft"
    )

    for item_data in prescription_data.items:
        values = item_data.model_dump()

        # New entries require explicit review and identity verification.
        values["reviewed_by_patient"] = False
        values["reviewed_at"] = None
        values["identity_confirmed"] = False
        values["needs_review"] = True

        new_prescription.items.append(PrescriptionItem(**values))

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription

@router.get(
    "",
    response_model=list[PrescriptionResponse]
)
def get_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)

    return db.query(Prescription).filter(
        Prescription.patient_id == patient.id
    ).order_by(Prescription.id.desc()).all()
@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse
)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)
    return get_owned_prescription(prescription_id, patient.id, db)


@router.patch(
    "/{prescription_id}/draft",
    response_model=PrescriptionResponse
)
def update_prescription_draft(
    prescription_id: int,
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)
    prescription = get_owned_prescription(
        prescription_id, patient.id, db
    )

    if prescription.status != "draft":
        raise HTTPException(409, "Only draft prescriptions can be edited")

    prescription.prescription_date = prescription_data.prescription_date
    prescription.notes = prescription_data.notes

    prescription.items.clear()

    for item_data in prescription_data.items:
        values = item_data.model_dump()

        # Editing does not count as patient review.
        values["reviewed_by_patient"] = False
        values["reviewed_at"] = None
        values["identity_confirmed"] = False
        values["needs_review"] = True

        values["unresolved_fields"] = get_unresolved_fields(item_data)

        prescription.items.append(PrescriptionItem(**values))

    db.commit()
    db.refresh(prescription)

    return prescription


@router.post(
    "/{prescription_id}/confirm",
    response_model=PrescriptionResponse
)
def confirm_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)
    prescription = get_owned_prescription(
        prescription_id, patient.id, db
    )

    if prescription.status != "draft":
        raise HTTPException(409, "Only draft prescriptions can be confirmed")

    if not prescription.items:
        raise HTTPException(400, "Add at least one medicine before confirmation")

    for item in prescription.items:
        if not item.reviewed_by_patient or not item.reviewed_at:
            raise HTTPException(
                409, "Every medicine requires explicit patient review"
            )

        if item.needs_review or item.unresolved_fields:
            raise HTTPException(
                409, "Resolve all unclear prescription fields before confirmation"
            )

        if not item.identity_confirmed:
            raise HTTPException(
                409, "Medicine identity requires independent verification"
            )

        if (
            item.dose_quantity is None
            or item.dose_quantity <= 0
            or not item.dose_unit
            or not item.strength
            or not item.dosage_form
            or not item.route
            or not item.frequency
            or not item.duration_days
            or item.duration_days <= 0
        ):
            raise HTTPException(
                409, "Prescription contains incomplete or invalid instructions"
            )

    prescription.status = "confirmed"
    prescription.confirmed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(prescription)

    return prescription


@router.post(
    "/{prescription_id}/activate",
    response_model=PrescriptionResponse
)
def activate_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_current_patient(current_user, db)
    prescription = get_owned_prescription(
        prescription_id, patient.id, db
    )

    if prescription.status != "confirmed":
        raise HTTPException(
            status_code=409,
            detail="Prescription must be confirmed before activation"
        )

    prescription.status = "active"
    prescription.activated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(prescription)

    return prescription
