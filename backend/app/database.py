from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings

_engine_kwargs: dict = {"echo": settings.DB_ECHO}
if not settings.DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["pool_size"] = settings.DB_POOL_SIZE

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
