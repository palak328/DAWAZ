
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class MedicationStockResponse(BaseModel):
    id: int
    patient_id: int
    prescription_item_id: int
    quantity: int
    unit: str
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class StockRestockRequest(BaseModel):
    prescription_item_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    unit: str = Field(default="tablets", min_length=1, max_length=30)
    notes: str | None = None


class StockReconciliationRequest(BaseModel):
    prescription_item_id: int = Field(gt=0)
    actual_quantity: int = Field(ge=0)
    notes: str | None = None


class StockTransactionResponse(BaseModel):
    id: int
    stock_id: int
    transaction_type: str
    quantity_change: int
    previous_quantity: int
    new_quantity: int
    notes: str | None
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
