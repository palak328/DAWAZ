from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import MAX_UPLOAD_BYTES
from app.core.responses import success
from app.schemas.models import MedicineQuestion, ReconcileRequest
from app.services.image_quality.quality_checker import check_image_quality
from app.services.ocr.ocr_service import extract_text_from_image
from app.services.medicine_matching.matcher import match_medicine
from app.services.prescription_extraction.extractor import read_prescription_file, make_prescription_draft
from app.services.prescription_checking.reconciler import reconcile_with_confirmed_plan
from app.services.question_answering.answerer import answer_question

router = APIRouter(prefix="/member2", tags=["Member 2 - Medicine understanding"])

async def read_upload(upload: UploadFile) -> bytes:
    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large.")
    return content

@router.post("/scans")
async def scan_medicine(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Please upload a JPG, PNG or WEBP image.")

    image_bytes = await read_upload(image)
    quality = check_image_quality(image_bytes)

    if not quality["is_usable"]:
        return success({
            "image_quality": quality,
            "raw_ocr_text": "",
            "identity_status": "INSUFFICIENT_IMAGE",
            "matched_medicine": None,
            "candidates": [],
            "message": "Please take another photo using the guidance shown.",
        }, warnings=quality["messages"])

    ocr = extract_text_from_image(image_bytes)
    if not ocr["available"]:
        return success({
            "image_quality": quality,
            "raw_ocr_text": "",
            "identity_status": "UNCERTAIN",
            "matched_medicine": None,
            "candidates": [],
            "message": ocr["message"],
        }, warnings=["OCR could not run."])

    match = match_medicine(ocr["raw_text"])
    return success({
        "image_quality": quality,
        "raw_ocr_text": ocr["raw_text"],
        **match,
    })

@router.post("/prescriptions/extract")
async def extract_prescription(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    filename = file.filename or ""
    if not (
        content_type in ("image/jpeg", "image/png", "image/webp", "application/pdf")
        or filename.lower().endswith(".pdf")
    ):
        raise HTTPException(status_code=415, detail="Please upload a JPG, PNG, WEBP or PDF file.")

    file_bytes = await read_upload(file)
    extracted = read_prescription_file(file_bytes, filename)
    draft = make_prescription_draft(extracted["raw_text"])
    draft["pages_read"] = extracted["pages_read"]
    draft["ocr_available"] = extracted["ocr_available"]
    if extracted.get("message"):
        draft["extraction_message"] = extracted["message"]
    return success(draft)

@router.post("/reconcile")
def reconcile(request: ReconcileRequest):
    result = reconcile_with_confirmed_plan(
        request.scan_result,
        request.confirmed_plan,
        request.plan_is_confirmed,
    )
    return success(result)

@router.post("/questions")
def questions(request: MedicineQuestion):
    result = answer_question(
        request.question,
        request.confirmed_plan,
        language=request.language,
    )
    return success(result)