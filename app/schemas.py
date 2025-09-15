from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict

class VideoURLRequest(BaseModel):
    url: HttpUrl

class QuestionRequest(BaseModel):
    url: HttpUrl
    question: str = Field(..., min_length=3, max_length=2000)

class MCQRequest(BaseModel):
    url: HttpUrl
    num_mcqs: int = Field(5, ge=1, le=50)

class QAResponse(BaseModel):
    answer: str
    snippets: List[Dict[str, str]]

class LoadResponse(BaseModel):
    message: str

class MCQTextResponse(BaseModel):
    mcqs: str