import argparse
from datetime import datetime, timezone
import gzip
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import zlib


ROOT = Path(__file__).resolve().parents[1]
BACKUP_DIRECTORY = ROOT / "backups"


def _database_command(operation):
    database_shell = (
        'export MYSQL_PWD="$MYSQL_PASSWORD"; '
        f'exec {operation} -h 127.0.0.1 -u "$MYSQL_USER" "$MYSQL_DATABASE"'
    )
    return [
        "docker",
        "compose",
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        database_shell,
    ]


def verify_backup(path):
    backup_path = Path(path)
    with gzip.open(backup_path, "rb") as source:
        while source.read(1024 * 1024):
            pass
    return backup_path


def create_backup(output_path=None):
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = (
        Path(output_path).expanduser().resolve()
        if output_path
        else BACKUP_DIRECTORY / f"billetera-{timestamp}.sql.gz"
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise FileExistsError(f"El archivo de respaldo ya existe: {destination}")

    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{destination.name}.",
        suffix=".tmp",
        dir=destination.parent,
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as target:
            with gzip.GzipFile(fileobj=target, mode="wb", mtime=0) as compressed:
                with subprocess.Popen(
                    _database_command(
                        "mysqldump --single-transaction --quick "
                        "--skip-lock-tables --no-tablespaces --add-drop-table"
                    ),
                    cwd=ROOT,
                    stdout=subprocess.PIPE,
                ) as process:
                    if process.stdout is None:
                        raise RuntimeError("No se pudo abrir la salida de mysqldump.")
                    shutil.copyfileobj(process.stdout, compressed)
                    return_code = process.wait()
                    if return_code:
                        raise subprocess.CalledProcessError(
                            return_code,
                            process.args,
                        )

        verify_backup(temporary_path)
        os.chmod(temporary_path, 0o600)
        os.replace(temporary_path, destination)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()
    return destination


def restore_backup(path):
    source_path = verify_backup(path).expanduser().resolve()
    confirmation = input(
        "La restauracion modifica las tablas existentes. "
        "Escribe RESTAURAR para continuar: "
    )
    if confirmation != "RESTAURAR":
        raise ValueError("Restauracion cancelada; no se modifico la base de datos.")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safety_copy = create_backup(
        BACKUP_DIRECTORY / f"antes-de-restaurar-{timestamp}.sql.gz"
    )
    print(f"Respaldo preventivo creado: {safety_copy}")
    with gzip.open(source_path, "rb") as source:
        subprocess.run(
            _database_command("mysql"),
            cwd=ROOT,
            stdin=source,
            check=True,
        )
    return safety_copy


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Crea, valida o restaura respaldos comprimidos de MySQL."
    )
    commands = parser.add_subparsers(dest="action", required=True)
    backup_parser = commands.add_parser("backup", help="Crear un respaldo MySQL.")
    backup_parser.add_argument("--output", type=Path)
    verify_parser = commands.add_parser("verify", help="Validar un archivo gzip.")
    verify_parser.add_argument("file", type=Path)
    restore_parser = commands.add_parser(
        "restore",
        help="Restaurar un respaldo tras crear una copia preventiva.",
    )
    restore_parser.add_argument("file", type=Path)
    args = parser.parse_args(argv)

    try:
        if args.action == "backup":
            result = create_backup(args.output)
        elif args.action == "verify":
            result = verify_backup(args.file)
        else:
            result = restore_backup(args.file)
    except (
        EOFError,
        FileExistsError,
        FileNotFoundError,
        IsADirectoryError,
        NotADirectoryError,
        PermissionError,
        ValueError,
        gzip.BadGzipFile,
        zlib.error,
        subprocess.CalledProcessError,
    ) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Operación completada: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
