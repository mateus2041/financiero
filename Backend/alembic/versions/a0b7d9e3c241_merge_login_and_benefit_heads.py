"""Merge the login verification and benefit eligibility migrations."""

from typing import Sequence, Union


revision: str = "a0b7d9e3c241"
down_revision: Union[str, Sequence[str], None] = (
    "f14c0a3b8d72",
    "f19b62d3e740",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
