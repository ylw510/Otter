import os
from collections.abc import AsyncGenerator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./copilot.db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


def _sqlite_migrate_words_sync(connection) -> None:
    """Add columns introduced after first deploy (SQLite has no ALTER in ORM)."""
    insp = inspect(connection)
    if not insp.has_table("words"):
        return
    cols = {c["name"] for c in insp.get_columns("words")}
    statements: list[str] = []
    if "user_id" not in cols:
        statements.append("ALTER TABLE words ADD COLUMN user_id VARCHAR")
    if "context_sentence" not in cols:
        statements.append("ALTER TABLE words ADD COLUMN context_sentence TEXT")
    for sql in statements:
        connection.execute(text(sql))


async def init_db() -> None:
    import app.models.rewrite_history  # noqa: F401
    import app.models.user_preference  # noqa: F401
    import app.models.word  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in (DATABASE_URL or "").lower():
            await conn.run_sync(_sqlite_migrate_words_sync)
