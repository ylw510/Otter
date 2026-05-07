from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import ai_service

router = APIRouter()


class ExplainBody(BaseModel):
    text: str
    sentence: str | None = ""


@router.post("")
async def post_explain(body: ExplainBody):
    try:
        return await ai_service.ai_explain(body.text, body.sentence or "")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
