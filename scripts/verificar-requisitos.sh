#!/usr/bin/env bash
set -uo pipefail

MIN_CPU=${MIN_CPU:-2}
MIN_RAM_MB=${MIN_RAM_MB:-4096}
MIN_DISK_GB=${MIN_DISK_GB:-20}
PORTS=${PORTS:-"3307 8000 3000"}
OS_ID=${OS_ID:-}
OS_VERSION_ID=${OS_VERSION_ID:-}
failures=0

if [[ -z "$OS_ID" && -r /etc/os-release ]]; then
    . /etc/os-release
    OS_ID=${ID:-unknown}
    OS_VERSION_ID=${VERSION_ID:-unknown}
fi

for value in "$MIN_CPU" "$MIN_RAM_MB" "$MIN_DISK_GB"; do
    if [[ ! "$value" =~ ^[0-9]+$ ]]; then
        echo "CPU, RAM and disk thresholds must be non-negative integers." >&2
        exit 2
    fi
done

check() {
    local name=$1 expected=$2 actual=$3 passed=$4
    printf '%-22s %-18s %-22s %s\n' "$name" "$expected" "$actual" "$([[ "$passed" == true ]] && echo CUMPLE || echo 'NO CUMPLE')"
    [[ "$passed" == true ]] || failures=$((failures + 1))
}

printf '%-22s %-18s %-22s %s\n' REQUISITO ESPERADO ENCONTRADO ESTADO
printf '%s\n' "------------------------------------------------------------------------"

cpu_count=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 0)
cpu_ok=false
[[ "$cpu_count" =~ ^[0-9]+$ ]] && (( cpu_count >= MIN_CPU )) && cpu_ok=true
check "CPU" ">= $MIN_CPU" "$cpu_count" "$cpu_ok"

ram_mb=$(awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null || echo 0)
ram_ok=false
[[ "$ram_mb" =~ ^[0-9]+$ ]] && (( ram_mb >= MIN_RAM_MB )) && ram_ok=true
check "RAM (MB)" ">= $MIN_RAM_MB" "$ram_mb" "$ram_ok"

disk_gb=$(df -Pk . 2>/dev/null | awk 'NR == 2 { print int($4 / 1024 / 1024) }')
disk_gb=${disk_gb:-0}
disk_ok=false
[[ "$disk_gb" =~ ^[0-9]+$ ]] && (( disk_gb >= MIN_DISK_GB )) && disk_ok=true
check "Disco libre (GB)" ">= $MIN_DISK_GB" "$disk_gb" "$disk_ok"

architecture=$(uname -m 2>/dev/null || echo unknown)
architecture_ok=false
[[ "$architecture" == x86_64 || "$architecture" == aarch64 ]] && architecture_ok=true
check "Arquitectura" "x86_64/aarch64" "$architecture" "$architecture_ok"

os_ok=false
if [[ "$OS_ID" == ubuntu && "$OS_VERSION_ID" =~ ^([0-9]+) ]]; then
    (( BASH_REMATCH[1] >= 22 )) && os_ok=true
fi
check "Sistema operativo" "Ubuntu >= 22.04" "$OS_ID $OS_VERSION_ID" "$os_ok"

docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)
docker_ok=false
if [[ "$docker_version" =~ ^([0-9]+)\. ]]; then
    (( BASH_REMATCH[1] >= 24 )) && docker_ok=true
fi
check "Docker Engine" ">= 24.0" "${docker_version:-no disponible}" "$docker_ok"

for port in $PORTS; do
    if [[ ! "$port" =~ ^[0-9]+$ ]] || (( port < 1 || port > 65535 )); then
        echo "Invalid port in PORTS: $port" >&2
        exit 2
    fi
    port_ok=true
    if command -v ss >/dev/null 2>&1; then
        ss -H -ltn "( sport = :$port )" 2>/dev/null | grep -q . && port_ok=false
    elif command -v netstat >/dev/null 2>&1; then
        netstat -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${port}$" && port_ok=false
    else
        printf 'Cannot check port %s: ss or netstat is required.\n' "$port" >&2
        exit 2
    fi
    check "Puerto $port" "libre" "$( [[ "$port_ok" == true ]] && echo libre || echo ocupado )" "$port_ok"
done

if (( failures > 0 )); then
    printf 'RESULTADO: no cumple (%s requisito(s) fallidos).\n' "$failures"
    exit 1
fi

printf '%s\n' "RESULTADO: cumple los requisitos configurados."
