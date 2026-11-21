
import logging

import httpx

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.routers.users import get_current_user
from app.services.prescription_extraction_service import (
    extract_prescription
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescription Extraction"]
)


@router.post("/extract", status_code=status.HTTP_201_CREATED)
async def upload_prescription_for_extraction(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    try:
        file_bytes = await file.read()

        extraction = await extract_prescription(
            filename=file.filename or "prescription",
            content_type=file.content_type or "",
            file_bytes=file_bytes
        )

        extraction_data = extraction["data"]

        # Always save extraction as a draft.
        prescription = Prescription(
            patient_id=patient.id,
            status="draft",
            raw_ocr_text=extraction_data.get("raw_text"),
            extraction_status=extraction_data.get("status"),
            extraction_warnings=extraction.get("warnings", []),
            extraction_payload=extraction_data
        )

        db.add(prescription)
        db.commit()
        db.refresh(prescription)

        return {
            "prescription_id": prescription.id,
            "status": prescription.status,
            "extraction": extraction
        }

    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except httpx.TimeoutException:
        db.rollback()
        raise HTTPException(
            status_code=504,
            detail="Prescription extraction service timed out"
        )

    except httpx.HTTPStatusError:
        db.rollback()
        logger.exception("Member 2 prescription extraction returned an HTTP error")
        raise HTTPException(
            status_code=502,
            detail="Prescription extraction service returned an error"
        )

    except httpx.RequestError:
        db.rollback()
        logger.exception("Could not connect to Member 2 prescription extraction")
        raise HTTPException(
            status_code=503,
            detail="Prescription extraction service is unavailable"
        )

    except Exception:
        db.rollback()
        logger.exception("Failed to save prescription extraction draft")
        raise HTTPException(
            status_code=500,
            detail="Could not save prescription extraction draft"
        )

    finally:
        await file.close()
