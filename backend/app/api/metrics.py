from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import RequestMetric
from app.schemas import MetricsOut

router = APIRouter()


def _check_auth(authorization: str | None) -> None:
    if not settings.METRICS_API_KEY:
        return
    if not authorization or authorization != f"Bearer {settings.METRICS_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid or missing metrics key")


@router.get("/metrics", response_model=MetricsOut)
async def get_metrics(
    days: int = Query(7, ge=1, le=365),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    _check_auth(authorization)

    total = (
        await db.execute(select(func.count()).select_from(RequestMetric))
    ).scalar() or 0

    rows = (
        await db.execute(
            select(
                RequestMetric.method,
                RequestMetric.path,
                RequestMetric.created_at,
            ).order_by(RequestMetric.created_at)
        )
    ).all()

    start_date = (datetime.now(UTC) - timedelta(days=days)).date()
    today_key = datetime.now(UTC).date().isoformat()

    per_day: dict[str, int] = {}
    per_endpoint: dict[str, int] = {}
    count = 0
    for method, path, created_at in rows:
        day = created_at.date()
        if day < start_date:
            continue
        day_key = day.isoformat()
        per_day[day_key] = per_day.get(day_key, 0) + 1
        endpoint_key = f"{method} {path}"
        per_endpoint[endpoint_key] = per_endpoint.get(endpoint_key, 0) + 1
        count += 1

    top_endpoints = dict(
        sorted(per_endpoint.items(), key=lambda kv: kv[1], reverse=True)
    )
    avg_per_day = round(count / days, 2)

    return MetricsOut(
        total=total,
        count=count,
        avg_per_day=avg_per_day,
        today=per_day.get(today_key, 0),
        period_days=days,
        per_day=per_day,
        per_endpoint=top_endpoints,
    )