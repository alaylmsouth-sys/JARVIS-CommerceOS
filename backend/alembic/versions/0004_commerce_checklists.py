"""commerce checklists

Revision ID: 0004_commerce_checklists
Revises: 0003_candidate_uniqueness
Create Date: 2026-08-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_commerce_checklists"
down_revision: Union[str, None] = "0003_candidate_uniqueness"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commerce_checklists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("copy_ready", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("images_ready", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("supplier_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("inventory_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("pricing_confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("policy_checked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["sourcing_candidates.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.UniqueConstraint("candidate_id", name="uq_commerce_checklist_candidate"),
    )
    op.create_index(
        "ix_commerce_checklists_candidate_id",
        "commerce_checklists",
        ["candidate_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_commerce_checklists_candidate_id", table_name="commerce_checklists")
    op.drop_table("commerce_checklists")
