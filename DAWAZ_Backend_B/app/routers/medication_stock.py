
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import PrescriptionItem, Prescription
from app.models.medication_stock import MedicationStock, StockTransaction
from app.routers.users import get_current_user
from app.schemas.medication_stock import (
    MedicationStockResponse,
    StockRestockRequest,
    StockReconciliationRequest,
    StockTransactionResponse
)

router = APIRouter(
    prefix="/stock",
    tags=["Medication Stock"]
)


def get_patient(db: Session, current_user: User):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return patient


def get_valid_prescription_item(
    db: Session,
    patient_id: int,
    prescription_item_id: int
):
    item = db.query(PrescriptionItem).join(
        Prescription,
        PrescriptionItem.prescription_id == Prescription.id
    ).filter(
        PrescriptionItem.id == prescription_item_id,
        Prescription.patient_id == patient_id,
        Prescription.status == "active"
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found in an active prescription"
        )

    return item


@router.get(
    "/",
    response_model=list[MedicationStockResponse]
)
def get_patient_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(db, current_user)

    return db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient.id
    ).all()


@router.post(
    "/restock",
    response_model=MedicationStockResponse,
    status_code=201
)
def restock_medicine(
    request: StockRestockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(db, current_user)

    get_valid_prescription_item(
        db,
        patient.id,
        request.prescription_item_id
    )

    stock = db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient.id,
        MedicationStock.prescription_item_id == request.prescription_item_id
    ).first()

    if not stock:
        stock = MedicationStock(
            patient_id=patient.id,
            prescription_item_id=request.prescription_item_id,
            quantity=0,
            unit=request.unit
        )
        db.add(stock)
        db.flush()
    elif stock.unit != request.unit:
        raise HTTPException(
            status_code=400,
            detail="Stock unit does not match existing stock unit"
        )

    previous_quantity = stock.quantity
    stock.quantity += request.quantity

    transaction = StockTransaction(
        stock_id=stock.id,
        transaction_type="restock",
        quantity_change=request.quantity,
        previous_quantity=previous_quantity,
        new_quantity=stock.quantity,
        notes=request.notes
    )

    db.add(transaction)
    db.commit()
    db.refresh(stock)

    return stock


@router.post(
    "/reconcile",
    response_model=MedicationStockResponse
)
def reconcile_medicine_stock(
    request: StockReconciliationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(db, current_user)

    get_valid_prescription_item(
        db,
        patient.id,
        request.prescription_item_id
    )

    stock = db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient.id,
        MedicationStock.prescription_item_id == request.prescription_item_id
    ).first()

    if not stock:
        raise HTTPException(
            status_code=404,
            detail="Stock record not found. Restock first."
        )

    previous_quantity = stock.quantity
    new_quantity = request.actual_quantity
    quantity_change = new_quantity - previous_quantity

    stock.quantity = new_quantity

    transaction = StockTransaction(
        stock_id=stock.id,
        transaction_type="reconciliation",
        quantity_change=quantity_change,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        notes=request.notes
    )

    db.add(transaction)
    db.commit()
    db.refresh(stock)

    return stock


@router.get(
    "/{stock_id}/history",
    response_model=list[StockTransactionResponse]
)
def get_stock_history(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = get_patient(db, current_user)

    stock = db.query(MedicationStock).filter(
        MedicationStock.id == stock_id,
        MedicationStock.patient_id == patient.id
    ).first()

    if not stock:
        raise HTTPException(
            status_code=404,
            detail="Stock record not found"
        )

    return db.query(StockTransaction).filter(
        StockTransaction.stock_id == stock_id
    ).order_by(
        StockTransaction.created_at.desc()
    ).all()
