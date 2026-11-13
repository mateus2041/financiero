"""Merge the advisor and existing-schema migration branches."""

from typing import Sequence, Union


revision: str = "d3a6f1c890ab"
down_revision: Union[str, Sequence[str], None] = (
    "a8c139d27e4f",
    "91d8b15c4a22",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
