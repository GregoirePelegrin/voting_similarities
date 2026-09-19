from __future__ import annotations

import logging
import re
from dataclasses import dataclass, replace
from datetime import date

from bs4 import BeautifulSoup, Tag

from parliament_data_extractor.categories import CATEGORIES
from parliament_data_extractor.config import ExtractorSettings
from parliament_data_extractor.database import ParliamentDatabase
from parliament_data_extractor.llm import LLMService
from parliament_data_extractor.models.bulletin import Bulletin
from parliament_data_extractor.models.member import Member
from parliament_data_extractor.models.raw_page import RawPage
from parliament_data_extractor.sources.an.config import normalize_group_name
from parliament_data_extractor.text import build_normalized_map, match_category

log = logging.getLogger(__name__)

_FRENCH_MONTHS: dict[str, int] = {
    "janvier": 1,
    "février": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "août": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "décembre": 12,
}
_FRENCH_DATE_RE = re.compile(
    r"(\d{1,2})\s+"
    r"(janvier|février|mars|avril|mai|juin|juillet|août|"
    r"septembre|octobre|novembre|décembre)\s+(\d{4})",
    re.IGNORECASE,
)
_GROUP_STATUS_RE = re.compile(r"^h6 _colored-(travaux|fadered|grey)$")
_PA_ID_RE = re.compile(r"PA(\d{6})")

_NORMALIZED_CATEGORIES = build_normalized_map(CATEGORIES)


@dataclass(frozen=True, slots=True)
class ParseOutcome:
    title: str
    date: date | None
    bulletins: list[Bulletin]


def parse_french_date(text: str) -> date | None:
    match = _FRENCH_DATE_RE.search(text)
    if match is None:
        return None
    return date(
        year=int(match.group(3)),
        month=_FRENCH_MONTHS[match.group(2).lower()],
        day=int(match.group(1)),
    )


def categorize_title(vote_title: str, llm: LLMService) -> list[str]:
    if not vote_title:
        raise ValueError("empty vote title")
    raw = llm.categorize(vote_title=vote_title)
    cleaned: list[str] = []
    for chunk in raw.replace("```", "").split(","):
        for token in chunk.splitlines():
            token = token.strip().strip("`").strip()
            if token and token not in cleaned:
                cleaned.append(token)
    return [match_category(token, _NORMALIZED_CATEGORIES) for token in cleaned]


def _name_parts(name_tag: Tag) -> tuple[str, str]:
    text = name_tag.get_text(strip=True).replace("Mme", "").replace("M.", "")
    parts = text.split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _parse_group(
    group_ul: Tag, db: ParliamentDatabase, vote_id: int
) -> list[Bulletin]:
    first_item = group_ul.find("li")
    group_heading = first_item.find("h3") if first_item else None
    group_name = (
        normalize_group_name(group_heading.get_text(strip=True))
        if group_heading
        else ""
    )

    bulletins: list[Bulletin] = []
    for status_li in group_ul.select("ul > li > ul > li"):
        status_el = status_li.find(class_=_GROUP_STATUS_RE)
        if status_el is None:
            continue
        vote_value = status_el.get_text(strip=True)
        for person in status_li.select("ul._2-columns > li"):
            anchor = person.find("a")
            if anchor is None:
                continue
            firstname, lastname = _name_parts(anchor)
            deputy_id = ""
            pa_match = _PA_ID_RE.search(anchor.get("href", ""))
            if pa_match:
                deputy_id = pa_match.group(1)
            member = _resolve_member(db, firstname, lastname, deputy_id, group_name)
            bulletins.append(
                Bulletin(vote_id=vote_id, member_id=member.id, vote=vote_value)
            )
    return bulletins


def _resolve_member(
    db: ParliamentDatabase,
    firstname: str,
    lastname: str,
    deputy_id: str,
    group_name: str,
) -> Member:
    if deputy_id:
        existing = db.get_member_by_deputy_id(deputy_id)
        if existing is not None:
            return existing
    try:
        return db.get_member_by_names(firstname, lastname)
    except ValueError:
        member = Member(
            id=0,
            first_name=firstname,
            last_name=lastname,
            group_name=group_name,
            deputy_id=deputy_id or None,
        )
        member_id = db.store_member_if_not_exists(member)
        return replace(member, id=member_id)


