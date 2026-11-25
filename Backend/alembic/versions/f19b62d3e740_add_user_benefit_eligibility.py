"""Add user birth dates and benefit eligibility fields."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f19b62d3e740"
down_revision: Union[str, None] = "b2e4a6f91c83"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuario",
        sa.Column("fecha_nacimiento", sa.Date(), nullable=True),
    )
    op.add_column(
        "usuario",
        sa.Column(
            "discapacidad_confirmada",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "usuario",
        sa.Column(
            "beneficio_habilitado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("usuario", "beneficio_habilitado")
    op.drop_column("usuario", "discapacidad_confirmada")
    op.drop_column("usuario", "fecha_nacimiento")