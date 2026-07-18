"""candidate review fields

Revision ID: 0002_candidate_review_fields
Revises: 0001_initial_schema
Create Date: 2026-07-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_candidate_review_fields"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sourcing_candidates",
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "sourcing_candidates",
        sa.Column("tags", sa.String(length=500), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("sourcing_candidates", "tags")
    op.drop_column("sourcing_candidates", "notes")
