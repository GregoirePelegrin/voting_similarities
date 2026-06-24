"""add category_discriminativeness table

Revision ID: a1b2c3d4e5f6
Revises: 26d65773d7d2
Create Date: 2026-06-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "26d65773d7d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "category_discriminativeness",
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("info_gain", sa.Float(), nullable=False),
        sa.Column("normalized_ig", sa.Float(), nullable=False),
        sa.Column("variance_score", sa.Float(), nullable=False),
        sa.Column("per_group_breakdown", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("category_id"),
    )


def downgrade() -> None:
    op.drop_table("category_discriminativeness")
