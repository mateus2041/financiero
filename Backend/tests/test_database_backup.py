import gzip
import io

import pytest

import scripts.database_backup as backup_service
from scripts.database_backup import create_backup, verify_backup


def test_create_backup_compresses_dump_and_does_not_overwrite(tmp_path, monkeypatch):
    class DumpProcess:
        args = ["docker", "compose", "exec", "db", "mysqldump"]

        def __init__(self):
            self.stdout = io.BytesIO(b"-- synthetic database dump\n")

        def __enter__(self):
            return self

        def __exit__(self, exception_type, exception, traceback):
            self.stdout.close()
            return False

        def wait(self):
            return 0

    monkeypatch.setattr(
        backup_service.subprocess,
        "Popen",
        lambda *args, **kwargs: DumpProcess(),
    )
    destination = tmp_path / "database.sql.gz"

    result = create_backup(destination)

    assert result == destination
    with gzip.open(result, "rb") as source:
        assert source.read() == b"-- synthetic database dump\n"
    with pytest.raises(FileExistsError):
        create_backup(destination)


def test_verify_backup_accepts_valid_gzip(tmp_path):
    backup = tmp_path / "database.sql.gz"
    with gzip.open(backup, "wb") as target:
        target.write(b"CREATE TABLE test (id INTEGER);\n")

    assert verify_backup(backup) == backup


def test_verify_backup_rejects_truncated_file(tmp_path):
    backup = tmp_path / "database.sql.gz"
    backup.write_bytes(b"not a gzip archive")

    with pytest.raises((gzip.BadGzipFile, EOFError)):
        verify_backup(backup)
