from typing import Optional, List
from pydantic import BaseModel, Field

class MedicineQuestion(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    # Member 3 should supply the confirmed prescription data from the server,
    # not accept arbitrary patient plan details from an untrusted browser.
    confirmed_plan: Optional[List[dict]] = None

class ReconcileRequest(BaseModel):
    scan_result: dict
    confirmed_plan: Optional[List[dict]] = None
    plan_is_confirmed: bool = False
