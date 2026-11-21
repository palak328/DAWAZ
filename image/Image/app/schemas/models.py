
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class MedicineQuestion(BaseModel):
    question: str = Field(min_length=2, max_length=500)

    # Language requested by the frontend.
    language: Literal["en-IN", "hi-IN"] = "en-IN"

    # Member 3 should supply confirmed prescription data from the server.
    confirmed_plan: Optional[List[dict]] = None


class ReconcileRequest(BaseModel):
    scan_result: dict
    confirmed_plan: Optional[List[dict]] = None
    plan_is_confirmed: bool = False
