
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
    question = question_data.question.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question cannot be empty"
        )

    try:
        result = await forward_question(
            question=question,
            language=question_data.language
        )

        return result

    except httpx.TimeoutException:
        logger.warning("Member 2 question service timed out")

        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Medicine question service timed out"
        )

    except httpx.HTTPStatusError:
        logger.exception("Member 2 returned an HTTP error")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Medicine question service returned an error"
        )

    except httpx.RequestError:
        logger.exception("Could not connect to Member 2")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Medicine question service is unavailable"
        )

    except ValueError:
        logger.exception("Member 2 returned an invalid response")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from medicine question service"
        )
