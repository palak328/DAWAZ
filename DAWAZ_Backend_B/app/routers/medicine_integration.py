
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
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.medicine_scan import MedicineScan
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.routers.users import get_current_user
from app.services.medicine_integration_service import (
    scan_medicine,
    reconcile_medicine
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Medicine Integration"]
)


class ReconciliationRequest(BaseModel):
    prescription_id: int
    scan_result: int


def get_patient(current_user: User, db: Session):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return patient


def handle_member2_error(exc):
    if isinstance(exc, httpx.TimeoutException):
        raise HTTPException(504, "Backend A request timed out")

    if isinstance(exc, httpx.HTTPStatusError):
        logger.exception("Backend A returned an HTTP error")
        raise HTTPException(502, "Backend A returned an error")

    if isinstance(exc, httpx.RequestError):
        logger.exception("Backend A is unavailable")
        raise HTTPException(503, "Backend A is unavailable")

    if isinstance(exc, ValueError):
        raise HTTPException(400, str(exc))

    logger.exception("Medicine integration failed")
    raise HTTPException(502, "Medicine integration failed")


@router.post("/scans", status_code=status.HTTP_201_CREATED)
async def scan_medicine_image(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(current_user, db)

    try:
        result = await scan_medicine(
            image_bytes=await image.read(),
            filename=image.filename or "medicine-image",
            content_type=image.content_type or ""
        )

        data = result.get("data", {})

        scan = MedicineScan(
            patient_id=patient.id,
            member2_request_id=result.get("request_id"),
            raw_ocr_text=data.get("raw_ocr_text"),
            identity_status=data.get("identity_status"),
            image_quality=data.get("image_quality"),
            matched_medicine=data.get("matched_medicine"),
            candidates=data.get("candidates"),
            warnings=result.get("warnings", []),
            response_payload=result
        )

        db.add(scan)
        db.commit()
        db.refresh(scan)

        return {
            "scan_id": scan.id,
            "status": "saved",
            "scan_result": result
        }

    except (ValueError, httpx.RequestError, httpx.HTTPStatusError) as exc:
        db.rollback()
        handle_member2_error(exc)

    except Exception:
        db.rollback()
        logger.exception("Failed to save medicine scan")
        raise HTTPException(500, "Failed to save scan result")

    finally:
        await image.close()

@router.get("/scans/{scan_id}")
def get_scan_result(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(current_user, db)

    scan = db.query(MedicineScan).filter(
        MedicineScan.id == scan_id,
        MedicineScan.patient_id == patient.id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )

    return {
        "scan_id": scan.id,
        "identity_status": scan.identity_status,
        "raw_ocr_text": scan.raw_ocr_text,
        "image_quality": scan.image_quality,
        "matched_medicine": scan.matched_medicine,
        "candidates": scan.candidates,
        "warnings": scan.warnings,
        "created_at": scan.created_at,
        "scan_result": scan.response_payload,
        "reconciliation_status": scan.reconciliation_status,
        "reconciliation": scan.reconciliation_payload
    }
@router.post("/reconcile")
async def reconcile_scanned_medicine(
    request: ReconciliationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(current_user, db)

    prescription = db.query(Prescription).filter(
        Prescription.id == request.prescription_id,
        Prescription.patient_id == patient.id
    ).first()

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    if prescription.status not in ("confirmed", "active"):
        raise HTTPException(
            status_code=409,
            detail="Prescription must be confirmed before reconciliation"
        )

    if not prescription.items:
        raise HTTPException(
            status_code=400,
            detail="Prescription contains no medicines"
        )

    confirmed_plan = []

    for item in prescription.items:
        if not item.identity_confirmed:
            raise HTTPException(
                status_code=409,
                detail="Prescription contains an unverified medicine identity"
            )

        confirmed_plan.append({
            "medicine_name": item.medicine_name,
            "strength": item.strength,
            "form": item.dosage_form
        })

    try:
        return await reconcile_medicine(
            scan_result=request.scan_result,
            confirmed_plan=confirmed_plan,
            plan_is_confirmed=True
        )

    except (ValueError, httpx.RequestError, httpx.HTTPStatusError) as exc:
        handle_member2_error(exc)
