from __future__ import annotations

import logging
import re
from datetime import date

from bs4 import BeautifulSoup, Tag

from parliament_data_extractor.common.config import CATEGORIES
from parliament_data_extractor.common.models.bulletin import Bulletin
from parliament_data_extractor.common.models.member import Member
from parliament_data_extractor.common.models.raw_page import RawPage
from parliament_data_extractor.common.models.vote import Vote
from parliament_data_extractor.common.services.database import Database
from parliament_data_extractor.common.services.llm_service import LLMService
from parliament_data_extractor.common.utils.text_utils import (
    build_normalized_map,
    match_category,
)

log = logging.getLogger(__name__)

CATEGORY_NORMALIZED_MAP: dict[str, str] = build_normalized_map(CATEGORIES)

FRENCH_MONTHS: dict[str, int] = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}

HEADERS: dict[str, str] = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        " AppleWebKit/537.36 (KHTML, like Gecko)"
        " Chrome/121.0.0.0 Safari/537.36"
    ),
}

GROUP_NAME_OVERRIDES: dict[str, str] = {
    "UDR": "Union des Droites pour la République",
    "Union des droites pour la République": "Union des Droites pour la République",
}


def normalize_group_name(name: str) -> str:
    return GROUP_NAME_OVERRIDES.get(name, name)


def parse_french_date(text: str) -> date | None:
    m = re.search(
        r"(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|"
        r"août|septembre|octobre|novembre|décembre)\s+(\d{4})",
        text,
        re.IGNORECASE,
    )
    if m:
        return date(
            year=int(m.group(3)),
            month=FRENCH_MONTHS[m.group(2).lower()],
            day=int(m.group(1)),
        )
    return None


def categorizer(vote_title: str) -> list[str]:
    if not vote_title:
        raise ValueError("empty vote title")
    raw_categories: str = LLMService.get().get_categorization(
        vote_title=vote_title, categories=CATEGORIES
    )
    cleaned: list[str] = []
    for chunk in raw_categories.replace("```", "").split(","):
        for token in chunk.splitlines():
            token = token.strip().strip("`").strip()
            if token and token not in cleaned:
                cleaned.append(token)
    return [match_category(cat, CATEGORY_NORMALIZED_MAP) for cat in cleaned]


def get_name_parts(name_tag: Tag) -> tuple[str, str]:
    txt: str = name_tag.get_text(strip=True).replace("Mme", "").replace("M.", "")
    parts: list[str] = txt.split()
    return parts[0], " ".join(parts[1:])


def parse_group(group_ul: Tag, vote_index: int, source: str = "an") -> list[Bulletin]:
    status_pattern: re.Pattern = re.compile(
        r"^h6 _colored-(travaux|fadered|grey)$"
    )
    bulletins: list[Bulletin] = []
    svc: Database = Database.get(source=source)

    group_h3 = group_ul.find("li").find("h3") if group_ul.find("li") else None
    group_name: str = group_h3.get_text(strip=True) if group_h3 else ""
    group_name = normalize_group_name(group_name)

    for status_li in group_ul.select("ul > li > ul > li"):
        status_el = status_li.find(class_=status_pattern)
        if not status_el:
            continue
        vote_value: str = status_el.get_text(strip=True)
        for person in status_li.select("ul._2-columns > li"):
            a_tag = person.find("a")
            if not a_tag:
                continue
            firstname, lastname = get_name_parts(a_tag)

            href: str = a_tag.get("href", "")
            pa_match = re.search(r"PA(\d{6})", href)
            deputy_id: str = pa_match.group(1) if pa_match else ""

            member: Member | None = None
            if deputy_id:
                member = svc.get_member_by_deputy_id(deputy_id)
            if member is None:
                try:
                    member = svc.get_member_by_names(
                        firstname=firstname, lastname=lastname
                    )
                except ValueError:
                    member = Member(
                        member_index=0,
                        firstname=firstname,
                        lastname=lastname,
                        group=group_name,
                        role="",
                        commission="",
                        circonscription="",
                        deputy_id=deputy_id,
                    )
                    new_id = svc.store_member_if_not_exists(member=member)
                    member.member_index = new_id
            bulletins.append(
                Bulletin.deserialize(
                    {
                        "vote_index": vote_index,
                        "member_index": member.member_index,
                        "vote": vote_value,
                    }
                )
            )
    return bulletins


