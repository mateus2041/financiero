"""Reconcile the legacy MySQL schema without removing existing data."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "a8c139d27e4f"
down_revision = "c4c18e9fa82b"
branch_labels = None
depends_on = None


_REQUIRED_COLUMNS = {
    "administradores": {"id_usuario"},
    "asesores_banco": {"id_usuario", "tipo_documento"},
    "cuentas": {"id_cuenta", "numero_cuenta", "saldo", "estado", "fecha_estado"},
    "notificaciones": {"leido"},
    "tarjetas": {"estado"},
    "usuario": {"email"},
}
_REQUIRED_TABLES = {
    "administradores",
    "asesores_banco",
    "control_topes_breb",
    "cuentas",
    "llaves_breb",
    "notificaciones",
    "tarjetas",
    "tipo_documento",
    "transacciones",
    "transferencias_breb",
    "usuario",
}


def _validate_existing_schema(connection):
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    missing_tables = _REQUIRED_TABLES - tables
    if missing_tables:
        raise RuntimeError(
            "No se puede adoptar el esquema existente; faltan tablas: "
            + ", ".join(sorted(missing_tables))
        )

    missing_columns = []
    for table, required_columns in _REQUIRED_COLUMNS.items():
        existing_columns = {column["name"] for column in inspector.get_columns(table)}
        missing_columns.extend(
            f"{table}.{column}"
            for column in required_columns - existing_columns
        )
    if missing_columns:
        raise RuntimeError(
            "No se puede adoptar el esquema existente; faltan columnas: "
            + ", ".join(sorted(missing_columns))
        )

    null_emails = connection.execute(
        sa.text("SELECT COUNT(*) FROM usuario WHERE email IS NULL")
    ).scalar_one()
    if null_emails:
        raise RuntimeError(
            "No se puede exigir email no nulo; hay usuarios sin correo."
        )

    duplicate_advisors = connection.execute(
        sa.text(
            "SELECT COUNT(*) FROM ("
            "SELECT id_usuario FROM asesores_banco "
            "WHERE id_usuario IS NOT NULL "
            "GROUP BY id_usuario HAVING COUNT(*) > 1"
            ") AS duplicados"
        )
    ).scalar_one()
    if duplicate_advisors:
        raise RuntimeError(
            "No se puede crear el índice único; hay asesores con id_usuario repetido."
        )

    return inspector


def _set_nullable(inspector, table, column, column_type, nullable):
    definition = next(
        item for item in inspector.get_columns(table) if item["name"] == column
    )
    if definition["nullable"] == nullable:
        return

    op.alter_column(
        table,
        column,
        existing_type=column_type,
        nullable=nullable,
    )


def upgrade():
    connection = op.get_bind()
    inspector = _validate_existing_schema(connection)

    _set_nullable(
        inspector, "administradores", "id_usuario", sa.Integer(), True
    )
    _set_nullable(
        inspector, "cuentas", "numero_cuenta", sa.String(length=16), True
    )
    _set_nullable(
        inspector, "cuentas", "saldo", sa.DECIMAL(precision=15, scale=2), True
    )
    _set_nullable(
        inspector,
        "cuentas",
        "estado",
        sa.Enum("activa", "inactiva", "bloqueada", name="estado_cuenta_enum"),
        True,
    )
    _set_nullable(inspector, "notificaciones", "leido", sa.Boolean(), True)
    _set_nullable(
        inspector,
        "tarjetas",
        "estado",
        sa.Enum("activa", "bloqueada", "expirada", name="estado_tarjeta_enum"),
        True,
    )
    _set_nullable(
        inspector, "usuario", "email", sa.String(length=100), False
    )

    advisor_indexes = inspector.get_indexes("asesores_banco")
    has_advisor_unique_index = any(
        index["unique"] and index["column_names"] == ["id_usuario"]
        for index in advisor_indexes
    )
    if not has_advisor_unique_index:
        op.create_index(
            "id_usuario",
            "asesores_banco",
            ["id_usuario"],
            unique=True,
        )


def downgrade():
    raise RuntimeError(
        "Esta migración adopta esquemas heredados y no se puede revertir "
        "automáticamente sin conocer el esquema original."
    )
