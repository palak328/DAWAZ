
import os

import httpx


MEMBER2_API_URL = os.getenv(
    "MEMBER2_API_URL",
    "http://127.0.0.1:8001"
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}

MAX_FILE_SIZE = 10 * 1024 * 1024


async def extract_prescription(
    filename: str,
    content_type: str,
    file_bytes: bytes
) -> dict:

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported prescription file type")

    if not file_bytes:
        raise ValueError("Uploaded file is empty")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("File size must not exceed 10 MB")

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{MEMBER2_API_URL}/member2/prescriptions/extract",
            files={
                "file": (
                    filename,
                    file_bytes,
                    content_type
                )
            }
        )

        response.raise_for_status()

        result = response.json()

        if not isinstance(result, dict) or "data" not in result:
            raise ValueError("Invalid extraction response from Member 2")

        if not isinstance(result["data"], dict):
            raise ValueError("Invalid extraction data from Member 2")

        return result