def get_votes(soup: BeautifulSoup, vote_index: int, source: str = "an") -> list[Bulletin]:
    repartition = soup.find("div", class_="ha-grid-item _size-3")
    if not repartition:
        return []
    result: list[Bulletin] = []
    for g in repartition.select("ul[id^='groupe']"):
        result.extend(parse_group(g, vote_index, source=source))
    return result


def parse_vote_page(
    html: str, vote_index: int, source: str = "an"
) -> tuple[str, date | None, str, list[Bulletin]]:
    soup = BeautifulSoup(html, "html.parser")
    page_content = soup.find("div", class_="page-content")
    title_el = (
        page_content.find("p", class_="h6 _colored") if page_content else None
    )
    vote_title: str = title_el.text.strip() if title_el else ""

    vote_date: date | None = None
    for h2 in soup.find_all("h2", class_="h4 _colored"):
        parsed = parse_french_date(h2.get_text())
        if parsed:
            vote_date = parsed
            break

    bulletins = get_votes(soup=soup, vote_index=vote_index, source=source)
    return vote_title, vote_date, "", bulletins


def process_raw_page(raw_page: RawPage, source: str = "an") -> bool:
    svc = Database.get(source=source)
    scrutin_id: int = raw_page.scrutin_id
    html: str = raw_page.html

    try:
        title, vote_date, _description, bulletins = parse_vote_page(
            html, scrutin_id, source=source
        )
    except Exception as e:
        log.warning("Failed to parse raw page %s: %s", scrutin_id, e)
        svc.record_failed_vote(
            vote_id=scrutin_id, url=raw_page.url, error_msg=str(e)
        )
        return False

    try:
        categories: list[str] = categorizer(vote_title=title)
    except Exception as e:
        log.warning("Failed to categorize vote %s: %s", scrutin_id, e)
        categories = []

    vote = Vote(
        vote_index=scrutin_id,
        vote_title=title,
        vote_categories=categories,
        vote_date=vote_date,
        description="",
    )
    real_vote_id: int = svc.store_vote_if_not_exists(vote=vote)

    for bulletin in bulletins:
        bulletin.vote_index = real_vote_id
        svc.store_bulletin_if_not_exists(bulletin=bulletin)

    svc.mark_raw_page_processed(scrutin_id=scrutin_id)
    svc.delete_failed_vote(vote_id=scrutin_id)
    log.info("Parsed scrutins %s (vote id=%s)", scrutin_id, real_vote_id)
    return True


def recategorize_votes(source: str = "an"):
    svc = Database.get(source=source)
    votes: list[Vote] = svc.get_votes_without_categories()
    if not votes:
        log.info("No votes without categories")
        return

    log.info("Recategorizing %d vote(s)", len(votes))
    for i, vote in enumerate(votes, 1):
        try:
            categories: list[str] = categorizer(vote_title=vote.vote_title)
        except Exception as e:
            log.warning("Failed to recategorize vote %s: %s", vote.vote_index, e)
            continue
        svc.update_vote_categories(vote_id=vote.vote_index, categories=categories)
        log.info("[%d/%d] Recategorized vote %s", i, len(votes), vote.vote_index)

    log.info("Recategorization complete")


def fill_gap_votes(source: str = "an"):
    svc = Database.get(source=source)
    orphans: list[RawPage] = svc.get_raw_pages_without_votes()
    if not orphans:
        log.info("No raw pages without a corresponding vote")
        return

    log.info("Filling %d gap(s) — raw pages without votes", len(orphans))
    for i, rp in enumerate(orphans, 1):
        log.info("[%d/%d] Re-processing scrutins %s", i, len(orphans), rp.scrutin_id)
        process_raw_page(rp, source=source)

    log.info("Gap filling complete")


def main(source: str = "an", recategorize: bool = False, fill_gaps: bool = False):
    if recategorize:
        recategorize_votes(source=source)
        return
    if fill_gaps:
        fill_gap_votes(source=source)
        return

    svc = Database.get(source=source)
    unprocessed: list[RawPage] = svc.get_unprocessed_raw_pages()
    if not unprocessed:
        log.info("No unprocessed raw pages to parse")
        return

    total = len(unprocessed)
    log.info("Parsing %d unprocessed raw page(s)", total)
    for i, rp in enumerate(unprocessed, 1):
        log.info("[%d/%d] Parsing scrutins %s", i, total, rp.scrutin_id)
        process_raw_page(rp, source=source)

    log.info("Parsing complete")
