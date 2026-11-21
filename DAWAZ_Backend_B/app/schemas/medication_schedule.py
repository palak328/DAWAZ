
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
from typing import Literal


class DoseOccurrenceReportRequest(BaseModel):
    status: Literal["taken", "skipped"]
    notes: str | None = None
class DoseOccurrenceCorrectionRequest(BaseModel):
    status: Literal["taken", "skipped"]
    notes: str | None = None
class DoseOccurrenceCorrectionResponse(BaseModel):
    id: int
    occurrence_id: int
    previous_status: str
    corrected_status: str
    previous_notes: str | None
    corrected_notes: str | None
    corrected_at: datetime

    model_config = ConfigDict(from_attributes=True)