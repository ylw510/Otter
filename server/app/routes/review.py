import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.word import Word as WordModel
from app.services.fsrs_word_bridge import PHASE_QUEUE_PRIORITY, apply_review

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
        "translation": row.translation,
        "phase": row.phase,
    }


def _phase_rank(row: WordModel) -> int:
    return PHASE_QUEUE_PRIORITY.get(row.phase or "review", 2)


@router.get("/next")
async def get_next_due(session: AsyncSession = Depends(get_session)):
    now_ms = int(time.time() * 1000)
    stmt = select(WordModel).where(
        or_(
            WordModel.next_review_at.is_(None),
            WordModel.next_review_at <= now_ms,
        )
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()
    if not rows:
        return {"item": None}
    rows.sort(
        key=lambda r: (
            _phase_rank(r),
            r.next_review_at if r.next_review_at is not None else 0,
        )
    )
    return {"item": to_review_item(rows[0])}


@router.post("/answer")
async def submit_answer(
    body: ReviewAnswerBody,
    session: AsyncSession = Depends(get_session),
):
    row = await session.get(WordModel, body.word_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found")

    now_ms = int(time.time() * 1000)
    apply_review(row, body.quality, now_ms)

    await session.commit()
    await session.refresh(row)
    return row_to_public(row)


def row_to_public(row: WordModel) -> dict[str, Any]:
    fsrs_card = None
    if row.fsrs_card_json:
        import json

        try:
            fsrs_card = json.loads(row.fsrs_card_json)
        except json.JSONDecodeError:
            fsrs_card = None

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
        "phase": row.phase,
        "learning_step": row.learning_step,
        "last_review_at": row.last_review_at,
        "scheduler": row.scheduler,
        "fsrs_card": fsrs_card,
    }
