"""Store the reason used when a card is blocked."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d7a9f2b5c41"
down_revision: Union[str, Sequence[str], None] = (
    "a0b7d9e3c241",
    "d3a6f1c890ab",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tarjetas",
        sa.Column("motivo_bloqueo", sa.String(length=32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tarjetas", "motivo_bloqueo")