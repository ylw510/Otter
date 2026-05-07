import time
import uuid

from sqlalchemy import Boolean, Column, Integer, String

from app.db.database import Base


class UserPreference(Base):
    """
    Reserved for future multi-user / sync. Single logical row (id = 'default') for now.
    """

    __tablename__ = "user_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    backend_mode = Column(String)  # local | hosted
    preferred_tone = Column(String)
    api_provider = Column(String)
    sync_enabled = Column(Boolean, default=False)
    created_at = Column(Integer, default=lambda: int(time.time() * 1000))
    updated_at = Column(Integer, default=lambda: int(time.time() * 1000))
