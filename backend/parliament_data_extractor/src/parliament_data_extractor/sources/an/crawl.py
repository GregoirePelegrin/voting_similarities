from __future__ import annotations

import logging
import re
from datetime import UTC, datetime

import requests
from requests import Response

from parliament_data_extractor.common.models.raw_page import RawPage
from parliament_data_extractor.common.services.database import Database
from parliament_data_extractor.sources.an import config as cfg

log = logging.getLogger(__name__)

REQUEST_TIMEOUT: int = 15


def _new_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            " AppleWebKit/537.36 (KHTML, like Gecko)"
            " Chrome/121.0.0.0 Safari/537.36"
        ),
    })
    return session


_SESSION: requests.Session = _new_session()


def get_max_scrutin_id() -> int | None:
    url = f"{cfg.BASE_URL}?page=1"
    try:
        resp: Response = _SESSION.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        ids = {int(m) for m in re.findall(r"scrutins/(\d+)", resp.text)}
        return max(ids) if ids else None
    except requests.RequestException as e:
        log.warning("Failed to fetch scrutins page: %s", e)
        return None


def rebuild_session():
    global _SESSION
    _SESSION.close()
    _SESSION = _new_session()


def fetch_and_store(scrutin_id: int, force_refetch: bool = False, source: str = "an") -> bool:
    svc = Database.get(source=source)
    url = f"{cfg.BASE_URL}/{scrutin_id}"

    if not force_refetch:
        cached = svc.get_raw_page(scrutin_id=scrutin_id)
        if cached:
            return True

    for attempt in (1, 2):
        try:
            resp: Response = _SESSION.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            break
        except requests.RequestException as e:
            if attempt == 1:
                log.warning(
                    "Request failed for scrutins %s: %s — retrying with fresh connection",
                    scrutin_id,
                    e,
                )
                rebuild_session()
            else:
                log.warning("Request failed again for scrutins %s: %s", scrutin_id, e)
                return False

    raw_page = RawPage(
        scrutin_id=scrutin_id,
        url=url,
        html=resp.text,
        fetched_at=datetime.now(UTC),
    )
    svc.store_raw_page(raw_page=raw_page)
    svc.delete_failed_vote(vote_id=scrutin_id)
    return True


def main(source: str = "an", full: bool = False, force_refetch: bool = False):
    max_id: int | None = get_max_scrutin_id()
    if not max_id:
        log.error("Could not determine max scrutin ID, aborting")
        return

    if full:
        vote_ids = list(range(1, max_id + 1))
    else:
        svc = Database.get(source=source)
        last_id: int = svc.get_last_scrutin_id() or 0
        start = last_id + 1
        if start > max_id:
            log.info("No new scrutins to fetch (last=%s, max=%s)", last_id, max_id)
            return
        vote_ids = list(range(start, max_id + 1))

    ids: list[int] = []
    total = len(vote_ids)
    for i, vid in enumerate(vote_ids, 1):
        if fetch_and_store(scrutin_id=vid, force_refetch=force_refetch, source=source):
            ids.append(vid)
        if not (i % 100):
            log.info("[%d/%d] Scrutins %s... (%d found)", i, total, vid, len(ids))

    label = "Full" if full else "Delta"
    if ids:
        log.info(
            "%s crawl complete: fetched %d scrutins (%s..%s)",
            label, len(ids), ids[0], ids[-1],
        )
    else:
        log.info("No new scrutins to fetch")
