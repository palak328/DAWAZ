
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
        field
        for field, value in required_fields.items()
        if value is None or (isinstance(value, str) and not value.strip())
    ]


def identity_verified_by_extraction(prescription, item_data):
    payload = prescription.extraction_payload or {}
    medicines = payload.get("medicines", [])

    for medicine in medicines:
        extracted_name = medicine.get("medicine_name")

        if (
            medicine.get("identity_confirmed") is True
            and extracted_name
            and extracted_name.strip().casefold()
                == item_data.medicine_name.strip().casefold()
        ):
            return True

    return False

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
        prescription_id, patient.id, db
    )

    if prescription.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Only draft prescriptions can be edited"
        )

    prescription.prescription_date = prescription_data.prescription_date
    prescription.notes = prescription_data.notes

    prescription.items.clear()

    for item_data in prescription_data.items:
        item_values = item_data.model_dump()

        unresolved = get_unresolved_fields(item_data)

        item = PrescriptionItem(
            **item_values,
            unresolved_fields=unresolved,
            needs_review=bool(unresolved),
            reviewed_by_patient=True,
            reviewed_at=datetime.now(timezone.utc),
            identity_confirmed=identity_verified_by_extraction(
                prescription, item_data
            )
        )

        prescription.items.append(item)

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
        raise HTTPException(
            status_code=409,
            detail="Only draft prescriptions can be confirmed"
        )

    if not prescription.items:
        raise HTTPException(
            status_code=400,
            detail="Add at least one medicine before confirmation"
        )

    for item in prescription.items:
        if not item.reviewed_by_patient:
            raise HTTPException(
                status_code=400,
                detail=f"Medicine '{item.medicine_name}' has not been reviewed"
            )

        if item.needs_review or item.unresolved_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Medicine '{item.medicine_name}' has unresolved information"
            )

        if not item.identity_confirmed:
            raise HTTPException(
                status_code=400,
                detail=f"Medicine identity for '{item.medicine_name}' is not verified"
            )

        if not item.dose_quantity or not item.dose_unit:
            raise HTTPException(
                status_code=400,
                detail=f"Dose quantity and unit are missing for '{item.medicine_name}'"
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
