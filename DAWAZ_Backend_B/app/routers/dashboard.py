
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription, PrescriptionItem
from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence
)
from app.models.medication_stock import MedicationStock
from app.models.alert import Alert
from app.models.care_link import CareLink

from app.routers.users import get_current_user
from app.schemas.dashboard import PatientDashboardResponse


router = APIRouter(
    prefix="/patients",
    tags=["Patient Dashboard"]
)


@router.get(
    "/dashboard",
    response_model=PatientDashboardResponse
)
def get_patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Find the logged-in user's patient profile.
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    # 2. Get active prescriptions.
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient.id,
        Prescription.status == "active"
    ).all()

    prescription_data = []

    for prescription in prescriptions:
        items = db.query(PrescriptionItem).filter(
            PrescriptionItem.prescription_id == prescription.id
        ).all()

        prescription_data.append({
            "id": prescription.id,
            "status": prescription.status,
            "prescription_date": prescription.prescription_date,
            "items": [
                {
                    "id": item.id,
                    "medicine_name": item.medicine_name,
                    "strength": item.strength,
                    "dosage_form": item.dosage_form,
                    "dose": item.dose,
                    "frequency": item.frequency,
                    "route": item.route
                }
                for item in items
            ]
        })

    # 3. Get today's doses using the schedule's timezone.
    schedules = db.query(MedicationSchedule).filter(
        MedicationSchedule.patient_id == patient.id,
        MedicationSchedule.is_active == "true"
    ).all()

    today_doses = []

    for schedule in schedules:
        try:
            local_timezone = ZoneInfo(schedule.timezone)
        except ZoneInfoNotFoundError:
            continue

        local_now = datetime.now(local_timezone)
        local_today = local_now.date()

        if not (
            schedule.start_date <= local_today <= schedule.end_date
        ):
            continue

        local_start = datetime.combine(
            local_today,
            time.min,
            tzinfo=local_timezone
        )

        local_end = datetime.combine(
            local_today + timedelta(days=1),
            time.min,
            tzinfo=local_timezone
        )

        utc_start = local_start.astimezone(
            timezone.utc
        ).replace(tzinfo=None)

        utc_end = local_end.astimezone(
            timezone.utc
        ).replace(tzinfo=None)

        occurrences = db.query(DoseOccurrence).filter(
            DoseOccurrence.schedule_id == schedule.id,
            DoseOccurrence.patient_id == patient.id,
            DoseOccurrence.scheduled_for >= utc_start,
            DoseOccurrence.scheduled_for < utc_end
        ).all()

        medicine = db.query(PrescriptionItem).filter(
            PrescriptionItem.id == schedule.prescription_item_id
        ).first()

        if not medicine:
            continue

        for occurrence in occurrences:
            scheduled_utc = occurrence.scheduled_for.replace(
                tzinfo=timezone.utc
            )

            scheduled_local = scheduled_utc.astimezone(
                local_timezone
            )

            today_doses.append({
                "id": occurrence.id,
                "schedule_id": schedule.id,
                "prescription_item_id": medicine.id,
                "medicine_name": medicine.medicine_name,
                "scheduled_for": scheduled_utc,
                "scheduled_time": scheduled_local.time(),
                "status": occurrence.status
            })

    # Sort doses by local scheduled time.
    today_doses.sort(key=lambda dose: dose["scheduled_for"])

    # 4. Calculate today's dose summary.
    dose_summary = {
        "total": len(today_doses),
        "pending": sum(
            1 for dose in today_doses
            if dose["status"] == "pending"
        ),
        "taken": sum(
            1 for dose in today_doses
            if dose["status"] == "taken"
        ),
        "skipped": sum(
            1 for dose in today_doses
            if dose["status"] == "skipped"
        )
    }

    # 5. Get medicine stock.
    stock_records = db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient.id
    ).all()

    stock_data = []

    for stock in stock_records:
        medicine = db.query(PrescriptionItem).filter(
            PrescriptionItem.id == stock.prescription_item_id
        ).first()

        if not medicine:
            continue

        stock_data.append({
            "id": stock.id,
            "prescription_item_id": medicine.id,
            "medicine_name": medicine.medicine_name,
            "quantity": stock.quantity,
            "unit": stock.unit,
            "updated_at": stock.updated_at
        })

    # 6. Get unread alerts.
    unread_alerts = db.query(Alert).filter(
        Alert.patient_id == patient.id,
        Alert.status == "unread"
    ).order_by(Alert.created_at.desc()).all()

    # 7. Get caregiver relationships.
    caregivers = db.query(CareLink).filter(
        CareLink.patient_id == patient.id,
        CareLink.status != "revoked"
    ).all()

    return {
        "patient": patient,
        "prescriptions": prescription_data,
        "today_doses": today_doses,
        "dose_summary": dose_summary,
        "stock": stock_data,
        "unread_alerts": unread_alerts,
        "caregivers": caregivers
    }
