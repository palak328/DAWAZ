
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.sql import func

from app.database import Base


class MedicationStock(Base):
    __tablename__ = "medication_stocks"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    prescription_item_id = Column(
        Integer,
        ForeignKey("prescription_items.id"),
        nullable=False,
        index=True
    )

    quantity = Column(Integer, nullable=False, default=0)

    unit = Column(String(30), nullable=False, default="tablets")

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)

    stock_id = Column(
        Integer,
        ForeignKey("medication_stocks.id"),
        nullable=False,
        index=True
    )

    transaction_type = Column(String(20), nullable=False)

    quantity_change = Column(Integer, nullable=False)

    previous_quantity = Column(Integer, nullable=False)

    new_quantity = Column(Integer, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
