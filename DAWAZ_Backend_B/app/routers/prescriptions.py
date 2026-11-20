
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


def get_current_patient(
    current_user: User,
    db: Session
):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    return patient


def get_owned_prescription(
    prescription_id: int,
    patient_id: int,
    db: Session
):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.patient_id == patient_id
    ).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )

    return prescription


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
        new_item = PrescriptionItem(**item_data.model_dump())
        new_prescription.items.append(new_item)

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription


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

    return get_owned_prescription(
        prescription_id,
        patient.id,
        db
    )


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
        prescription_id,
        patient.id,
        db
    )

    if prescription.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft prescriptions can be edited"
        )

    prescription.prescription_date = prescription_data.prescription_date
    prescription.notes = prescription_data.notes

    prescription.items.clear()

    for item_data in prescription_data.items:
        prescription.items.append(
            PrescriptionItem(**item_data.model_dump())
        )

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
        prescription_id,
        patient.id,
        db
    )

    if prescription.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft prescriptions can be confirmed"
        )

    if not prescription.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add at least one medicine before confirmation"
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
        prescription_id,
        patient.id,
        db
    )

    if prescription.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prescription must be confirmed before activation"
        )

    prescription.status = "active"
    prescription.activated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(prescription)

    return prescription
