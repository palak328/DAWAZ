
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

    raw_line: str | None = None
    raw_instruction_text: str | None = None
    strengths_found: list[str] = Field(default_factory=list)
    timing: str | None = None


class PrescriptionCreate(BaseModel):
    prescription_date: date | None = None
    notes: str | None = None
    items: list[PrescriptionItemCreate] = Field(default_factory=list)


class PrescriptionItemResponse(BaseModel):
    id: int
    medicine_name: str
    strength: str | None
    dosage_form: str | None
    dose: str | None
    route: str | None
    frequency: str | None
    duration_days: int | None
    start_date: date | None
    end_date: date | None
    food_instruction: str | None
    additional_instructions: str | None
    dose_quantity: Decimal | None
    dose_unit: str | None
    raw_line: str | None
    raw_instruction_text: str | None
    strengths_found: list[str] | None
    unresolved_fields: list[str] | None
    timing: str | None
    identity_confirmed: bool
    needs_review: bool
    reviewed_by_patient: bool
    reviewed_at: datetime | None

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
    raw_ocr_text: str | None = None
    extraction_status: str | None = None
    extraction_warnings: list[str] | None = None
    extraction_payload: dict | None = None
    items: list[PrescriptionItemResponse]

    model_config = ConfigDict(from_attributes=True)
