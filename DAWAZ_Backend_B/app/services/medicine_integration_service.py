
import os
import httpx

MEMBER2_API_URL = os.getenv(
    "MEMBER2_API_URL",
    "http://127.0.0.1:8001"
)

TIMEOUT = 60.0


async def scan_medicine(image_bytes: bytes, filename: str, content_type: str):
    if not image_bytes:
        raise ValueError("Image file is empty")

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if content_type not in allowed_types:
        raise ValueError("Only JPG, PNG and WEBP images are supported")

    if len(image_bytes) > 10 * 1024 * 1024:
        raise ValueError("Image must not exceed 10 MB")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{MEMBER2_API_URL}/member2/scans",
            files={
                "image": (
                    filename,
                    image_bytes,
                    content_type
                )
            }
        )

        response.raise_for_status()
        result = response.json()

    if not isinstance(result, dict) or not isinstance(result.get("data"), dict):
        raise ValueError("Invalid scanning response from Backend A")

    return result


async def reconcile_medicine(
    scan_result: dict,
    confirmed_plan: list,
    plan_is_confirmed: bool
):
    if not isinstance(scan_result, dict):
        raise ValueError("Invalid scan result")

    if not isinstance(confirmed_plan, list):
        raise ValueError("Invalid confirmed prescription plan")

    payload = {
        "scan_result": scan_result,
        "confirmed_plan": confirmed_plan,
        "plan_is_confirmed": plan_is_confirmed
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{MEMBER2_API_URL}/member2/reconcile",
            json=payload
        )

        response.raise_for_status()
        result = response.json()

    if not isinstance(result, dict) or not isinstance(result.get("data"), dict):
        raise ValueError("Invalid reconciliation response from Backend A")

    return result
