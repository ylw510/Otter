import time
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.word import Word as WordModel

router = APIRouter()


class WordCreate(BaseModel):
    word: str
    sentence: str | None = None
    context_sentence: str | None = None
    explanation: str | None = None
    translation: str | None = None
    source_url: str | None = None
    source_title: str | None = None
    source_site: str | None = None
    user_id: str | None = None


def row_to_dict(row: WordModel) -> dict[str, Any]:
    return {
        "id": row.id,
        "user_id": row.user_id,
        "word": row.word,
        "sentence": row.sentence,
        "context_sentence": row.context_sentence,
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


@router.post("")
async def create_word(
    body: WordCreate,
    session: AsyncSession = Depends(get_session),
):
    now_ms = int(time.time() * 1000)
    ctx = body.context_sentence or body.sentence
    row = WordModel(
        user_id=body.user_id,
        word=body.word,
        sentence=body.sentence,
        context_sentence=ctx,
        explanation=body.explanation,
        translation=body.translation,
        source_url=body.source_url,
        source_title=body.source_title,
        source_site=body.source_site,
        next_review_at=now_ms,
        review_count=0,
        interval=1,
        ease_factor=2.5,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row_to_dict(row)


@router.get("")
async def list_words(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(WordModel).order_by(WordModel.created_at.desc())
    )
    rows = result.scalars().all()
    return [row_to_dict(r) for r in rows]
