from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ComputationMeta, Vote
from app.schemas import MetaOut

router = APIRouter()


@router.get("/meta", response_model=MetaOut)
async def get_meta(db: AsyncSession = Depends(get_db)):
    last_vote = (
        await db.execute(select(func.max(Vote.date)))
    ).scalar()
    last_computed = (
        await db.execute(select(func.max(ComputationMeta.computed_at)))
    ).scalar()
    return MetaOut(
        last_vote_date=last_vote.date().isoformat() if last_vote else None,
        last_computed_at=last_computed.isoformat() if last_computed else None,
    )