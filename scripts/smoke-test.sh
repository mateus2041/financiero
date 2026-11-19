#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"
BASE_URL="${BASE_URL%/}"

curl -fsS "$BASE_URL/health/live" >/dev/null
curl -fsS "$BASE_URL/health/ready" >/dev/null
curl -fsS "$BASE_URL/api/version" >/dev/null
