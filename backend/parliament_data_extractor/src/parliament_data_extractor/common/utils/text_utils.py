from __future__ import annotations

import difflib
import logging
import re
import unicodedata

log = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("&", "et")
    text = (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def build_normalized_map(categories: list[str]) -> dict[str, str]:
    return {_normalize(cat): cat for cat in categories}


def match_category(llm_cat: str, normalized_map: dict[str, str]) -> str:
    norm = _normalize(llm_cat)
    if norm in normalized_map:
        return normalized_map[norm]
    matches = difflib.get_close_matches(norm, normalized_map.keys(), n=1, cutoff=0.8)
    if matches:
        log.info("Fuzzy-matched '%s' -> '%s'", llm_cat, normalized_map[matches[0]])
        return normalized_map[matches[0]]
    log.warning("No matching category for '%s', keeping as-is", llm_cat)
    return llm_cat
