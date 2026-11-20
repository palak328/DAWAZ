
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials

from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import (
    PatientProfileCreate,
    PatientProfileResponse
)
from app.routers.users import security, get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.post(
    "/profile",
    response_model=PatientProfileResponse,
    status_code=status.HTTP_201_CREATED
)
def create_patient_profile(
    profile_data: PatientProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_profile = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient profile already exists"
        )

    new_profile = Patient(
        user_id=current_user.id,
        date_of_birth=profile_data.date_of_birth,
        preferred_language=profile_data.preferred_language,
        emergency_contact_name=profile_data.emergency_contact_name,
        emergency_contact_phone=profile_data.emergency_contact_phone
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get(
    "/profile",
    response_model=PatientProfileResponse
)
def get_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    return profile
