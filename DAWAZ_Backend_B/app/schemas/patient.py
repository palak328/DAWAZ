
from datetime import date, datetime

from pydantic import BaseModel, Field


class PatientProfileCreate(BaseModel):
    date_of_birth: date | None = None

    preferred_language: str = Field(
        default="en",
        min_length=2,
        max_length=10
    )

    emergency_contact_name: str | None = Field(
        default=None,
        max_length=100
    )

    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20
    )


class PatientProfileResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: date | None
    preferred_language: str
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}
