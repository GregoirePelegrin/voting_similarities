from __future__ import annotations

import logging
import re
from datetime import UTC, datetime

import requests

from parliament_data_extractor.database import ParliamentDatabase
from parliament_data_extractor.models.raw_page import RawPage
from parliament_data_extractor.sources.an import config as cfg

log = logging.getLogger(__name__)

_SCRUTIN_URL_RE = re.compile(r"scrutins/(\d+)")


def _build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": cfg.USER_AGENT})
    return session


class ScrutinCrawler:
    """Downloads raw scrutiny pages from the Assemblée Nationale."""

    def __init__(self, db: ParliamentDatabase):
        self._db = db
        self._session = _build_session()

    def fetch_max_scrutin_id(self) -> int | None:
        url = f"{cfg.BASE_URL}?page=1"
        try:
            response = self._session.get(url, timeout=cfg.REQUEST_TIMEOUT)
            response.raise_for_status()
        except requests.RequestException as error:
            log.warning("Failed to fetch scrutins page: %s", error)
            return None
        ids = {int(match) for match in _SCRUTIN_URL_RE.findall(response.text)}
        return max(ids) if ids else None

    def fetch_and_store(
        self, scrutin_id: int, *, force_refetch: bool
    ) -> bool:
        if not force_refetch and self._db.get_raw_page(scrutin_id) is not None:
            return True
        url = f"{cfg.BASE_URL}/{scrutin_id}"
        try:
            response = self._fetch_with_retry(url)
        except requests.RequestException as error:
            log.warning("Request failed again for scrutins %s: %s", scrutin_id, error)
            return False
        self._db.store_raw_page(
            RawPage(
                scrutin_id=scrutin_id,
                url=url,
                html=response.text,
                fetched_at=datetime.now(UTC),
            )
        )
        self._db.delete_failed_vote(scrutin_id)
        return True

    def _fetch_with_retry(self, url: str) -> requests.Response:
        for attempt in range(cfg.MAX_RETRY_ATTEMPTS):
            try:
                response = self._session.get(url, timeout=cfg.REQUEST_TIMEOUT)
                response.raise_for_status()
                return response
            except requests.RequestException as error:
                if attempt == cfg.MAX_RETRY_ATTEMPTS - 1:
                    log.warning("Request failed for scrutins %s: %s", url, error)
                    raise
                log.warning(
                    "Request failed for scrutins %s: %s — retrying with fresh connection",
                    url,
                    error,
                )
                self._session.close()
                self._session = _build_session()
        raise RuntimeError("unreachable")

    def crawl(self, *, full: bool, force_refetch: bool) -> None:
        max_id = self.fetch_max_scrutin_id()
        if max_id is None:
            log.error("Could not determine max scrutin ID, aborting")
            return

        if full:
            scrutin_ids = list(range(1, max_id + 1))
        else:
            last_id = self._db.get_last_scrutin_id() or 0
            start = last_id + 1
            if start > max_id:
                log.info("No new scrutins to fetch (last=%s, max=%s)", last_id, max_id)
                return
            scrutin_ids = list(range(start, max_id + 1))

        fetched: list[int] = []
        total = len(scrutin_ids)
        for position, scrutin_id in enumerate(scrutin_ids, start=1):
            if self.fetch_and_store(
                scrutin_id, force_refetch=force_refetch
            ):
                fetched.append(scrutin_id)
            if position % 100 == 0:
                log.info(
                    "[%d/%d] Scrutins %s... (%d found)",
                    position,
                    total,
                    scrutin_id,
                    len(fetched),
                )

        label = "Full" if full else "Delta"
        if fetched:
            log.info(
                "%s crawl complete: fetched %d scrutins (%s..%s)",
                label,
                len(fetched),
                fetched[0],
                fetched[-1],
            )
        else:
            log.info("No new scrutins to fetch")


def main(
    *, source: str = "an", full: bool = False, force_refetch: bool = False
) -> None:
    db = ParliamentDatabase.get(source)
    ScrutinCrawler(db).crawl(full=full, force_refetch=force_refetch)