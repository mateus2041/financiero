from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def test_alembic_migrations_have_a_single_head_and_safe_merge_order():
    project_root = Path(__file__).resolve().parents[2]
    config = Config(str(project_root / "Backend" / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    merge = script.get_revision("d3a6f1c890ab")

    assert script.get_heads() == ["d3a6f1c890ab"]
    assert merge.down_revision == (
        "a8c139d27e4f",
        "91d8b15c4a22",
    )
