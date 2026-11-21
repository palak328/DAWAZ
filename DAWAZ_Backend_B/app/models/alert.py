
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    __table_args__ = (
        UniqueConstraint(
            "occurrence_id",
            name="unique_alert_per_occurrence"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    occurrence_id = Column(
        Integer,
        ForeignKey("dose_occurrences.id"),
        nullable=False,
        index=True
    )

    alert_type = Column(
        String(30),
        nullable=False,
        default="dose_reminder"
    )

    title = Column(String(150), nullable=False)

    message = Column(Text, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="unread"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    acknowledged_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
