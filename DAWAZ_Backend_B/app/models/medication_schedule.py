
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Time,
    ForeignKey,
    Text,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

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

    scheduled_time = Column(Time, nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")

    is_active = Column(String(10), nullable=False, default="true")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class DoseOccurrence(Base):
    __tablename__ = "dose_occurrences"

    __table_args__ = (
        UniqueConstraint(
            "schedule_id",
            "scheduled_for",
            name="unique_schedule_occurrence"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    schedule_id = Column(
        Integer,
        ForeignKey("medication_schedules.id"),
        nullable=False,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    scheduled_for = Column(DateTime(timezone=True), nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    reported_at = Column(DateTime(timezone=True), nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class DoseOccurrenceCorrection(Base):
    __tablename__ = "dose_occurrence_corrections"

    id = Column(Integer, primary_key=True, index=True)

    occurrence_id = Column(
        Integer,
        ForeignKey("dose_occurrences.id"),
        nullable=False,
        index=True
    )

    previous_status = Column(String(20), nullable=False)
    corrected_status = Column(String(20), nullable=False)

    previous_notes = Column(Text, nullable=True)
    corrected_notes = Column(Text, nullable=True)

    corrected_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )