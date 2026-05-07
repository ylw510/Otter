import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.routes import explain, review, rewrite, words

load_dotenv()

API_VERSION = (os.getenv("API_VERSION") or "1").strip()
APP_NAME = (os.getenv("APP_NAME") or "Otter").strip()
APP_SLUG = (os.getenv("APP_SLUG") or "otter").strip().lower()
APP_SERVICE = f"{APP_SLUG}-api"


def _parse_cors_origins() -> list[str]:
    default = (
        "http://localhost:8000,"
        "http://127.0.0.1:8000,"
        "http://localhost:5173"
    )
    raw = os.getenv("CORS_ORIGINS", default)
    return [x.strip() for x in raw.split(",") if x.strip()]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=f"{APP_NAME} API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_origin_regex=os.getenv(
        "CORS_ALLOW_ORIGIN_REGEX",
        r"chrome-extension://[\w-]+",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter()
api_v1.include_router(words.router, prefix="/words", tags=["words"])
api_v1.include_router(rewrite.router, prefix="/rewrite", tags=["rewrite"])
api_v1.include_router(explain.router, prefix="/explain", tags=["explain"])
api_v1.include_router(review.router, prefix="/review", tags=["review"])
app.include_router(api_v1, prefix="/api/v1")


@app.get("/health")
def health():
    return {
        "ok": True,
        "api_version": API_VERSION,
        "service": APP_SERVICE,
    }
