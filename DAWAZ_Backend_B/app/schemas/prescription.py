from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class PrescriptionItemCreate(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=150)
    strength: str | None = Field(default=None, max_length=100)
    dosage_form: str | None = Field(default=None, max_length=50)

    dose: str | None = Field(default=None, max_length=100)
    route: str | None = Field(default=None, max_length=50)
    frequency: str | None = Field(default=None, max_length=150)

    duration_days: int | None = Field(default=None, ge=1)
    start_date: date | None = None
    end_date: date | None = None

    food_instruction: str | None = Field(default=None, max_length=100)
    additional_instructions: str | None = None
    dose_quantity: Decimal | None = Field(default=None, gt=0)
    dose_unit: str | None = Field(default=None, max_length=30)

class PrescriptionCreate(BaseModel):
    prescription_date: date | None = None
    notes: str | None = None
    items: list[PrescriptionItemCreate] = Field(default_factory=list)


class PrescriptionItemResponse(PrescriptionItemCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PrescriptionResponse(BaseModel):
    id: int
    patient_id: int
    status: str
    prescription_date: date | None
    notes: str | None
    created_at: datetime | None
    confirmed_at: datetime | None
    activated_at: datetime | None
    items: list[PrescriptionItemResponse]

    model_config = ConfigDict(from_attributes=True)
