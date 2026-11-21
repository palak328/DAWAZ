
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.models.patient import Patient
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.alert import AlertResponse


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/", response_model=list[AlertResponse])
def get_alerts(
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

    return db.query(Alert).filter(
        Alert.patient_id == patient.id
    ).order_by(
        Alert.created_at.desc()
    ).all()


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
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

    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.patient_id == patient.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    if alert.status == "acknowledged":
        return alert

    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(
        timezone.utc
    ).replace(tzinfo=None)

    db.commit()
    db.refresh(alert)

    return alert
