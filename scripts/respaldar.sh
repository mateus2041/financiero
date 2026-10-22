#!/usr/bin/env bash
# Respaldo logico de MySQL para el servicio db de compose.yml.
# Uso desde la raiz: DESTINO="$HOME/backups-billetera" bash scripts/respaldar.sh
# MAX_RESPALDOS es un umbral de revision; este script nunca elimina respaldos.

set -euo pipefail
umask 077

SERVICIO="${SERVICIO:-db}"
DB_NAME="${DB_NAME:-billetera}"
DESTINO="${DESTINO:-$HOME/backups-billetera}"
MAX_RESPALDOS="${MAX_RESPALDOS:-7}"

if [[ ! "$MAX_RESPALDOS" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: MAX_RESPALDOS debe ser un entero positivo." >&2
  exit 2
fi

if [[ -e "$DESTINO" && ! -d "$DESTINO" ]]; then
  echo "ERROR: DESTINO existe y no es un directorio." >&2
  exit 2
fi
if [[ ! -d "$DESTINO" ]]; then
  mkdir -p -- "$DESTINO"
  chmod 700 -- "$DESTINO"
fi

marca_tiempo="$(date -u +%Y%m%dT%H%M%SZ)"
archivo="$DESTINO/${DB_NAME}-${marca_tiempo}-$$.sql"
temporal="$(mktemp "$DESTINO/.${DB_NAME}.XXXXXX.tmp")"
trap 'rm -f -- "$temporal"' EXIT

if ! docker compose exec -T "$SERVICIO" sh -c \
  'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --events "$1"' \
  sh "$DB_NAME" > "$temporal"; then
  echo "ERROR: fallo mysqldump; no se creo un respaldo valido." >&2
  exit 1
fi

if [[ ! -s "$temporal" ]]; then
  echo "ERROR: mysqldump genero un archivo vacio." >&2
  exit 1
fi

mv -n -- "$temporal" "$archivo"
if [[ -e "$temporal" ]]; then
  echo "ERROR: no se pudo crear el archivo sin sobrescribir uno existente." >&2
  exit 1
fi
trap - EXIT
chmod 600 -- "$archivo"
sha256sum -- "$archivo"

cantidad="$(find "$DESTINO" -maxdepth 1 -type f -name "${DB_NAME}-*.sql" | wc -l)"
echo "OK: respaldo creado en $archivo"
if (( cantidad > MAX_RESPALDOS )); then
  echo "AVISO: hay $cantidad respaldos y el umbral de revision es $MAX_RESPALDOS."
  echo "No se elimino ningun archivo; aplicar la politica de retencion con aprobacion."
else
  echo "Respaldos en destino: $cantidad (umbral de revision: $MAX_RESPALDOS)"
fi
