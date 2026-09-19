import logging
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.config import router as config_router
from app.api.health import router as health_router
from app.api.meta import router as meta_router
from app.api.metrics import router as metrics_router
from app.api.routes import router as api_router
from app.config import settings
from app.database import async_session, engine
from app.models import Base, RequestMetric

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

app.include_router(config_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(meta_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(api_router, prefix="/api")

METRICS_EXCLUDED_PATHS = {"/api/metrics", "/api/health"}


@app.middleware("http")
async def record_request_metrics(request: Request, call_next):
    exception = None
    try:
        response = await call_next(request)
    except Exception:
        exception = sys.exc_info()[1]
        response = None
    try:
        path = request.url.path
        if path.startswith("/api/") and path not in METRICS_EXCLUDED_PATHS:
            config_set_id = None
            raw_cs = request.query_params.get("config_set_id")
            if raw_cs and raw_cs.isdigit():
                config_set_id = int(raw_cs)
            async with async_session() as session:
                session.add(
                    RequestMetric(
                        method=request.method,
                        path=path,
                        status=response.status_code if response is not None else 500,
                        config_set_id=config_set_id,
                    )
                )
                await session.commit()
    except Exception:
        logger.warning(
            "Failed to record request metric for %s %s",
            request.method,
            request.url.path,
            exc_info=True,
        )
    if response is not None:
        return response
    raise exception


@app.on_event("startup")
async def on_startup():
    _log_config()
    await _create_tables()
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
        settings.SIMILARITY_SHRINKAGE_M,
    )


async def _create_tables():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    except Exception:
        logger.warning("Table creation failed (race between workers), continuing")
        # In multi-worker mode, another worker may have already created the tables


async def _check_database():
    async with async_session() as session:
        await session.execute(text("SELECT 1"))
    logger.info("Database connection OK")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
