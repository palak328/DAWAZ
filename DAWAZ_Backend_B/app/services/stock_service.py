from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.medication_stock import (
    MedicationStock,
    StockTransaction
)


def deduct_stock_for_dose(
    db: Session,
    patient_id: int,
    prescription_item_id: int,
    occurrence_id: int,
    quantity_to_deduct: Decimal,
    dose_unit: str
):
    if quantity_to_deduct <= Decimal("0"):
        raise ValueError("Deduction quantity must be positive")

    latest_transaction = db.query(StockTransaction).filter(
        StockTransaction.occurrence_id == occurrence_id
    ).order_by(
        StockTransaction.id.desc()
    ).first()

    if latest_transaction and latest_transaction.transaction_type == "dose_deduction":
        raise ValueError("Stock already deducted for this dose")

    stock = db.query(MedicationStock).filter(
        MedicationStock.patient_id == patient_id,
        MedicationStock.prescription_item_id == prescription_item_id
    ).first()

    if not stock:
        raise ValueError("Medicine stock record not found")

    if stock.quantity < quantity_to_deduct:
        raise ValueError("Insufficient medicine stock")
    if stock.unit.strip().lower() != dose_unit.strip().lower():
        raise ValueError("Prescription dose unit does not match stock unit")
    previous_quantity = stock.quantity
    stock.quantity -= quantity_to_deduct

    transaction = StockTransaction(
        stock_id=stock.id,
        occurrence_id=occurrence_id,
        transaction_type="dose_deduction",
        quantity_change=-quantity_to_deduct,
        previous_quantity=previous_quantity,
        new_quantity=stock.quantity,
        notes="Stock deducted for a reported taken dose"
    )

    db.add(transaction)
    db.flush()

    return stock
def reverse_stock_deduction(
    db: Session,
    occurrence_id: int
):
    latest_transaction = db.query(StockTransaction).filter(
        StockTransaction.occurrence_id == occurrence_id
    ).order_by(
        StockTransaction.id.desc()
    ).first()

    if not latest_transaction or latest_transaction.transaction_type != "dose_deduction":
        raise ValueError("No active stock deduction to reverse")

    deduction = latest_transaction

    stock = db.query(MedicationStock).filter(
        MedicationStock.id == deduction.stock_id
    ).first()

    if not stock:
        raise ValueError("Medicine stock record not found")

    previous_quantity = stock.quantity
    stock.quantity += abs(deduction.quantity_change)
    deduction = latest_transaction

    reversal = StockTransaction(
        stock_id=stock.id,
        occurrence_id=occurrence_id,
        transaction_type="dose_reversal",
        quantity_change=abs(deduction.quantity_change),
        previous_quantity=previous_quantity,
        new_quantity=stock.quantity,
        notes="Stock restored after dose report correction"
    )

    db.add(reversal)
    db.flush()

    return stock