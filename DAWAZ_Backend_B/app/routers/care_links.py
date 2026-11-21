
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.care_link import CareLink
from app.models.patient import Patient
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.care_link import (
    CareInvitationCreate,
    CareLinkResponse
)


router = APIRouter(
    prefix="/care-invitations",
    tags=["Caregiver Management"]
)


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("", response_model=CareLinkResponse, status_code=201)
@router.post("/", response_model=CareLinkResponse, status_code=201)
def create_care_invitation(
    request: CareInvitationCreate,
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

    caregiver = db.query(User).filter(
        User.username == request.caregiver_username
    ).first()

    if not caregiver:
        raise HTTPException(
            status_code=404,
            detail="Caregiver username not found"
        )

    if caregiver.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot invite yourself"
        )

    existing_link = db.query(CareLink).filter(
        CareLink.patient_id == patient.id,
        CareLink.caregiver_user_id == caregiver.id
    ).first()

    if existing_link:

        if existing_link.status != "revoked":
            raise HTTPException(
                status_code=409,
                detail="An invitation or active caregiver relationship already exists"
            )

        # Reuse the revoked relationship for a new invitation.
        existing_link.status = "pending"
        existing_link.invited_at = utc_now()
        existing_link.accepted_at = None
        existing_link.consented_at = None
        existing_link.revoked_at = None

        db.commit()
        db.refresh(existing_link)

        return existing_link

    invitation = CareLink(
        patient_id=patient.id,
        caregiver_user_id=caregiver.id,
        status="pending"
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return invitation


@router.post("/{invitation_id}/accept", response_model=CareLinkResponse)
def accept_care_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invitation = db.query(CareLink).filter(
        CareLink.id == invitation_id,
        CareLink.caregiver_user_id == current_user.id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Invitation is not pending"
        )

    invitation.status = "accepted"
    invitation.accepted_at = utc_now()

    db.commit()
    db.refresh(invitation)

    return invitation


@router.post("/{invitation_id}/consent", response_model=CareLinkResponse)
def grant_caregiver_consent(
    invitation_id: int,
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

    invitation = db.query(CareLink).filter(
        CareLink.id == invitation_id,
        CareLink.patient_id == patient.id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found"
        )

    if invitation.status != "accepted":
        raise HTTPException(
            status_code=409,
            detail="Caregiver must accept the invitation first"
        )

    invitation.status = "active"
    invitation.consented_at = utc_now()

    db.commit()
    db.refresh(invitation)

    return invitation


@router.delete("/{invitation_id}", response_model=CareLinkResponse)
def revoke_caregiver_consent(
    invitation_id: int,
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

    invitation = db.query(CareLink).filter(
        CareLink.id == invitation_id,
        CareLink.patient_id == patient.id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Caregiver relationship not found"
        )

    if invitation.status == "revoked":
        return invitation

    invitation.status = "revoked"
    invitation.revoked_at = utc_now()

    db.commit()
    db.refresh(invitation)

    return invitation

@router.get("/sent", response_model=list[CareLinkResponse])
def get_sent_invitations(
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

    return db.query(CareLink).filter(
        CareLink.patient_id == patient.id
    ).order_by(
        CareLink.invited_at.desc()
    ).all()


@router.get("/received", response_model=list[CareLinkResponse])
def get_received_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(CareLink).filter(
        CareLink.caregiver_user_id == current_user.id
    ).order_by(
        CareLink.invited_at.desc()
    ).all()
