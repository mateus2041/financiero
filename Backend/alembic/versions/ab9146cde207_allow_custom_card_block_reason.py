"""Allow custom card block reasons."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ab9146cde207"
down_revision: Union[str, Sequence[str], None] = "6d7a9f2b5c41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "tarjetas",
        "motivo_bloqueo",
        existing_type=sa.String(length=32),
        type_=sa.String(length=255),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "tarjetas",
        "motivo_bloqueo",
        existing_type=sa.String(length=255),
        type_=sa.String(length=32),
        existing_nullable=True,
    )
