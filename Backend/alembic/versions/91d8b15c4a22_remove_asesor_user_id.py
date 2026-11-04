"""Remove the user id from bank advisors.

Revision ID: 91d8b15c4a22
Revises: c4c18e9fa82b
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "91d8b15c4a22"
down_revision: Union[str, None] = "c4c18e9fa82b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE asesores_banco
            SET
                nombre = COALESCE(
                    NULLIF(TRIM(nombre), ''),
                    (SELECT nombre FROM usuario
                     WHERE usuario.id_usuario = asesores_banco.id_usuario)
                ),
                documento = COALESCE(
                    NULLIF(TRIM(documento), ''),
                    (SELECT documento FROM usuario
                     WHERE usuario.id_usuario = asesores_banco.id_usuario)
                ),
                email = COALESCE(
                    (SELECT email FROM usuario
                     WHERE usuario.id_usuario = asesores_banco.id_usuario),
                    NULLIF(TRIM(email), '')
                ),
                tipo_documento = COALESCE(
                    NULLIF(TRIM(tipo_documento), ''),
                    (SELECT tipo_documento.nombre_doc
                     FROM usuario
                     LEFT JOIN tipo_documento
                       ON tipo_documento.id_tipo_doc = usuario.id_tipo_doc
                     WHERE usuario.id_usuario = asesores_banco.id_usuario)
                )
            WHERE id_usuario IS NOT NULL
            """
        )
    )
    op.drop_index("id_usuario", table_name="asesores_banco")
    op.drop_column("asesores_banco", "id_usuario")


def downgrade() -> None:
    op.add_column(
        "asesores_banco",
        sa.Column("id_usuario", sa.Integer(), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE asesores_banco
            SET id_usuario = (
                SELECT MIN(usuario.id_usuario)
                FROM usuario
                WHERE LOWER(TRIM(usuario.email)) =
                      LOWER(TRIM(asesores_banco.email))
                  AND (
                      SELECT COUNT(*)
                      FROM asesores_banco AS otro_asesor
                      WHERE LOWER(TRIM(otro_asesor.email)) =
                            LOWER(TRIM(asesores_banco.email))
                  ) = 1
            )
            """
        )
    )
    op.create_index(
        "id_usuario",
        "asesores_banco",
        ["id_usuario"],
        unique=True,
    )
