import time
import uuid

from sqlalchemy import Column, Float, Integer, String, Text

from app.db.database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)  # reserved for future accounts / sync
    word = Column(String, nullable=False, index=True)
    sentence = Column(Text)
    context_sentence = Column(Text)  # explicit context; may mirror sentence
    explanation = Column(Text)
    translation = Column(Text)
    source_url = Column(String)
    source_title = Column(String)
    source_site = Column(String)
    created_at = Column(Integer, default=lambda: int(time.time() * 1000))
    review_count = Column(Integer, default=0)
    next_review_at = Column(Integer)
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=1)
