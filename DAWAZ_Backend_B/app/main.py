from fastapi import FastAPI
from app.database import Base, engine
from app.models.patient import Patient
from app.routers.users import router as users_router
from app.routers.patients import router as patients_router
from app.models.prescription import Prescription, PrescriptionItem
from app.routers.prescriptions import router as prescriptions_router
from app.routers.alerts import router as alerts_router
import asyncio
import logging
from contextlib import asynccontextmanager

from app.database import SessionLocal
from app.services.reminder_worker import process_due_reminders
from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence,
    DoseOccurrenceCorrection
)
from app.routers.medication_schedules import router as medication_schedules_router
from app.routers.dose_occurrences import router as dose_occurrences_router
from app.models.medication_stock import (
    MedicationStock,
    StockTransaction
)
from app.routers.medication_stock import router as medication_stock_router
logger = logging.getLogger(__name__)


def run_reminder_check():
    db = SessionLocal()

    try:
        alerts = process_due_reminders(db)

        if alerts:
            logger.info(
                "Created %s medication reminders",
                len(alerts)
            )

    except Exception:
        logger.exception("Reminder worker failed")

    finally:
        db.close()


async def reminder_scheduler():
    while True:
        await asyncio.sleep(30)

        await asyncio.to_thread(run_reminder_check)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(reminder_scheduler())

    try:
        yield
    finally:
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass
app = FastAPI(
    title="DAWAZ Backend B",
    description="Platform and voice-processing API for DAWAZ",
    version="1.0.0",
    lifespan= lifespan
)

# Create database tables
from app.models.user import User
from app.models.alert import Alert
Base.metadata.create_all(bind=engine)
app.include_router(users_router)
app.include_router(patients_router)
app.include_router(prescriptions_router)
app.include_router(medication_schedules_router)
app.include_router(dose_occurrences_router)
app.include_router(medication_stock_router)
app.include_router(alerts_router)
@app.get("/")
def home():
    return {
        "message": "Welcome to DAWAZ Backend B",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DAWAZ Backend B",
        "database": "connected"
    }
