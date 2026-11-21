
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.database import Base


class CareLink(Base):
    __tablename__ = "care_links"

    __table_args__ = (
        UniqueConstraint(
            "patient_id",
            "caregiver_user_id",
            name="unique_patient_caregiver"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    caregiver_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    invited_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    accepted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    consented_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    revoked_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
