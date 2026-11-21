
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class CareInvitationCreate(BaseModel):
    caregiver_username: str = Field(
        min_length=3,
        max_length=50
    )


class CareLinkResponse(BaseModel):
    id: int
    patient_id: int
    caregiver_user_id: int
    status: str
    invited_at: datetime | None
    accepted_at: datetime | None
    consented_at: datetime | None
    revoked_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
