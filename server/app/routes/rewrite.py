from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import ai_service

router = APIRouter()


class RewriteRequest(BaseModel):
    text: str
    styles: Optional[list[str]] = None


@router.post("")
async def rewrite(req: RewriteRequest):
    styles = req.styles or [
        "professional",
        "native",
        "casual",
        "twitter_tech",
    ]
    try:
        results = await ai_service.ai_rewrite(req.text, styles)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return {"results": results}
