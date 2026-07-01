import asyncio
import logging
from pathlib import Path

from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.config import router as config_router
from app.api.health import router as health_router
from app.api.routes import router as api_router
from app.config import settings
from app.database import async_session, engine

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

app = FastAPI(title="Voting Similarities", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(config_router)
app.include_router(health_router)
app.include_router(api_router)


@app.on_event("startup")
async def on_startup():
    _log_config()
    await _run_migrations()
    await _check_database()


@app.on_event("shutdown")
async def on_shutdown():
    await engine.dispose()
    logger.info("Database connections disposed")


def _log_config():
    logger.info("Starting Voting Similarities API")
    logger.info("DATABASE_URL: %s", settings.DATABASE_URL)
    logger.info("API_HOST: %s, API_PORT: %s", settings.API_HOST, settings.API_PORT)
    logger.info("RELOAD: %s", settings.RELOAD)
    logger.info("CORS_ORIGINS: %s", settings.CORS_ORIGINS)
    logger.info("LOG_LEVEL: %s", settings.LOG_LEVEL)
    logger.info("UVICORN_WORKERS: %s", settings.UVICORN_WORKERS)
    logger.info(
        "Similarity config: w_yes=%s, w_no=%s, w_mismatch=%s, m=%s",
        settings.SIMILARITY_W_YES,
        settings.SIMILARITY_W_NO,
        settings.SIMILARITY_W_MISMATCH,
        settings.SIMILARITY_BAYESIAN_M,
    )


def _run_migrations_sync():
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_cfg = AlembicConfig(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    command.upgrade(alembic_cfg, "head")


async def _run_migrations():
    await asyncio.to_thread(_run_migrations_sync)
    logger.info("Migrations up to date")


async def _check_database():
    async with async_session() as session:
        await session.execute(text("SELECT 1"))
    logger.info("Database connection OK")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
