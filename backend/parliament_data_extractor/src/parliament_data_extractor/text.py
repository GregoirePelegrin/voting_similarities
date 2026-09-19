from __future__ import annotations

import difflib
import logging
import re
import unicodedata

log = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", text.lower().strip())
        .replace("&", "et")
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    return re.sub(r"\s+", " ", normalized).strip()


def build_normalized_map(categories: tuple[str, ...]) -> dict[str, str]:
    return {normalize_text(category): category for category in categories}


def match_category(llm_category: str, normalized_map: dict[str, str]) -> str:
    normalized = normalize_text(llm_category)
    if normalized in normalized_map:
        return normalized_map[normalized]
    candidates = difflib.get_close_matches(
        normalized, normalized_map.keys(), n=1, cutoff=0.8
    )
    if candidates:
        matched = normalized_map[candidates[0]]
        log.info("Fuzzy-matched '%s' -> '%s'", llm_category, matched)
        return matched
    log.warning("No matching category for '%s', keeping as-is", llm_category)
    return llm_category