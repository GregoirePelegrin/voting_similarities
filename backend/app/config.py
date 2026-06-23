from pathlib import Path

from pydantic_settings import BaseSettings

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB = f"sqlite+aiosqlite:///{_PROJECT_ROOT / 'data' / 'dev.db'}"


class Settings(BaseSettings):
    DATABASE_URL: str = _DEFAULT_DB

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
