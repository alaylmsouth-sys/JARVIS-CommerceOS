"""candidate uniqueness

Revision ID: 0003_candidate_uniqueness
Revises: 0002_candidate_review_fields
Create Date: 2026-07-20
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003_candidate_uniqueness"
down_revision: Union[str, None] = "0002_candidate_review_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("sourcing_candidates") as batch_op:
        batch_op.create_unique_constraint(
            "uq_sourcing_candidate_identity",
            ["name", "marketplace", "country"],
        )
    with op.batch_alter_table("project_candidates") as batch_op:
        batch_op.create_unique_constraint(
            "uq_project_candidate",
            ["project_id", "candidate_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("project_candidates") as batch_op:
        batch_op.drop_constraint("uq_project_candidate", type_="unique")
    with op.batch_alter_table("sourcing_candidates") as batch_op:
        batch_op.drop_constraint("uq_sourcing_candidate_identity", type_="unique")
