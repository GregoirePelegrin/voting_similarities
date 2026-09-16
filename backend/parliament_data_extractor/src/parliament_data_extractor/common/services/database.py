from __future__ import annotations

import os
from contextlib import closing
from threading import Lock

import numpy as np
import pandas as pd
import psycopg2
from dotenv import load_dotenv

from parliament_data_extractor.common.models.bulletin import Bulletin
from parliament_data_extractor.common.models.member import Member
from parliament_data_extractor.common.models.raw_page import RawPage
from parliament_data_extractor.common.models.vote import Vote
from parliament_data_extractor.common.schema import create_all_tables


class Database:
    _instances: dict[str, Database] = {}
    __lock: Lock = Lock()

    def __init__(self, source: str):
        load_dotenv()
        self.source: str = source
        self.conn = psycopg2.connect(
            dbname=os.getenv(f"DB_{source.upper()}_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )
        self.conn.autocommit = False
        create_all_tables(self)

    @staticmethod
    def get(source: str = "an") -> Database:
        if source not in Database._instances:
            with Database.__lock:
                if source not in Database._instances:
                    Database._instances[source] = Database(source)
        return Database._instances[source]

    @staticmethod
    def create(source: str = "an") -> Database:
        load_dotenv()
        db = object.__new__(Database)
        db.source = source
        db.conn = psycopg2.connect(
            dbname=os.getenv(f"DB_{source.upper()}_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )
        db.conn.autocommit = False
        return db

    # ---- Members ----

    @staticmethod
    def _member_from_row(row) -> Member:
        return Member(
            member_index=row[0],
            firstname=row[1],
            lastname=row[2],
            group=row[3] or "",
            role=row[4] or "",
            commission=row[5] or "",
            circonscription=row[6] or "",
            deputy_id=row[7] if len(row) > 7 and row[7] else "",
        )

    def store_member_if_not_exists(self, member: Member) -> int:
        if member.deputy_id:
            existing = self.get_member_by_deputy_id(member.deputy_id)
            if existing is not None:
                return existing.member_index
        try:
            stored: Member = self.get_member_by_names(
                firstname=member.firstname, lastname=member.lastname
            )
            return stored.member_index
        except ValueError:
            with closing(self.conn.cursor()) as cur:
                cur.execute(
                    "INSERT INTO members"
                    " (first_name, last_name, group_name, role,"
                    " commission, circonscription, deputy_id)"
                    " VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id;",
                    (
                        member.firstname,
                        member.lastname,
                        member.group,
                        member.role,
                        member.commission,
                        member.circonscription,
                        member.deputy_id or None,
                    ),
                )
                member_id = cur.fetchone()[0]
            self.conn.commit()
            return member_id

    def get_member_by_id(self, member_index: int) -> Member:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT * FROM members WHERE id = %s;", (member_index,))
            res = cur.fetchone()
        if not res:
            raise ValueError(f"no member with ID {member_index}")
        return self._member_from_row(res)

    def get_member_by_deputy_id(self, deputy_id: str) -> Member | None:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT * FROM members WHERE deputy_id = %s;", (deputy_id,)
            )
            res = cur.fetchone()
        return self._member_from_row(res) if res else None

    def get_member_by_names(self, firstname: str, lastname: str) -> Member:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT * FROM members"
                " WHERE first_name = %s AND last_name = %s;",
                (firstname, lastname),
            )
            res = cur.fetchone()
        if not res:
            raise ValueError(f"no member named {firstname} {lastname}")
        return self._member_from_row(res)

    def get_members(self) -> list[Member]:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT * FROM members ORDER BY id;")
            rows = cur.fetchall()
        if not rows:
            raise ValueError("no members")
        return [self._member_from_row(r) for r in rows]

    # ---- Votes ----

    def get_vote_by_id(self, vote_index: int) -> Vote:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT * FROM votes WHERE id = %s;", (vote_index,))
            res = cur.fetchone()
        if not res:
            raise ValueError(f"no vote with ID {vote_index}")
        return Vote(
            vote_index=res[0],
            vote_title=res[1],
            vote_categories=res[2],
            vote_date=res[3] if len(res) > 3 else None,
            description=res[4] if len(res) > 4 else "",
        )

    def get_vote_by_title(self, vote_title: str) -> Vote:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT * FROM votes WHERE title = %s;", (vote_title,))
            res = cur.fetchone()
        if not res:
            raise ValueError(f"no vote with title {vote_title}")
        return Vote(
            vote_index=res[0],
            vote_title=res[1],
            vote_categories=res[2],
            vote_date=res[3] if len(res) > 3 else None,
            description=res[4] if len(res) > 4 else "",
        )

    def get_vote_id_by_scrutin_id(self, scrutin_id: int) -> int | None:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT id FROM votes WHERE scrutin_id = %s"
                " OR (scrutin_id IS NULL AND id = %s);",
                (scrutin_id, scrutin_id),
            )
            res = cur.fetchone()
        return res[0] if res else None

    def get_last_scrutin_id(self) -> int | None:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT scrutin_id FROM raw_pages"
                " ORDER BY scrutin_id DESC LIMIT 1;"
            )
            res = cur.fetchone()
        return res[0] if res else None

    def get_last_vote(self) -> Vote | None:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT * FROM votes ORDER BY id DESC LIMIT 1;")
            res = cur.fetchone()
        if not res:
            return None
        return Vote(
            vote_index=res[0],
            vote_title=res[1],
            vote_categories=res[2],
            vote_date=res[3] if len(res) > 3 else None,
            description=res[4] if len(res) > 4 else "",
        )

    def get_min_max_vote_ids(self) -> tuple[int | None, int | None]:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT MIN(id), MAX(id) FROM votes;")
            res = cur.fetchone()
        return (res[0], res[1]) if res else (None, None)

    def get_votes_number(self) -> int:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT COUNT(*) FROM votes;")
            res = cur.fetchone()
        if not res:
            raise ValueError("no votes?")
        return res[0]

    def get_all_vote_ids(self) -> list[int]:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT id FROM votes ORDER BY id;")
            return [row[0] for row in cur.fetchall()]

    def get_stored_vote_ids(self) -> set[int]:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT id FROM votes;")
            return {row[0] for row in cur.fetchall()}

    def get_stored_scrutin_ids(self) -> set[int]:
        with closing(self.conn.cursor()) as cur:
            cur.execute("SELECT COALESCE(scrutin_id, id) FROM votes;")
            return {row[0] for row in cur.fetchall()}

    def get_votes_without_categories(self) -> list[Vote]:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT id, title, categories, date, description"
                " FROM votes"
                " WHERE categories IS NULL OR categories = '{}'"
                " ORDER BY id;",
            )
            return [
                Vote(
                    vote_index=r[0],
                    vote_title=r[1],
                    vote_categories=r[2] if r[2] else [],
                    vote_date=r[3],
                    description=r[4] or "",
                )
                for r in cur.fetchall()
            ]

    def update_vote_categories(self, vote_id: int, categories: list[str]):
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "UPDATE votes SET categories = %s WHERE id = %s;",
                (categories, vote_id),
            )
        self.conn.commit()

    def store_vote_if_not_exists(self, vote: Vote) -> int:
        scrutin_id: int = vote.vote_index
        existing = self.get_vote_id_by_scrutin_id(scrutin_id=scrutin_id)
        if existing is not None:
            return existing
        try:
            stored = self.get_vote_by_title(vote_title=vote.vote_title)
            return stored.vote_index
        except ValueError:
            pass
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "INSERT INTO votes"
                " (title, categories, date, description, scrutin_id)"
                " VALUES (%s,%s,%s,%s,%s) RETURNING id;",
                (
                    vote.vote_title,
                    vote.vote_categories,
                    vote.vote_date,
                    vote.description,
                    scrutin_id,
                ),
            )
            vote_id = cur.fetchone()[0]
        self.conn.commit()
        return vote_id

    # ---- Bulletins ----

    def store_bulletin_if_not_exists(self, bulletin: Bulletin):
        try:
            self.get_bulletin_by_ids(
                vote_index=bulletin.vote_index,
                member_index=bulletin.member_index,
            )
        except ValueError:
            with closing(self.conn.cursor()) as cur:
                cur.execute(
                    "INSERT INTO bulletins (vote_id, member_id, vote)"
                    " VALUES (%s,%s,%s);",
                    (bulletin.vote_index, bulletin.member_index, bulletin.vote),
                )
            self.conn.commit()

    def get_bulletin_by_ids(
        self, vote_index: int, member_index: int
    ) -> Bulletin:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT * FROM bulletins"
                " WHERE vote_id = %s AND member_id = %s;",
                (vote_index, member_index),
            )
            res = cur.fetchone()
        if not res:
            raise ValueError(
                f"no bulletin with IDs vote={vote_index} member={member_index}"
            )
        return Bulletin(vote_index=res[0], member_index=res[1], vote=res[2])

    # ---- Raw Pages ----

    def store_raw_page(self, raw_page: RawPage):
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "INSERT INTO raw_pages"
                " (scrutin_id, url, html, fetched_at, processed)"
                " VALUES (%s,%s,%s,%s,FALSE)"
                " ON CONFLICT (scrutin_id) DO UPDATE"
                " SET html = EXCLUDED.html, fetched_at = EXCLUDED.fetched_at,"
                " processed = FALSE;",
                (
                    raw_page.scrutin_id,
                    raw_page.url,
                    raw_page.html,
                    raw_page.fetched_at,
                ),
            )
        self.conn.commit()

    def mark_raw_page_processed(self, scrutin_id: int):
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "UPDATE raw_pages SET processed = TRUE"
                " WHERE scrutin_id = %s;",
                (scrutin_id,),
            )
        self.conn.commit()

    def get_unprocessed_raw_pages(self) -> list[RawPage]:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT scrutin_id, url, html, fetched_at"
                " FROM raw_pages WHERE processed = FALSE"
                " ORDER BY scrutin_id;",
            )
            return [
                RawPage(
                    scrutin_id=r[0], url=r[1], html=r[2], fetched_at=r[3]
                )
                for r in cur.fetchall()
            ]

    def get_raw_pages_without_votes(self) -> list[RawPage]:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT rp.scrutin_id, rp.url, rp.html, rp.fetched_at"
                " FROM raw_pages rp"
                " LEFT JOIN votes v ON v.scrutin_id = rp.scrutin_id"
                " WHERE v.id IS NULL"
                " ORDER BY rp.scrutin_id;",
            )
            return [
                RawPage(
                    scrutin_id=r[0], url=r[1], html=r[2], fetched_at=r[3]
                )
                for r in cur.fetchall()
            ]

    def get_raw_page(self, scrutin_id: int) -> RawPage | None:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT scrutin_id, url, html, fetched_at"
                " FROM raw_pages WHERE scrutin_id = %s;",
                (scrutin_id,),
            )
            res = cur.fetchone()
        if not res:
            return None
        return RawPage(
            scrutin_id=res[0], url=res[1], html=res[2], fetched_at=res[3]
        )

    # ---- Failed Votes ----

    def record_failed_vote(
        self, vote_id: int, url: str, error_msg: str
    ):
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "INSERT INTO failed_votes"
                " (vote_id, url, error_msg, attempt_count, last_attempt)"
                " VALUES (%s,%s,%s,1,NOW())"
                " ON CONFLICT (vote_id) DO UPDATE SET"
                " attempt_count = failed_votes.attempt_count + 1,"
                " error_msg = EXCLUDED.error_msg,"
                " last_attempt = NOW();",
                (vote_id, url, error_msg),
            )
        self.conn.commit()

    def get_failed_votes(self, max_attempts: int = 3) -> list[dict]:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT vote_id, url, error_msg, attempt_count, last_attempt"
                " FROM failed_votes WHERE attempt_count < %s"
                " ORDER BY last_attempt;",
                (max_attempts,),
            )
            columns = ["vote_id", "url", "error_msg", "attempt_count", "last_attempt"]
            return [dict(zip(columns, row, strict=False)) for row in cur.fetchall()]

    def get_all_failed_votes(self) -> list[dict]:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT vote_id, url, error_msg, attempt_count, last_attempt"
                " FROM failed_votes ORDER BY vote_id;",
            )
            columns = ["vote_id", "url", "error_msg", "attempt_count", "last_attempt"]
            return [dict(zip(columns, row, strict=False)) for row in cur.fetchall()]

    def delete_failed_vote(self, vote_id: int):
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "DELETE FROM failed_votes WHERE vote_id = %s;", (vote_id,)
            )
        self.conn.commit()

    # ---- Analysis ----

    def get_votes_by_member(self, member_id: int) -> np.ndarray:
        with closing(self.conn.cursor()) as cur:
            cur.execute(
                "SELECT vote_id, vote FROM bulletins WHERE member_id = %s;",
                (member_id,),
            )
            res = cur.fetchall()
        vote_ids = self.get_all_vote_ids()
        if not vote_ids:
            return np.array([])
        vote_map: dict[str, int] = {"Pour": 1, "Contre": 0}
        id_to_index = {vid: i for i, vid in enumerate(vote_ids)}
        results: np.ndarray = np.full(len(vote_ids), np.nan)
        if res:
            for vote_id, vote in res:
                results[id_to_index[vote_id]] = vote_map.get(vote, np.nan)
        return results

    def get_votes_dataframe(self) -> pd.DataFrame:
        votes_acc: list[np.ndarray] = []
        members = self.get_members()
        vote_ids = self.get_all_vote_ids()
        if not vote_ids or not members:
            return pd.DataFrame()
        for member in members:
            votes_acc.append(
                self.get_votes_by_member(member_id=member.member_index)
            )
        votes_df = pd.DataFrame(votes_acc)
        votes_df.insert(
            0,
            "name",
            [
                f"{member.lastname}<splitter/>{member.firstname}"
                for member in members
            ],
        )
        return votes_df

    def close(self):
        self.conn.close()
