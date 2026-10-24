"""Add an index for paginated user listings."""

from alembic import op


revision = "c4c18e9fa82b"
down_revision = "f7c2d5b184a0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_usuario_rol_id_usuario",
        "usuario",
        ["rol", "id_usuario"],
    )


def downgrade():
    op.drop_index("ix_usuario_rol_id_usuario", table_name="usuario")
