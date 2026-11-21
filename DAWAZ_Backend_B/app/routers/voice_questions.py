
import os
import httpx

from app.schemas.voice_question import VoiceQuestionResponse

MEMBER2_API_URL = os.getenv(
    "MEMBER2_API_URL",
    "http://127.0.0.1:8001"
)

REQUEST_TIMEOUT = 15.0
SUPPORTED_LANGUAGES = {"en-IN", "hi-IN"}


async def forward_question(
    question: str,
    language: str
) -> VoiceQuestionResponse:

    question = question.strip()

    if not question:
        raise ValueError("Question cannot be empty")

    if len(question) > 1000:
        raise ValueError("Question must not exceed 1000 characters")

    if language not in SUPPORTED_LANGUAGES:
        raise ValueError("Unsupported language")

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

        result = response.json()

        if not isinstance(result, dict):
            raise ValueError("Invalid response from Backend A")

        return VoiceQuestionResponse.model_validate(result)
