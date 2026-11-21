from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON
)
from datetime import datetime, timezone

from app.database import Base


class MedicineScan(Base):
    __tablename__ = "medicine_scans"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    member2_request_id = Column(String(100), nullable=True)

    raw_ocr_text = Column(Text, nullable=True)
    identity_status = Column(String(50), nullable=True)

    image_quality = Column(JSON, nullable=True)
    matched_medicine = Column(JSON, nullable=True)
    candidates = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)

    response_payload = Column(JSON, nullable=False)

    reconciliation_status = Column(String(100), nullable=True)
    reconciliation_payload = Column(JSON, nullable=True)
    reconciled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    