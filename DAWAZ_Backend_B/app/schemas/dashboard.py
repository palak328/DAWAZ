
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DashboardPatient(BaseModel):
    id: int
    user_id: int
    date_of_birth: date | None
    preferred_language: str
    model_config = ConfigDict(from_attributes=True)


class DashboardMedicine(BaseModel):
    id: int
    medicine_name: str
    strength: str | None
    dosage_form: str | None
    dose: str | None
    frequency: str | None
    route: str | None


class DashboardPrescription(BaseModel):
    id: int
    status: str
    prescription_date: date | None
    items: list[DashboardMedicine]


class DashboardDose(BaseModel):
    id: int
    schedule_id: int
    prescription_item_id: int
    medicine_name: str
    scheduled_for: datetime
    scheduled_time: time
    status: str


class DashboardStock(BaseModel):
    id: int
    prescription_item_id: int
    medicine_name: str
    quantity: Decimal
    unit: str
    updated_at: datetime | None


class DashboardAlert(BaseModel):
    id: int
    occurrence_id: int
    title: str
    message: str
    status: str
    created_at: datetime | None


class DashboardCaregiver(BaseModel):
    id: int
    caregiver_user_id: int
    status: str
    invited_at: datetime | None
    accepted_at: datetime | None
    consented_at: datetime | None


class PatientDashboardResponse(BaseModel):
    patient: DashboardPatient

    prescriptions: list[DashboardPrescription]

    today_doses: list[DashboardDose]

    dose_summary: dict[str, int]

    stock: list[DashboardStock]

    unread_alerts: list[DashboardAlert]

    caregivers: list[DashboardCaregiver]
