
import logging
import httpx

from fastapi import (
    APIRouter, Depends, File, HTTPException,
    UploadFile, status
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription, PrescriptionItem
from app.routers.users import get_current_user
from app.services.prescription_extraction_service import extract_prescription

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
        raise HTTPException(404, "Patient profile not found")

    try:
        file_bytes = await file.read()

        extraction = await extract_prescription(
            filename=file.filename or "prescription",
            content_type=file.content_type or "",
            file_bytes=file_bytes
        )

        extraction_data = extraction.get("data")

        if not isinstance(extraction_data, dict):
            raise HTTPException(
                502, "Invalid extraction response"
            )

        # Extraction is always saved as an unconfirmed draft.
        prescription = Prescription(
            patient_id=patient.id,
            status="draft",
            raw_ocr_text=extraction_data.get("raw_text"),
            extraction_status=extraction_data.get("status"),
            extraction_warnings=extraction.get("warnings", []),
            extraction_payload=extraction
        )

        for med in extraction_data.get("medicines", []):
            med_name = med.get("medicine_name") or "Extracted Medicine"
            strengths = med.get("strengths_found") or []
            strength_str = strengths[0] if strengths else med.get("strength")
            form_str = med.get("form") or med.get("dosage_form") or "tablet"
            dose_str = med.get("dose") or "1 tablet"
            route_str = med.get("route") or "oral"
            freq_str = med.get("frequency") or "once daily"
            timing_str = med.get("timing")
            unresolved = med.get("unresolved_fields") or []

            prescription.items.append(PrescriptionItem(
                medicine_name=med_name,
                strength=strength_str,
                dosage_form=form_str,
                dose=dose_str,
                dose_quantity=1.0,
                dose_unit=form_str,
                route=route_str,
                frequency=freq_str,
                timing=timing_str,
                duration_days=7,
                raw_line=med.get("raw_line"),
                raw_instruction_text=med.get("raw_instruction_text"),
                strengths_found=strengths,
                unresolved_fields=unresolved,
                identity_confirmed=False,
                needs_review=True,
                reviewed_by_patient=False
            ))

        db.add(prescription)
        db.commit()
        db.refresh(prescription)

        return {
            "prescription_id": prescription.id,
            "status": "draft",
            "confirmed": False,
            "reminders_activated": False,
            "extraction": extraction
        }

    except HTTPException:
        db.rollback()
        raise

    except ValueError as exc:
        db.rollback()
        raise HTTPException(400, str(exc))

    except httpx.TimeoutException:
        db.rollback()
        raise HTTPException(
            504, "Prescription extraction service timed out"
        )

    except httpx.HTTPStatusError:
        db.rollback()
        logger.exception("Backend A extraction HTTP error")
        raise HTTPException(
            502, "Prescription extraction service returned an error"
        )

    except httpx.RequestError:
        db.rollback()
        logger.exception("Backend A extraction unavailable")
        raise HTTPException(
            503, "Prescription extraction service is unavailable"
        )

    except Exception:
        db.rollback()
        logger.exception("Failed to save extraction draft")
        raise HTTPException(
            500, "Could not save prescription extraction draft"
        )

    finally:
        await file.close()
