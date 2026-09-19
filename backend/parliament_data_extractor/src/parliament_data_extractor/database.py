from collections.abc import Iterator
from contextlib import closing, contextmanager
from datetime import date
from threading import Lock
from typing import Self

import psycopg2
from psycopg2 import extensions

from parliament_data_extractor.config import ExtractorSettings
from parliament_data_extractor.models.bulletin import Bulletin
from parliament_data_extractor.models.member import Member
from parliament_data_extractor.models.raw_page import RawPage
from parliament_data_extractor.models.vote import Vote
from parliament_data_extractor.schema import DDL_STATEMENTS

Cursor = extensions.cursor

MEMBER_COLUMNS: tuple[str, ...] = (
    "id",
    "first_name",
    "last_name",
    "group_name",
    "role",
    "commission",
    "circonscription",
    "deputy_id",
)
VOTE_COLUMNS: tuple[str, ...] = (
    "id",
    "title",
    "categories",
    "date",
    "description",
    "scrutin_id",
)
BULLETIN_COLUMNS: tuple[str, ...] = ("vote_id", "member_id", "vote")
RAW_PAGE_COLUMNS: tuple[str, ...] = (
    "scrutin_id",
    "url",
    "html",
    "fetched_at",
    "processed",
)

_MEMBER_SELECT = f"SELECT {', '.join(MEMBER_COLUMNS)} FROM members"
_VOTE_SELECT = f"SELECT {', '.join(VOTE_COLUMNS)} FROM votes"
_RAW_PAGE_SELECT = f"SELECT {', '.join(RAW_PAGE_COLUMNS)} FROM raw_pages"


def _row_to_mapping(
    row: tuple, columns: tuple[str, ...]
) -> dict[str, object]:
    return dict(zip(columns, row, strict=True))


