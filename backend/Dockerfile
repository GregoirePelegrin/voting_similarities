FROM python:3.12-slim AS builder

ARG PIP_TRUSTED_HOST=
WORKDIR /install
COPY requirements.txt backend/requirements.txt
RUN if [ -n "$PIP_TRUSTED_HOST" ]; then \
      pip install --no-cache-dir $(for h in $PIP_TRUSTED_HOST; do echo --trusted-host $h; done) -r backend/requirements.txt; \
    else \
      pip install --no-cache-dir -r backend/requirements.txt; \
    fi

FROM python:3.12-slim
WORKDIR /app

COPY --from=builder /usr/local /usr/local

COPY backend/app/ app/
COPY backend/migrations/ migrations/
COPY backend/scripts/ scripts/
COPY backend/alembic.ini .
COPY pyproject.toml .

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${API_PORT:-8000} --workers ${UVICORN_WORKERS:-4}
