from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import ai_service

router = APIRouter()


class TranslateBody(BaseModel):
    text: str
    sentence: str | None = ""
    source_lang: str | None = "en"
    target_lang: str | None = "zh"


@router.post("")
async def post_translate(body: TranslateBody):
    try:
        return await ai_service.ai_translate(
            body.text,
            body.sentence or "",
            source_lang=body.source_lang or "en",
            target_lang=body.target_lang or "zh",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
