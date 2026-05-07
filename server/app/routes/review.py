import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.word import Word as WordModel
from app.services.review_service import calculate_next_review

router = APIRouter()


class ReviewAnswerBody(BaseModel):
    word_id: str
    quality: int = Field(ge=0, le=5)


def to_review_item(row: WordModel) -> dict[str, Any]:
    return {
        "word_id": row.id,
        "word": row.word,
        "sentence": row.sentence,
        "explanation": row.explanation,
    }


@router.get("/next")
async def get_next_due(session: AsyncSession = Depends(get_session)):
    now_ms = int(time.time() * 1000)
    stmt = (
        select(WordModel)
        .where(
            or_(
                WordModel.next_review_at.is_(None),
                WordModel.next_review_at <= now_ms,
            )
        )
        .order_by(func.coalesce(WordModel.next_review_at, 0).asc())
        .limit(1)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        return {"item": None}
    return {"item": to_review_item(row)}


@router.post("/answer")
async def submit_answer(
    body: ReviewAnswerBody,
    session: AsyncSession = Depends(get_session),
):
    row = await session.get(WordModel, body.word_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found")

    now_ms = int(time.time() * 1000)
    new_days, new_ease, new_rc = calculate_next_review(
        body.quality,
        float(row.ease_factor),
        int(row.interval),
        int(row.review_count),
    )
    row.review_count = new_rc
    row.ease_factor = new_ease
    row.interval = new_days
    row.next_review_at = now_ms + new_days * 86400000

    await session.commit()
    await session.refresh(row)
    return row_to_public(row)


def row_to_public(row: WordModel) -> dict[str, Any]:
    return {
        "id": row.id,
        "word": row.word,
        "sentence": row.sentence,
        "explanation": row.explanation,
        "translation": row.translation,
        "source_url": row.source_url,
        "source_title": row.source_title,
        "source_site": row.source_site,
        "created_at": row.created_at,
        "review_count": row.review_count,
        "next_review_at": row.next_review_at,
        "ease_factor": row.ease_factor,
        "interval": row.interval,
    }
