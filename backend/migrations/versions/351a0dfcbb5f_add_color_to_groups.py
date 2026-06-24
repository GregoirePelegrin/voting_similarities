"""add color to groups

Revision ID: 351a0dfcbb5f
Revises: e41a6efd589b
Create Date: 2026-06-23 16:16:21.022067

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '351a0dfcbb5f'
down_revision: str | None = 'e41a6efd589b'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

GROUP_COLORS = [
    "#4E79A7",
    "#F28E2B",
    "#E15759",
    "#76B7B2",
    "#59A14F",
    "#EDC948",
    "#B07AA1",
    "#FF9DA7",
    "#9C755F",
    "#BAB0AC",
    "#86BCB6",
    "#8CD17D",
]


def upgrade() -> None:
    op.add_column(
        'groups',
        sa.Column(
            'color', sa.String(length=7), server_default="#808080", nullable=False
        ),
    )

    group_table = sa.table('groups', sa.column('id', sa.Integer), sa.column('color', sa.String))
    for i, color in enumerate(GROUP_COLORS, start=1):
        op.execute(group_table.update().where(group_table.c.id == i).values(color=color))


def downgrade() -> None:
    op.drop_column('groups', 'color')
