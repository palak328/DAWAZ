
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    id: int
    patient_id: int
    occurrence_id: int
    alert_type: str
    title: str
    message: str
    status: str
    created_at: datetime | None
    acknowledged_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
