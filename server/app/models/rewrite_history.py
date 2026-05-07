import time
import uuid

from sqlalchemy import Column, Integer, String, Text

from app.db.database import Base


class RewriteHistory(Base):
    """Stores rewrite outcomes for potential sync / analytics on self-hosted instances."""

    __tablename__ = "rewrite_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_text = Column(Text, nullable=False)
    rewritten_text = Column(Text, nullable=False)
    style = Column(String, nullable=False, index=True)
    site = Column(String)
    created_at = Column(Integer, default=lambda: int(time.time() * 1000))