class ParliamentDatabase:
    """Psycopg2-backed persistence for a single parliamentary source."""

    _instances: dict[str, Self] = {}
    _instances_lock: Lock = Lock()

    def __init__(self, source: str, settings: ExtractorSettings | None = None):
        self.source = source
        self.settings = settings or ExtractorSettings()
        db_name = self.settings.db_name(source)
        self.conn = psycopg2.connect(
            **self.settings.psycopg_connect_kwargs(db_name)
        )
        self.conn.autocommit = False
        self._ensure_schema()

    # -- lifecycle ------------------------------------------------------------

    @classmethod
    def get(cls, source: str) -> Self:
        if source not in cls._instances:
            with cls._instances_lock:
                if source not in cls._instances:
                    cls._instances[source] = cls(source)
        return cls._instances[source]

    @classmethod
    def close_all(cls) -> None:
        with cls._instances_lock:
            instances = tuple(cls._instances.values())
        for instance in instances:
            instance.close()
        with cls._instances_lock:
            cls._instances.clear()

    def close(self) -> None:
        self.conn.close()

    @contextmanager
    def transaction(self) -> Iterator[Cursor]:
        with closing(self.conn.cursor()) as cursor:
            try:
                yield cursor
            except BaseException:
                self.conn.rollback()
                raise
        self.conn.commit()

    def _ensure_schema(self) -> None:
        with self.transaction() as cursor:
            for statement in DDL_STATEMENTS:
                cursor.execute(statement)

    # -- helpers --------------------------------------------------------------

    @staticmethod
    def _member_from_row(row: tuple) -> Member:
        data = _row_to_mapping(row, MEMBER_COLUMNS)
        return Member(
            id=data["id"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            group_name=data["group_name"] or "",
            role=data["role"] or "",
            commission=data["commission"] or "",
            circonscription=data["circonscription"] or "",
            deputy_id=data["deputy_id"],
        )

    @staticmethod
    def _vote_from_row(row: tuple) -> Vote:
        data = _row_to_mapping(row, VOTE_COLUMNS)
        return Vote(
            id=data["id"],
            title=data["title"],
            categories=list(data["categories"] or []),
            date=data["date"],
            description=data["description"] or "",
            scrutin_id=data["scrutin_id"],
        )

    @staticmethod
    def _raw_page_from_row(row: tuple) -> RawPage:
        data = _row_to_mapping(row, RAW_PAGE_COLUMNS)
        return RawPage(
            scrutin_id=data["scrutin_id"],
            url=data["url"],
            html=data["html"],
            fetched_at=data["fetched_at"],
            processed=bool(data["processed"]),
        )

    # -- members --------------------------------------------------------------

    def store_member_if_not_exists(self, member: Member) -> int:
        with self.transaction() as cursor:
            existing = self._find_member(cursor, member)
            if existing is not None:
                return existing.id
            cursor.execute(
                "INSERT INTO members"
                " (first_name, last_name, group_name, role,"
                " commission, circonscription, deputy_id)"
                " VALUES (%s, %s, %s, %s, %s, %s, %s)"
                " RETURNING id",
                (
                    member.first_name,
                    member.last_name,
                    member.group_name,
                    member.role,
                    member.commission,
                    member.circonscription,
                    member.deputy_id,
                ),
            )
            return cursor.fetchone()[0]

    @staticmethod
    def _find_member(cursor: Cursor, member: Member) -> Member | None:
        if member.deputy_id:
            cursor.execute(
                f"{_MEMBER_SELECT} WHERE deputy_id = %s",
                (member.deputy_id,),
            )
            row = cursor.fetchone()
            if row is not None:
                return ParliamentDatabase._member_from_row(row)
        cursor.execute(
            f"{_MEMBER_SELECT}"
            " WHERE first_name = %s AND last_name = %s",
            (member.first_name, member.last_name),
        )
        row = cursor.fetchone()
        return ParliamentDatabase._member_from_row(row) if row else None

    def get_member_by_id(self, member_id: int) -> Member:
        with self.transaction() as cursor:
            cursor.execute(f"{_MEMBER_SELECT} WHERE id = %s", (member_id,))
            row = cursor.fetchone()
        if row is None:
            raise ValueError(f"no member with ID {member_id}")
        return self._member_from_row(row)

    def get_member_by_deputy_id(self, deputy_id: str) -> Member | None:
        with self.transaction() as cursor:
            cursor.execute(
                f"{_MEMBER_SELECT} WHERE deputy_id = %s", (deputy_id,)
            )
            row = cursor.fetchone()
        return self._member_from_row(row) if row else None

    def get_member_by_names(
        self, first_name: str, last_name: str
    ) -> Member:
        with self.transaction() as cursor:
            cursor.execute(
                f"{_MEMBER_SELECT}"
                " WHERE first_name = %s AND last_name = %s",
                (first_name, last_name),
            )
            row = cursor.fetchone()
        if row is None:
            raise ValueError(f"no member named {first_name} {last_name}")
        return self._member_from_row(row)

    def get_members(self) -> list[Member]:
        with self.transaction() as cursor:
            cursor.execute(f"{_MEMBER_SELECT} ORDER BY id")
            return [self._member_from_row(row) for row in cursor.fetchall()]

    def update_member_details(
        self,
        member_id: int,
        *,
        role: str,
        commission: str,
        circonscription: str,
    ) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "UPDATE members SET"
                " role = COALESCE(NULLIF(%s, ''), role),"
                " commission = COALESCE(NULLIF(%s, ''), commission),"
                " circonscription = COALESCE(NULLIF(%s, ''), circonscription)"
                " WHERE id = %s",
                (role, commission, circonscription, member_id),
            )

    # -- votes ----------------------------------------------------------------

    def get_or_create_vote(
        self,
        scrutin_id: int,
        title: str,
        categories: list[str],
        date_vote: date | None,
        description: str,
    ) -> int:
        with self.transaction() as cursor:
            existing_id = self._find_vote_by_scrutin(cursor, scrutin_id)
            if existing_id is not None:
                return existing_id
            cursor.execute(
                f"{_VOTE_SELECT} WHERE title = %s", (title,)
            )
            row = cursor.fetchone()
            if row is not None:
                return self._vote_from_row(row).id
            cursor.execute(
                "INSERT INTO votes"
                " (title, categories, date, description, scrutin_id)"
                " VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (title, categories, date_vote, description, scrutin_id),
            )
            return cursor.fetchone()[0]

    @staticmethod
    def _find_vote_by_scrutin(
        cursor: Cursor, scrutin_id: int
    ) -> int | None:
        cursor.execute(
            "SELECT id FROM votes"
            " WHERE scrutin_id = %s OR (scrutin_id IS NULL AND id = %s)",
            (scrutin_id, scrutin_id),
        )
        row = cursor.fetchone()
        return row[0] if row else None

    def get_votes_without_categories(self) -> list[Vote]:
        with self.transaction() as cursor:
            cursor.execute(
                f"{_VOTE_SELECT}"
                " WHERE categories IS NULL OR categories = '{}'"
                " ORDER BY id"
            )
            return [self._vote_from_row(row) for row in cursor.fetchall()]

    def update_vote_categories(
        self, vote_id: int, categories: list[str]
    ) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "UPDATE votes SET categories = %s WHERE id = %s",
                (categories, vote_id),
            )

    # -- bulletins ------------------------------------------------------------

    def store_bulletin(self, bulletin: Bulletin) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "INSERT INTO bulletins (vote_id, member_id, vote)"
                " VALUES (%s, %s, %s)"
                " ON CONFLICT (vote_id, member_id) DO NOTHING",
                (bulletin.vote_id, bulletin.member_id, bulletin.vote),
            )

    # -- raw pages ------------------------------------------------------------

    def get_raw_page(self, scrutin_id: int) -> RawPage | None:
        with self.transaction() as cursor:
            cursor.execute(
                f"{_RAW_PAGE_SELECT} WHERE scrutin_id = %s", (scrutin_id,)
            )
            row = cursor.fetchone()
        return self._raw_page_from_row(row) if row else None

    def store_raw_page(self, raw_page: RawPage) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "INSERT INTO raw_pages"
                " (scrutin_id, url, html, fetched_at, processed)"
                " VALUES (%s, %s, %s, %s, FALSE)"
                " ON CONFLICT (scrutin_id) DO UPDATE SET"
                " url = EXCLUDED.url,"
                " html = EXCLUDED.html,"
                " fetched_at = EXCLUDED.fetched_at,"
                " processed = FALSE",
                (
                    raw_page.scrutin_id,
                    raw_page.url,
                    raw_page.html,
                    raw_page.fetched_at,
                ),
            )

    def mark_raw_page_processed(self, scrutin_id: int) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "UPDATE raw_pages SET processed = TRUE"
                " WHERE scrutin_id = %s",
                (scrutin_id,),
            )

    def get_last_scrutin_id(self) -> int | None:
        with self.transaction() as cursor:
            cursor.execute(
                "SELECT scrutin_id FROM raw_pages"
                " ORDER BY scrutin_id DESC LIMIT 1"
            )
            row = cursor.fetchone()
        return row[0] if row else None

    def get_unprocessed_raw_pages(self) -> list[RawPage]:
        with self.transaction() as cursor:
            cursor.execute(
                f"{_RAW_PAGE_SELECT}"
                " WHERE processed = FALSE ORDER BY scrutin_id"
            )
            return [self._raw_page_from_row(row) for row in cursor.fetchall()]

    def get_raw_pages_without_votes(self) -> list[RawPage]:
        columns = ", ".join(f"rp.{column}" for column in RAW_PAGE_COLUMNS)
        with self.transaction() as cursor:
            cursor.execute(
                f"SELECT {columns} FROM raw_pages rp"
                " LEFT JOIN votes v ON v.scrutin_id = rp.scrutin_id"
                " WHERE v.id IS NULL"
                " ORDER BY rp.scrutin_id"
            )
            return [self._raw_page_from_row(row) for row in cursor.fetchall()]

    # -- failed votes ---------------------------------------------------------

    def record_failed_vote(
        self, vote_id: int, url: str, error_msg: str
    ) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "INSERT INTO failed_votes"
                " (vote_id, url, error_msg, attempt_count, last_attempt)"
                " VALUES (%s, %s, %s, 1, NOW())"
                " ON CONFLICT (vote_id) DO UPDATE SET"
                " attempt_count = failed_votes.attempt_count + 1,"
                " error_msg = EXCLUDED.error_msg,"
                " last_attempt = NOW()",
                (vote_id, url, error_msg),
            )

    def delete_failed_vote(self, vote_id: int) -> None:
        with self.transaction() as cursor:
            cursor.execute(
                "DELETE FROM failed_votes WHERE vote_id = %s", (vote_id,)
            )