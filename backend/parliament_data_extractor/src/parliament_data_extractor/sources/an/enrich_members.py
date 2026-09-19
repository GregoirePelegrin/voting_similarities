from __future__ import annotations

import logging
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

from parliament_data_extractor.database import ParliamentDatabase
from parliament_data_extractor.sources.an import config as cfg

log = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class DeputyDetails:
    role: str = ""
    commission: str = ""
    circonscription: str = ""


class DeputyProfileScraper:
    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update({"User-Agent": cfg.USER_AGENT})

    def fetch(self, deputy_id: str) -> DeputyDetails:
        url = f"{cfg.DEPUTY_BASE_URL}/PA{deputy_id}"
        try:
            response = self._session.get(url, timeout=cfg.REQUEST_TIMEOUT)
            response.raise_for_status()
        except requests.RequestException as error:
            log.warning("Failed to fetch deputy %s: %s", deputy_id, error)
            return DeputyDetails()
        return self._parse(response.text)

    @staticmethod
    def _parse(html: str) -> DeputyDetails:
        soup = BeautifulSoup(html, "html.parser")

        circonscription = ""
        title = soup.find("title")
        if title is not None:
            parts = title.get_text(strip=True).split(" - ")
            if len(parts) >= 3:
                circonscription = parts[1].strip()

        commission = ""
        role = ""
        for link in soup.find_all("a", class_="link"):
            text = link.get_text(strip=True)
            if text.startswith("Commission") and len(text) > 15:
                commission = text
                sibling = link.find_next_sibling("span")
                if sibling is not None:
                    role = sibling.get_text(strip=True).strip("()")
                break

        return DeputyDetails(
            role=role,
            commission=commission,
            circonscription=circonscription,
        )


def main(*, source: str = "an") -> None:
    db = ParliamentDatabase.get(source)
    scraper = DeputyProfileScraper()
    members = [member for member in db.get_members() if member.deputy_id]
    total = len(members)
    updated = 0

    for position, member in enumerate(members, start=1):
        if member.role and member.commission and member.circonscription:
            continue
        log.info(
            "[%d/%d] Enriching %s %s (PA%s)",
            position,
            total,
            member.first_name,
            member.last_name,
            member.deputy_id,
        )
        details = scraper.fetch(member.deputy_id)
        if not details.circonscription and not details.commission:
            log.warning("No data found for deputy %s", member.deputy_id)
            continue
        db.update_member_details(
            member.id,
            role=details.role,
            commission=details.commission,
            circonscription=details.circonscription,
        )
        updated += 1

    log.info("Enriched %d / %d members with deputy_id", updated, total)