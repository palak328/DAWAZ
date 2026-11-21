
from pydantic import BaseModel, Field
from typing import Literal


class VoiceQuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    language: Literal["en-IN", "hi-IN"] = "en-IN"


class VoiceQuestionData(BaseModel):
    answer: str
    source: str | None = None
    safe_to_personalize: bool
    status: str


class VoiceQuestionResponse(BaseModel):
    request_id: str
    data: VoiceQuestionData
    warnings: list[str]
    error: str | None = None
