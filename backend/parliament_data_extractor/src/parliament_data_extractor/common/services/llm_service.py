from __future__ import annotations

import os
import time

import requests
from dotenv import load_dotenv

from parliament_data_extractor.common.utils.metaclass import SingletonMetaclass


class LLMService(metaclass=SingletonMetaclass):
    def __init__(self):
        load_dotenv()
        base_url: str = os.getenv(
            "LLM_BASE_URL", "http://localhost:1234/v1"
        ).rstrip("/")
        self.url: str = f"{base_url}/chat/completions"
        self.timeout: float = float(os.getenv("LLM_TIMEOUT", "60"))
        self.max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "3"))
        self.headers: dict = {"Content-Type": "application/json"}
        api_key: str | None = os.getenv("LLM_API_KEY")
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        self.models: dict = {
            "small": os.getenv("LLM_MODEL_SMALL", "llama-3.1-8b-instant"),
            "big": os.getenv("LLM_MODEL_BIG", "qwen/qwen3.8-27b"),
        }
        self.temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", "200"))

    @staticmethod
    def get() -> LLMService:
        return LLMService()

    def get_categorization(
        self, vote_title: str, categories: list[str]
    ) -> str:
        vote_title = vote_title.replace("'", "")
        payload: dict = {
            "model": self.models["big"],
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Answer only with the following syntax:"
                        " `category1, category2, ...`."
                        " The categories you are allowed to choose from"
                        " are limited. They are the"
                        f" following: [{', '.join(categories)}]."
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
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": False,
        }
        response = self._post(payload)
        return response.json()["choices"][0]["message"]["content"]

    def _post(self, payload: dict) -> requests.Response:
        for attempt in range(self.max_retries + 1):
            try:
                response = requests.post(
                    self.url,
                    headers=self.headers,
                    json=payload,
                    timeout=self.timeout,
                )
            except requests.RequestException:
                if attempt >= self.max_retries:
                    raise
                self._sleep(attempt=attempt, retry_after=None)
                continue
            if response.status_code in (429,) or response.status_code >= 500:
                if attempt >= self.max_retries:
                    response.raise_for_status()
                self._sleep(
                    attempt=attempt,
                    retry_after=response.headers.get("Retry-After"),
                )
                continue
            response.raise_for_status()
            return response
        raise requests.RequestException("LLM request failed")

    @staticmethod
    def _sleep(attempt: int, retry_after: str | None):
        if retry_after is not None:
            try:
                delay: float = float(retry_after)
            except ValueError:
                delay = min(2**attempt, 60)
        else:
            delay = min(2**attempt, 60)
        time.sleep(delay)