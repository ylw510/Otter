"""Map SQLAlchemy Word rows ↔ py-fsrs Card; apply reviews."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fsrs import Card, Rating, State

from app.services.fsrs_scheduler import get_otter_scheduler

if TYPE_CHECKING:
    from app.models.word import Word as WordModel

PHASE_QUEUE_PRIORITY = {
    "learning": 0,
    "relearning": 1,
    "review": 2,
}


def state_to_phase(state: State) -> str:
    if state == State.Relearning:
        return "relearning"
    if state == State.Review:
        return "review"
    return "learning"


def quality_to_rating(quality: int) -> Rating:
    if quality < 3:
        return Rating.Again
    if quality == 3:
        return Rating.Hard
    if quality == 4:
        return Rating.Good
    return Rating.Easy


def rating_to_quality(rating: Rating) -> int:
    if rating == Rating.Again:
        return 1
    if rating == Rating.Hard:
        return 3
    if rating == Rating.Good:
        return 4
    return 5


def ms_to_utc_datetime(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def datetime_to_ms(dt: datetime) -> int:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def init_fsrs_card_json(now_ms: int | None = None) -> str:
    now = ms_to_utc_datetime(now_ms or int(datetime.now(timezone.utc).timestamp() * 1000))
    card = Card(due=now)
    return card.to_json()


def ensure_card(row: WordModel, now_ms: int) -> Card:
    if row.fsrs_card_json:
        return Card.from_json(row.fsrs_card_json)

    now = ms_to_utc_datetime(now_ms)
    card = Card(due=now)
    if row.phase == "review" and (row.review_count or 0) > 0:
        card.state = State.Review
        card.due = ms_to_utc_datetime(row.next_review_at or now_ms)
        card.stability = float(max(0.4, row.interval or 1))
        card.difficulty = 5.0
    elif row.phase == "relearning":
        card.state = State.Relearning
        card.step = row.learning_step or 0
        card.due = ms_to_utc_datetime(row.next_review_at or now_ms)
    else:
        card.state = State.Learning
        card.step = row.learning_step or 0
        card.due = ms_to_utc_datetime(row.next_review_at or now_ms)
    return card


def apply_card_to_row(row: WordModel, card: Card) -> None:
    row.fsrs_card_json = card.to_json()
    row.scheduler = "fsrs"
    row.next_review_at = datetime_to_ms(card.due)
    row.phase = state_to_phase(card.state)
    row.learning_step = card.step
    row.last_review_at = (
        datetime_to_ms(card.last_review) if card.last_review else None
    )
    if card.stability is not None:
        row.interval = max(1, round(card.stability))
    row.review_count = (row.review_count or 0) + 1


def apply_review(row: WordModel, quality: int, now_ms: int) -> Card:
    scheduler = get_otter_scheduler()
    card = ensure_card(row, now_ms)
    review_at = ms_to_utc_datetime(now_ms)
    rating = quality_to_rating(quality)
    updated, _log = scheduler.review_card(
        card,
        rating,
        review_datetime=review_at,
    )
    apply_card_to_row(row, updated)
    return updated


def fsrs_card_snapshot(card: Card) -> dict:
    """JSON-friendly dict for API (extension-compatible overview)."""
    data = json.loads(card.to_json())
    return data
