from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session

from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence
)


def generate_dose_occurrences(
    db: Session,
    schedule: MedicationSchedule
):
    """
    Generate one pending dose occurrence for each date
    in an active medication schedule.

    Scheduled times are interpreted in the schedule's
    configured timezone and stored as UTC timestamps.
    """

    if schedule.is_active != "true":
        raise ValueError("Cannot generate doses for an inactive schedule")

    if schedule.end_date < schedule.start_date:
        raise ValueError("Schedule end date cannot be before start date")

    try:
        schedule_timezone = ZoneInfo(schedule.timezone)
    except ZoneInfoNotFoundError:
        raise ValueError("Invalid schedule timezone")

    created_occurrences = []

    current_date = schedule.start_date

    while current_date <= schedule.end_date:

        local_datetime = datetime.combine(
            current_date,
            schedule.scheduled_time,
            tzinfo=schedule_timezone
        )

        # Store a UTC timestamp.
        # SQLite does not preserve timezone information,
        # so the stored value is a naive UTC datetime.
        scheduled_for = (
            local_datetime
            .astimezone(timezone.utc)
            .replace(tzinfo=None)
        )

        existing_occurrence = db.query(DoseOccurrence).filter(
            DoseOccurrence.schedule_id == schedule.id,
            DoseOccurrence.scheduled_for == scheduled_for
        ).first()

        if not existing_occurrence:
            occurrence = DoseOccurrence(
                schedule_id=schedule.id,
                patient_id=schedule.patient_id,
                scheduled_for=scheduled_for,
                status="pending"
            )

            db.add(occurrence)
            created_occurrences.append(occurrence)

        current_date += timedelta(days=1)

    db.commit()

    for occurrence in created_occurrences:
        db.refresh(occurrence)

    return created_occurrences
