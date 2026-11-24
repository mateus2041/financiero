from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def test_alembic_migrations_have_a_single_head_and_safe_merge_order():
    project_root = Path(__file__).resolve().parents[2]
    config = Config(str(project_root / "Backend" / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    merge = script.get_revision("d3a6f1c890ab")
    final_merge = script.get_revision("a0b7d9e3c241")

    assert script.get_heads() == ["a0b7d9e3c241"]
    assert merge.down_revision == (
        "a8c139d27e4f",
        "91d8b15c4a22",
    )
    assert final_merge.down_revision == (
        "f14c0a3b8d72",
        "f19b62d3e740",
    )
