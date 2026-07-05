from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import ConfigSet
from app.schemas import ConfigResponse, ConfigSetOut

router = APIRouter()


@router.get("/config", response_model=ConfigResponse)
async def get_config(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConfigSet).order_by(ConfigSet.id))
    sets = result.scalars().all()
    active_set_id = sets[0].id if sets else None
    return ConfigResponse(sets=sets, active_set_id=active_set_id)


@router.get("/config/sets", response_model=list[ConfigSetOut])
async def list_config_sets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConfigSet).order_by(ConfigSet.id))
    return result.scalars().all()