def parse_vote_page(
    html: str,
    *,
    db: ParliamentDatabase,
    scrutin_id: int,
) -> ParseOutcome:
    soup = BeautifulSoup(html, "html.parser")

    page_content = soup.find("div", class_="page-content")
    title_el = (
        page_content.find("p", class_="h6 _colored")
        if page_content is not None
        else None
    )
    title = title_el.get_text(strip=True) if title_el else ""

    vote_date: date | None = None
    for heading in soup.find_all("h2", class_="h4 _colored"):
        candidate = parse_french_date(heading.get_text())
        if candidate is not None:
            vote_date = candidate
            break

    bulletins: list[Bulletin] = []
    repartition = soup.find("div", class_="ha-grid-item _size-3")
    if repartition is not None:
        for group in repartition.select("ul[id^='groupe']"):
            bulletins.extend(_parse_group(group, db, scrutin_id))

    return ParseOutcome(title=title, date=vote_date, bulletins=bulletins)


def process_raw_page(
    db: ParliamentDatabase, llm: LLMService, raw_page: RawPage
) -> bool:
    scrutin_id = raw_page.scrutin_id
    try:
        outcome = parse_vote_page(
            raw_page.html, db=db, scrutin_id=scrutin_id
        )
    except Exception as error:
        log.warning("Failed to parse raw page %s: %s", scrutin_id, error)
        db.record_failed_vote(
            vote_id=scrutin_id, url=raw_page.url, error_msg=str(error)
        )
        return False

    try:
        categories = categorize_title(outcome.title, llm)
    except Exception as error:
        log.warning("Failed to categorize vote %s: %s", scrutin_id, error)
        categories = []

    vote_id = db.get_or_create_vote(
        scrutin_id=scrutin_id,
        title=outcome.title,
        categories=categories,
        date_vote=outcome.date,
        description="",
    )
    for bulletin in outcome.bulletins:
        db.store_bulletin(replace(bulletin, vote_id=vote_id))

    db.mark_raw_page_processed(scrutin_id)
    db.delete_failed_vote(scrutin_id)
    log.info("Parsed scrutins %s (vote id=%s)", scrutin_id, vote_id)
    return True


def parse_pending(source: str, llm: LLMService) -> None:
    db = ParliamentDatabase.get(source)
    unprocessed = db.get_unprocessed_raw_pages()
    if not unprocessed:
        log.info("No unprocessed raw pages to parse")
        return

    total = len(unprocessed)
    log.info("Parsing %d unprocessed raw page(s)", total)
    for position, raw_page in enumerate(unprocessed, start=1):
        log.info("[%d/%d] Parsing scrutins %s", position, total, raw_page.scrutin_id)
        process_raw_page(db, llm, raw_page)
    log.info("Parsing complete")


def recategorize_votes(source: str, llm: LLMService) -> None:
    db = ParliamentDatabase.get(source)
    votes = db.get_votes_without_categories()
    if not votes:
        log.info("No votes without categories")
        return

    log.info("Recategorizing %d vote(s)", len(votes))
    for position, vote in enumerate(votes, start=1):
        try:
            categories = categorize_title(vote.title, llm)
        except Exception as error:
            log.warning("Failed to recategorize vote %s: %s", vote.id, error)
            continue
        db.update_vote_categories(vote.id, categories)
        log.info("[%d/%d] Recategorized vote %s", position, len(votes), vote.id)
    log.info("Recategorization complete")


def fill_gap_votes(source: str, llm: LLMService) -> None:
    db = ParliamentDatabase.get(source)
    orphans = db.get_raw_pages_without_votes()
    if not orphans:
        log.info("No raw pages without a corresponding vote")
        return

    log.info("Filling %d gap(s) — raw pages without votes", len(orphans))
    for position, raw_page in enumerate(orphans, start=1):
        log.info(
            "[%d/%d] Re-processing scrutins %s",
            position,
            len(orphans),
            raw_page.scrutin_id,
        )
        process_raw_page(db, llm, raw_page)
    log.info("Gap filling complete")


def main(
    *,
    source: str = "an",
    recategorize: bool = False,
    fill_gaps: bool = False,
) -> None:
    llm = LLMService(ExtractorSettings())
    if recategorize:
        recategorize_votes(source, llm)
        return
    if fill_gaps:
        fill_gap_votes(source, llm)
        return
    parse_pending(source, llm)