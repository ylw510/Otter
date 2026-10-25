from datetime import datetime, timezone

from fsrs import Card, Rating
from fastapi.testclient import TestClient

from app.services.fsrs_scheduler import get_otter_scheduler
from app.services.fsrs_word_bridge import quality_to_rating
from main import app


def test_quality_maps_to_fsrs_rating():
    assert quality_to_rating(1) == Rating.Again
    assert quality_to_rating(4) == Rating.Good


def test_review_answer_updates_next_review_at():
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/words",
            json={"word": "fsrs-test", "source_site": "test"},
        )
        assert created.status_code == 200
        body = created.json()
        word_id = body["id"]
        assert body.get("scheduler") == "fsrs"
        assert body.get("fsrs_card") is not None

        answered = client.post(
            "/api/v1/review/answer",
            json={"word_id": word_id, "quality": 4},
        )
        assert answered.status_code == 200
        out = answered.json()
        assert out["next_review_at"] > int(datetime.now(timezone.utc).timestamp() * 1000) - 5000
        assert out.get("fsrs_card") is not None


def test_scheduler_review_card_advances_learning_step():
    scheduler = get_otter_scheduler()
    card = Card()
    updated, _ = scheduler.review_card(card, Rating.Good)
    assert updated.step == 1
