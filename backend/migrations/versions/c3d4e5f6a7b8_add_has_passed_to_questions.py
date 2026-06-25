"""add has_passed to questions

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("questions") as batch_op:
        batch_op.add_column(
            sa.Column("has_passed", sa.Boolean(), nullable=True)
        )

    op.execute(
        "UPDATE questions SET has_passed = ("
        " SELECT CASE WHEN COUNT(CASE WHEN value = 1 THEN 1 END) > "
        " COUNT(CASE WHEN value = 0 THEN 1 END) THEN 1 ELSE 0 END"
        " FROM answers WHERE answers.question_id = questions.id"
        ")"
    )

    with op.batch_alter_table("questions") as batch_op:
        batch_op.alter_column("has_passed", nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("questions") as batch_op:
        batch_op.drop_column("has_passed")
