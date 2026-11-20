from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    # Link patient profile to a registered user
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True
    )

    date_of_birth = Column(Date, nullable=True)

    preferred_language = Column(
        String(10),
        nullable=False,
        default="en"
    )

    emergency_contact_name = Column(
        String(100),
        nullable=True
    )

    emergency_contact_phone = Column(
        String(20),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
