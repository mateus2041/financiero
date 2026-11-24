"""Normalize rows created before schema migrations.

Revision ID: f7c2d5b184a0
Revises: e8698959a1e4
Create Date: 2026-10-13
"""
import secrets

from alembic import op
import sqlalchemy as sa


revision = "f7c2d5b184a0"
down_revision = "e8698959a1e4"
branch_labels = None
depends_on = None


def _new_account_number(connection):
    while True:
        number = str(secrets.randbelow(9_000_000_000_000_000) + 1_000_000_000_000_000)
        exists = connection.execute(
            sa.text("SELECT 1 FROM cuentas WHERE numero_cuenta = :number LIMIT 1"),
            {"number": number},
        ).first()
        if exists is None:
            return number


def upgrade():
    connection = op.get_bind()

    connection.execute(sa.text(
        "UPDATE cuentas SET fecha_estado = CURRENT_TIMESTAMP "
        "WHERE estado = 'bloqueada' AND fecha_estado IS NULL"
    ))
    connection.execute(sa.text(
        "UPDATE asesores_banco "
        "SET tipo_documento = 'Cedula de ciudadania' "
        "WHERE tipo_documento IS NULL OR tipo_documento = ''"
    ))

    account_ids = connection.execute(sa.text(
        "SELECT id_cuenta FROM cuentas "
        "WHERE numero_cuenta IS NULL OR numero_cuenta = ''"
    )).scalars().all()

    for account_id in account_ids:
        connection.execute(
            sa.text(
                "UPDATE cuentas SET numero_cuenta = :number "
                "WHERE id_cuenta = :account_id"
            ),
            {
                "number": _new_account_number(connection),
                "account_id": account_id,
            },
        )


def downgrade():
    pass
