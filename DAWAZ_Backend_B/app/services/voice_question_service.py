
import os

import httpx

from app.schemas.voice_question import VoiceQuestionResponse


MEMBER2_API_URL = os.getenv(
    "MEMBER2_API_URL",
    "http://127.0.0.1:8001"
)

REQUEST_TIMEOUT = 15.0


async def forward_question(
    question: str,
    language: str
) -> VoiceQuestionResponse:

    payload = {
        "question": question,
        "language": language
    }

    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT
    ) as client:

        response = await client.post(
            f"{MEMBER2_API_URL}/member2/questions",
            json=payload
        )

        response.raise_for_status()

        return VoiceQuestionResponse.model_validate(
            response.json()
        )
