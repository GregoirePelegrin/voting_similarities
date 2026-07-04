from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/config")
async def get_config():
    return {
        "w_yes": settings.SIMILARITY_W_YES,
        "w_no": settings.SIMILARITY_W_NO,
        "w_mismatch": settings.SIMILARITY_W_MISMATCH,
        "m": settings.SIMILARITY_SHRINKAGE_M,
    }
