"""Track whether a card's CVV has already been reset."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2e4a6f91c83"
down_revision: Union[str, None] = "d3a6f1c890ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tarjetas",
        sa.Column(
            "cvv_restablecido",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("tarjetas", "cvv_restablecido")
