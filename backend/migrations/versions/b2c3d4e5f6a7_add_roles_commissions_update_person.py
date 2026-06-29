"""add roles, commissions, and update person fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-24

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "commissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    with op.batch_alter_table("people") as batch_op:
        batch_op.add_column(sa.Column("firstname", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("lastname", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("role_id", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column("commission_id", sa.Integer(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("circonscription", sa.String(200), nullable=True)
        )
        batch_op.create_foreign_key("fk_people_role_id", "roles", ["role_id"], ["id"])
        batch_op.create_foreign_key(
            "fk_people_commission_id", "commissions", ["commission_id"], ["id"]
        )

    op.execute("UPDATE people SET firstname = name, lastname = ''")

    with op.batch_alter_table("people") as batch_op:
        batch_op.alter_column("firstname", nullable=False)
        batch_op.alter_column("lastname", nullable=False)
        batch_op.drop_column("name")


def downgrade() -> None:
    with op.batch_alter_table("people") as batch_op:
        batch_op.add_column(
            sa.Column("name", sa.String(200), nullable=True)
        )

    op.execute("UPDATE people SET name = firstname || ' ' || lastname")

    with op.batch_alter_table("people") as batch_op:
        batch_op.drop_column("circonscription")
        batch_op.drop_column("commission_id")
        batch_op.drop_column("role_id")
        batch_op.drop_column("lastname")
        batch_op.drop_column("firstname")
    op.drop_table("commissions")
    op.drop_table("roles")
