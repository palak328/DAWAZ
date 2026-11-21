
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence
)
from app.models.alert import Alert


def process_due_reminders(db: Session):
    """
    Find pending dose occurrences that are due
    and create one in-app alert per occurrence.
    """

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    due_occurrences = db.query(DoseOccurrence).filter(
        DoseOccurrence.status == "pending",
        DoseOccurrence.scheduled_for <= now
    ).all()

    created_alerts = []

    try:
        for occurrence in due_occurrences:

            schedule = db.query(MedicationSchedule).filter(
                MedicationSchedule.id == occurrence.schedule_id,
                MedicationSchedule.patient_id == occurrence.patient_id,
                MedicationSchedule.is_active == "true"
            ).first()

            if not schedule:
                continue

            existing_alert = db.query(Alert).filter(
                Alert.occurrence_id == occurrence.id
            ).first()

            if existing_alert:
                continue

            alert = Alert(
                patient_id=occurrence.patient_id,
                occurrence_id=occurrence.id,
                alert_type="dose_reminder",
                title="Medication Reminder",
                message="You have a scheduled medication dose.",
                status="unread"
            )

            try:
                # Savepoint isolates a duplicate insertion conflict.
                with db.begin_nested():
                    db.add(alert)
                    db.flush()

                created_alerts.append(alert)

            except IntegrityError:
                # Another worker may have inserted this alert.
                continue

        db.commit()

        for alert in created_alerts:
            db.refresh(alert)

        return created_alerts

    except Exception:
        db.rollback()
        raise
