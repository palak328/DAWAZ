
from datetime import date, time, datetime
from pydantic import BaseModel, Field, ConfigDict


class MedicationScheduleCreate(BaseModel):
    prescription_item_id: int = Field(gt=0)
    scheduled_time: time
    start_date: date
    end_date: date
    timezone: str = Field(default="Asia/Kolkata", max_length=50)


class MedicationScheduleResponse(BaseModel):
    id: int
    patient_id: int
    prescription_item_id: int
    scheduled_time: time
    start_date: date
    end_date: date
    timezone: str
    is_active: str
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class DoseOccurrenceResponse(BaseModel):
    id: int
    schedule_id: int
    patient_id: int
    scheduled_for: datetime
    status: str
    reported_at: datetime | None
    notes: str | None

    model_config = ConfigDict(from_attributes=True)
