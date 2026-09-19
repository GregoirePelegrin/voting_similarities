from __future__ import annotations

import logging
import time

import requests

from parliament_data_extractor.categories import CATEGORIES
from parliament_data_extractor.config import ExtractorSettings

log = logging.getLogger(__name__)

_RETRYABLE_STATUS: frozenset[int] = frozenset({429, 500, 502, 503, 504})


class LLMService:
    """Chat-completions client for vote-title categorization."""

    def __init__(self, settings: ExtractorSettings):
        self.settings = settings
        base_url = settings.llm_base_url.rstrip("/")
        self.chat_url = f"{base_url}/chat/completions"
        self.headers: dict[str, str] = {"Content-Type": "application/json"}
        if settings.llm_api_key:
            self.headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    def categorize(self, vote_title: str) -> str:
        payload = {
            "model": self.settings.llm_model_big,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Answer only with the following syntax:"
                        " `category1, category2, ...`."
                        " The categories you are allowed to choose from"
                        " are limited. They are the"
                        f" following: [{', '.join(CATEGORIES)}]."
                        " Respond in French, using only categories"
                        " from that list."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "In what categories could we put a text titled:\n"
                        f"`{vote_title}`?"
                    ),
                },
            ],
            "temperature": self.settings.llm_temperature,
            "max_tokens": self.settings.llm_max_tokens,
            "stream": False,
        }
        response = self._post(payload)
        return response.json()["choices"][0]["message"]["content"]

    def _post(self, payload: dict) -> requests.Response:
        for attempt in range(self.settings.llm_max_retries + 1):
            try:
                response = requests.post(
                    self.chat_url,
                    headers=self.headers,
                    json=payload,
                    timeout=self.settings.llm_timeout,
                )
            except requests.RequestException:
                if attempt >= self.settings.llm_max_retries:
                    raise
                self._backoff(attempt, retry_after=None)
                continue
            if (
                response.status_code in _RETRYABLE_STATUS
                and attempt < self.settings.llm_max_retries
            ):
                self._backoff(
                    attempt, retry_after=response.headers.get("Retry-After")
                )
                continue
            response.raise_for_status()
            return response
        raise RuntimeError("LLM request failed")

    @staticmethod
    def _backoff(attempt: int, retry_after: str | None) -> None:
        if retry_after is not None:
            try:
                delay = float(retry_after)
            except ValueError:
                delay = min(2**attempt, 60)
        else:
            delay = min(2**attempt, 60)
        time.sleep(delay)