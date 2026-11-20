
from pathlib import Path
import sys

# Make the existing app package accessible when this file is run directly.
APP_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(APP_ROOT))

from app.services.prescription_checking.reconciler import (
    reconcile_with_confirmed_plan
)


def run_test(description, scan, plan, confirmed, expected):
    result = reconcile_with_confirmed_plan(
        scan_result=scan,
        confirmed_plan=plan,
        plan_is_confirmed=confirmed
    )

    actual = result["relation_status"]
    passed = actual == expected

    print(f"{'PASS' if passed else 'FAIL'}: {description}")
    if not passed:
        print(f"  Expected: {expected}")
        print(f"  Received: {actual}")

    return passed


def main():
    print("DAWAZ PRESCRIPTION COMPARISON TEST")
    print("----------------------------------------")

    medicine = {
        "name": "Oxcarbazepine",
        "strength": "300 mg",
        "form": "tablet"
    }

    confirmed_plan = [medicine]

    matching_scan = {
        "identity_status": "CONFIRMED_FOR_DEMO",
        "matched_medicine": medicine
    }

    tests = [
        (
            "Exact medicine, strength and form match",
            matching_scan,
            confirmed_plan,
            True,
            "MATCHES_ACTIVE_ITEM"
        ),
        (
            "Strength mismatch",
            {
                "identity_status": "CONFIRMED_FOR_DEMO",
                "matched_medicine": {
                    "name": "Oxcarbazepine",
                    "strength": "600 mg",
                    "form": "tablet"
                }
            },
            confirmed_plan,
            True,
            "STRENGTH_OR_FORM_CONFLICT"
        ),
        (
            "Form mismatch",
            {
                "identity_status": "CONFIRMED_FOR_DEMO",
                "matched_medicine": {
                    "name": "Oxcarbazepine",
                    "strength": "300 mg",
                    "form": "capsule"
                }
            },
            confirmed_plan,
            True,
            "STRENGTH_OR_FORM_CONFLICT"
        ),
        (
            "Medicine not found in confirmed plan",
            {
                "identity_status": "CONFIRMED_FOR_DEMO",
                "matched_medicine": {
                    "name": "Paracetamol",
                    "strength": "500 mg",
                    "form": "tablet"
                }
            },
            confirmed_plan,
            True,
            "NOT_FOUND_IN_ACTIVE_PLAN"
        ),
        (
            "Medicine identity not confirmed",
            {
                "identity_status": "UNCONFIRMED",
                "matched_medicine": medicine
            },
            confirmed_plan,
            True,
            "UNKNOWN_IDENTITY"
        ),
        (
            "Prescription plan not confirmed",
            matching_scan,
            confirmed_plan,
            False,
            "PLAN_NOT_CONFIRMED"
        ),
        (
            "Strength missing",
            {
                "identity_status": "CONFIRMED_FOR_DEMO",
                "matched_medicine": {
                    "name": "Oxcarbazepine",
                    "strength": None,
                    "form": "tablet"
                }
            },
            confirmed_plan,
            True,
            "PRESCRIPTION_AMBIGUOUS"
        ),
    ]

    results = [
        run_test(description, scan, plan, confirmed, expected)
        for description, scan, plan, confirmed, expected in tests
    ]

    print("----------------------------------------")
    print(f"Passed: {sum(results)}/{len(results)}")

    if all(results):
        print("ALL COMPARISON TESTS PASSED")
    else:
        print("SOME TESTS FAILED - CHECK THE OUTPUT")


if __name__ == "__main__":
    main()
