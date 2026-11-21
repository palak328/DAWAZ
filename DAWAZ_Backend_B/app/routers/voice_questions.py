
import logging
import httpx

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.voice_question import (
    VoiceQuestionRequest,
    VoiceQuestionResponse
)
from app.services.voice_question_service import forward_question

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/questions",
    tags=["Voice Questions"]
)


@router.post(
    "",
    response_model=VoiceQuestionResponse
)
async def ask_medicine_question(
    question_data: VoiceQuestionRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return await forward_question(
            question=question_data.question,
            language=question_data.language
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Medicine question service timed out"
        )

    except httpx.HTTPStatusError:
        logger.exception("Backend A returned an HTTP error")
        raise HTTPException(
            status_code=502,
            detail="Medicine question service returned an error"
        )

    except httpx.RequestError:
        logger.exception("Backend A is unavailable")
        raise HTTPException(
            status_code=503,
            detail="Medicine question service is unavailable"
        )

