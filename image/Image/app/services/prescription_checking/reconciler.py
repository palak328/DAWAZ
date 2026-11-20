def reconcile_with_confirmed_plan(scan_result: dict, confirmed_plan=None, plan_is_confirmed=False) -> dict:
    """Compare an identified product with a plan Member 3 has already confirmed."""
    identity = scan_result.get("identity_status")

    if identity not in ("CONFIRMED_FOR_DEMO",):
        return {
            "relation_status": "UNKNOWN_IDENTITY",
            "message": "The medicine identity is not confirmed. Please scan again or ask a pharmacist.",
        }

    if not plan_is_confirmed:
        return {
            "relation_status": "PLAN_NOT_CONFIRMED",
            "message": "Your prescription has not been confirmed yet. Please review it first.",
        }

    if not confirmed_plan:
        return {
            "relation_status": "NOT_FOUND_IN_ACTIVE_PLAN",
            "message": "This medicine was not found in the confirmed plan. Check with your pharmacist before using it.",
        }

    scanned = scan_result.get("matched_medicine") or {}
    for item in confirmed_plan:
        same_name = (scanned.get("name") or "").strip().lower() == (item.get("name") or "").strip().lower()
        if not same_name:
            continue

        scan_strength = (scanned.get("strength") or "").strip().lower()
        plan_strength = (item.get("strength") or "").strip().lower()
        scan_form = (scanned.get("form") or "").strip().lower()
        plan_form = (item.get("form") or "").strip().lower()

        if not scan_strength or not plan_strength or not scan_form or not plan_form:
            return {
                "relation_status": "PRESCRIPTION_AMBIGUOUS",
                "message": "The strength or form is missing. Ask your pharmacist to check it.",
            }

        if scan_strength != plan_strength or scan_form != plan_form:
            return {
                "relation_status": "STRENGTH_OR_FORM_CONFLICT",
                "message": "The medicine strength or form differs from your confirmed plan. Do not rely on this scan; ask a pharmacist.",
            }

        return {
            "relation_status": "MATCHES_ACTIVE_ITEM",
            "message": "This scanned product matches an item in your confirmed plan. This does not tell you whether a dose is due now.",
        }

    return {
        "relation_status": "NOT_FOUND_IN_ACTIVE_PLAN",
        "message": "This medicine was not found in your confirmed plan. Check with your pharmacist before using it.",
    }
