from fastapi import FastAPI
from app.database import Base, engine
from app.models.patient import Patient
from app.routers.users import router as users_router
from app.routers.patients import router as patients_router
from app.models.prescription import Prescription, PrescriptionItem
from app.routers.prescriptions import router as prescriptions_router
from app.models.medication_schedule import (
    MedicationSchedule,
    DoseOccurrence,
    DoseOccurrenceCorrection
)
from app.routers.medication_schedules import router as medication_schedules_router
from app.routers.dose_occurrences import router as dose_occurrences_router
app = FastAPI(
    title="DAWAZ Backend B",
    description="Platform and voice-processing API for DAWAZ",
    version="1.0.0"
)

# Create database tables
from app.models.user import User
Base.metadata.create_all(bind=engine)
app.include_router(users_router)
app.include_router(patients_router)
app.include_router(prescriptions_router)
app.include_router(medication_schedules_router)
app.include_router(dose_occurrences_router)
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
