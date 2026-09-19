from __future__ import annotations

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class ExtractorSettings(BaseSettings):
    """Environment-driven configuration for crawl/parse credentials and LLM."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    db_user: str = "postgres"
    db_password: str = "postgres"
    db_host: str = "localhost"
    db_port: int = 5432

    llm_base_url: str = "http://localhost:1234/v1"
    llm_api_key: str | None = None
    llm_model_small: str = "llama-3.1-8b-instant"
    llm_model_big: str = "qwen/qwen3.8-27b"
    llm_max_tokens: int = 200
    llm_temperature: float = 0.7
    llm_timeout: float = 60.0
    llm_max_retries: int = 3

    def db_name(self, source: str) -> str:
        return os.getenv(f"DB_{source.upper()}_NAME", source)

    def psycopg_connect_kwargs(self, dbname: str) -> dict[str, str | int]:
        return {
            "dbname": dbname,
            "user": self.db_user,
            "password": self.db_password,
            "host": self.db_host,
            "port": self.db_port,
        }