#!/usr/bin/env bash
set -Eeuo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

: "${BACKUP_AGE_RECIPIENT:?Set BACKUP_AGE_RECIPIENT to an age public recipient}"
command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
command -v age >/dev/null || { echo "age is required" >&2; exit 1; }

backup_dir=${BACKUP_DIR:-"$repo_root/backups"}
mkdir -p "$backup_dir"
backup_file="$backup_dir/billetera-$(date -u +%Y%m%dT%H%M%SZ).sql.gz.age"
temporary_file=$(mktemp "$backup_dir/.billetera-backup.XXXXXX")
trap 'rm -f -- "$temporary_file"' EXIT

docker compose exec -T db sh -c \
    'exec mysqldump --user=root --password="$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
    | gzip -c \
    | age -r "$BACKUP_AGE_RECIPIENT" > "$temporary_file"

chmod 600 "$temporary_file"
mv -- "$temporary_file" "$backup_file"
trap - EXIT
printf 'Encrypted backup written: %s\n' "$backup_file"
