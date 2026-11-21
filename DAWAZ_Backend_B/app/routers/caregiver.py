from app.models.prescription import Prescription, PrescriptionItem
from app.models.medication_schedule import DoseOccurrence
from app.models.medication_stock import MedicationStock
from app.models.alert import Alert
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.care_link import CareLink
from app.routers.users import get_current_user


router = APIRouter(
    prefix="/caregiver",
    tags=["Caregiver Access"]
)


@router.get("/patients")
def get_linked_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    links = db.query(CareLink).filter(
        CareLink.caregiver_user_id == current_user.id,
        CareLink.status == "active",
        CareLink.consented_at.isnot(None)
    ).all()

    patients = []

    for link in links:
        patient = db.query(Patient).filter(
            Patient.id == link.patient_id
        ).first()

        if not patient:
            continue

        patients.append({
            "patient_id": patient.id,
            "preferred_language": patient.preferred_language,
            "care_link_id": link.id,
            "consented_at": link.consented_at
        })

    return {"patients": patients}

@router.get("/patients/{patient_id}/dashboard")
def get_caregiver_patient_dashboard(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify active, consented caregiver relationship.
    care_link = db.query(CareLink).filter(
        CareLink.patient_id == patient_id,
        CareLink.caregiver_user_id == current_user.id,
        CareLink.status == "active",
        CareLink.consented_at.isnot(None)
    ).first()

    if not care_link:
        raise HTTPException(
            status_code=403,
            detail="Active patient consent is required"
        )

    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id,
        Prescription.status == "active"
    ).all()

    prescription_data = []

    for prescription in prescriptions:
        items = db.query(PrescriptionItem).filter(
            PrescriptionItem.prescription_id == prescription.id
        ).all()

        prescription_data.append({
            "id": prescription.id,
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

    doses = db.query(DoseOccurrence).filter(
        DoseOccurrence.patient_id == patient_id
    ).order_by(
        DoseOccurrence.scheduled_for.desc()
    ).limit(50).all()

    stock_records = db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient_id
    ).all()

    stock_data = []

    for stock in stock_records:
        medicine = db.query(PrescriptionItem).filter(
            PrescriptionItem.id == stock.prescription_item_id
        ).first()

        if medicine:
            stock_data.append({
                "medicine_name": medicine.medicine_name,
                "quantity": stock.quantity,
                "unit": stock.unit
            })

    alerts = db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.status == "unread"
    ).order_by(
        Alert.created_at.desc()
    ).all()

    return {
        "patient": {
            "id": patient.id,
            "preferred_language": patient.preferred_language
        },
        "prescriptions": prescription_data,
        "recent_dose_occurrences": [
            {
                "id": dose.id,
                "scheduled_for": dose.scheduled_for,
                "status": dose.status
            }
            for dose in doses
        ],
        "stock": stock_data,
        "unread_alerts": [
            {
                "id": alert.id,
                "title": alert.title,
                "message": alert.message,
                "created_at": alert.created_at
            }
            for alert in alerts
        ]
    }
