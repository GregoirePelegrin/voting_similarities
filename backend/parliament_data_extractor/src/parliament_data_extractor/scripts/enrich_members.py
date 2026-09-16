from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

import requests
from bs4 import BeautifulSoup

from parliament_data_extractor.common.models.member import Member
from parliament_data_extractor.common.services.database import Database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True,
)
log = logging.getLogger(__name__)

HEADERS: dict[str, str] = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        " AppleWebKit/537.36 (KHTML, like Gecko)"
        " Chrome/121.0.0.0 Safari/537.36"
    ),
}

DEPUTY_BASE: str = "https://www.assemblee-nationale.fr/dyn/deputes"


def parse_deputy_page(deputy_id: str) -> dict[str, str]:
    url = f"{DEPUTY_BASE}/PA{deputy_id}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        log.warning("Failed to fetch deputy %s: %s", deputy_id, e)
        return {"circonscription": "", "commission": "", "role": ""}

    soup = BeautifulSoup(resp.text, "html.parser")
    result: dict[str, str] = {"circonscription": "", "commission": "", "role": ""}

    title = soup.find("title")
    if title:
        parts = title.get_text(strip=True).split(" - ")
        if len(parts) >= 3:
            result["circonscription"] = parts[1].strip()

    for a in soup.find_all("a", class_="link"):
        text = a.get_text(strip=True)
        if text.startswith("Commission") and len(text) > 15:
            result["commission"] = text
            ns = a.find_next_sibling("span")
            if ns:
                result["role"] = ns.get_text(strip=True).strip("()")
            break

    return result


def enrich_members(source: str = "an"):
    svc = Database.get(source=source)
    members: list[Member] = svc.get_members()
    total = len(members)
    updated = 0

    for i, member in enumerate(members, 1):
        if not member.deputy_id:
            continue
        if member.role and member.commission and member.circonscription:
            continue

        log.info(
            "[%d/%d] Enriching %s %s (PA%s)",
            i, total, member.firstname, member.lastname, member.deputy_id,
        )

        data = parse_deputy_page(member.deputy_id)
        if not data["circonscription"] and not data["commission"]:
            log.warning("No data found for deputy %s", member.deputy_id)
            continue

        with svc.conn.cursor() as cur:
            cur.execute(
                "UPDATE members SET"
                " role = COALESCE(NULLIF(%s, ''), role),"
                " commission = COALESCE(NULLIF(%s, ''), commission),"
                " circonscription = COALESCE(NULLIF(%s, ''), circonscription)"
                " WHERE id = %s;",
                (
                    data["role"],
                    data["commission"],
                    data["circonscription"],
                    member.member_index,
                ),
            )
        svc.conn.commit()
        updated += 1

    log.info("Enriched %d / %d members with deputy_id", updated, total)


def main():
    parser = argparse.ArgumentParser(
        description="Enrich member details from AN deputy profile pages"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
    args = parser.parse_args()
    enrich_members(source=args.source)


if __name__ == "__main__":
    main()
