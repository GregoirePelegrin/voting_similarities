import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.models import ConfigSet
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


def tsv_escape(value: str) -> str:
    return value.replace("\t", " ").replace("\n", " ")


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        config_sets = (await session.execute(
            select(ConfigSet).order_by(ConfigSet.id)
        )).scalars().all()
        for cs in config_sets:
            print(
                f"{tsv_escape(cs.name)}\t{cs.w_yes}\t{cs.w_no}\t"
                f"{cs.w_mismatch}\t{cs.m}"
            )
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())