from pathlib import Path

from pydantic_settings import BaseSettings

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB = f"sqlite+aiosqlite:///{_PROJECT_ROOT / 'data' / 'dev.db'}"


class Settings(BaseSettings):
    DATABASE_URL: str = _DEFAULT_DB
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    RELOAD: bool = True
    CORS_ORIGINS: list[str] = ["*"]
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    UVICORN_WORKERS: int = 4
    LOG_LEVEL: str = "INFO"
    SIMILARITY_W_YES: float = 1.0
    SIMILARITY_W_NO: float = 0.2
    SIMILARITY_W_MISMATCH: float = 0.5
    SIMILARITY_BAYESIAN_M: int = 10

    model_config = {
        "env_file": str(_PROJECT_ROOT / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
