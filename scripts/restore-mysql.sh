#!/usr/bin/env bash
set -Eeuo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

if [[ $# -ne 1 || ! -f "$1" ]]; then
    echo "Usage: $0 <encrypted-backup.sql.gz.age>" >&2
    exit 2
fi
: "${RESTORE_DATABASE:?Set RESTORE_DATABASE to a new, empty database name}"
if [[ ! "$RESTORE_DATABASE" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "RESTORE_DATABASE may contain only letters, digits and underscores" >&2
    exit 2
fi
command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
command -v age >/dev/null || { echo "age is required" >&2; exit 1; }
command -v gzip >/dev/null || { echo "gzip is required" >&2; exit 1; }

existing_database=$(docker compose exec -T db sh -c \
    'exec mysql --user=root --password="$MYSQL_ROOT_PASSWORD" --batch --skip-column-names -e "$1"' \
    _ "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$RESTORE_DATABASE'")
if [[ -n "$existing_database" ]]; then
    echo "Refusing to restore over existing database '$RESTORE_DATABASE'." >&2
    exit 1
fi

docker compose exec -T db sh -c \
    'exec mysql --user=root --password="$MYSQL_ROOT_PASSWORD" -e "$1"' \
    _ "CREATE DATABASE \`$RESTORE_DATABASE\` CHARACTER SET utf8mb4"

age -d "$1" \
    | gzip -dc \
    | docker compose exec -T db sh -c \
        'exec mysql --user=root --password="$MYSQL_ROOT_PASSWORD" --database="$1"' \
        _ "$RESTORE_DATABASE"

printf 'Restore completed into new database: %s\n' "$RESTORE_DATABASE"
