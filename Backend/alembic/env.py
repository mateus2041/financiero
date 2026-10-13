from logging.config import fileConfig
from pathlib import Path
import sys

from alembic import context
from sqlalchemy import inspect, text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from Backend.database.database import Base, DATABASE_URL, engine
from Backend import models as _models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    with engine.begin() as connection:
        command = getattr(config.cmd_opts, "cmd", None)
        is_upgrade = bool(command and command[0].__name__ == "upgrade")

        if is_upgrade:
            table_names = set(inspect(connection).get_table_names())
            has_version = "alembic_version" in table_names
            has_unversioned_tables = bool(table_names - {"alembic_version"})

            if has_unversioned_tables and not has_version:
                raise RuntimeError(
                    "La base de datos ya contiene tablas sin historial Alembic. "
                    "Verifique el esquema y marque explícitamente la revisión "
                    "inicial antes de ejecutar upgrade."
                )

            if has_unversioned_tables and has_version:
                version_rows = connection.execute(
                    text("SELECT version_num FROM alembic_version")
                ).all()
                if not version_rows:
                    raise RuntimeError(
                        "La tabla alembic_version está vacía y existen tablas "
                        "de aplicación. Verifique el esquema antes de continuar."
                    )

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
