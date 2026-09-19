from __future__ import annotations

BASE_URL: str = "https://www.assemblee-nationale.fr/dyn/17/scrutins"
DEPUTY_BASE_URL: str = "https://www.assemblee-nationale.fr/dyn/deputes"
REQUEST_TIMEOUT: float = 15.0
MAX_RETRY_ATTEMPTS: int = 3
USER_AGENT: str = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    " AppleWebKit/537.36 (KHTML, like Gecko)"
    " Chrome/121.0.0.0 Safari/537.36"
)

GROUP_NAME_OVERRIDES: dict[str, str] = {
    "UDR": "Union des Droites pour la République",
    "Union des droites pour la République": "Union des Droites pour la République",
}


def normalize_group_name(name: str) -> str:
    return GROUP_NAME_OVERRIDES.get(name, name)