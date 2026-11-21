from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Numeric
from app.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="draft"
    )

    prescription_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship(
        "PrescriptionItem",
        back_populates="prescription",
        cascade="all, delete-orphan"
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)

    prescription_id = Column(
        Integer,
        ForeignKey("prescriptions.id"),
        nullable=False,
        index=True
    )
    dose_quantity = Column(Numeric(10, 3), nullable=True)

    dose_unit = Column(String(30), nullable=True)
    medicine_name = Column(String(150), nullable=False)
    strength = Column(String(100), nullable=True)
    dosage_form = Column(String(50), nullable=True)

    dose = Column(String(100), nullable=True)
    route = Column(String(50), nullable=True)
    frequency = Column(String(150), nullable=True)

    duration_days = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    food_instruction = Column(String(100), nullable=True)
    additional_instructions = Column(Text, nullable=True)

    prescription = relationship(
        "Prescription",
        back_populates="items"
    )
