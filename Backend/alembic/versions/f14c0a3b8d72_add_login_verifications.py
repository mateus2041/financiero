"""Persist short-lived login verification challenges."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f14c0a3b8d72"
down_revision: Union[str, None] = "b2e4a6f91c83"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "verificaciones_login",
        sa.Column("challenge_id", sa.String(length=64), nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("rol", sa.String(length=20), nullable=False),
        sa.Column("codigo_hash", sa.String(length=64), nullable=False),
        sa.Column("expira_en", sa.DateTime(), nullable=False),
        sa.Column(
            "intentos",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("challenge_id"),
    )
    op.create_index(
        "ix_verificaciones_login_expira_en",
        "verificaciones_login",
        ["expira_en"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_verificaciones_login_expira_en",
        table_name="verificaciones_login",
    )
    op.drop_table("verificaciones_login")
