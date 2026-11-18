#!/usr/bin/env bash
# Print one private IPv4 address that other devices on the LAN are likely to reach.
set -euo pipefail

is_wsl() {
  grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null
}

rank_ip() {
  case "$1" in
    192.168.*) echo 1 ;;
    10.*) echo 2 ;;
    172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) echo 3 ;;
    *) echo 9 ;;
  esac
}

collect_candidates() {
  if is_wsl && command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '169.254.*' } | Sort-Object @{Expression={ if (\$_.InterfaceAlias -match 'Wi-Fi|WLAN|Wireless') { 0 } elseif (\$_.InterfaceAlias -match 'Ethernet') { 1 } else { 2 } }} | Select-Object -ExpandProperty IPAddress" 2>/dev/null \
      | tr -d '\r' || true
  fi

  if command -v ip >/dev/null 2>&1; then
    ip -4 -o addr show scope global 2>/dev/null \
      | awk '$2 !~ /^(lo|docker|br-|veth)/ { split($4, parts, "/"); print parts[1] }' || true
  fi

  hostname -I 2>/dev/null | tr ' ' '\n' || true
}

best_ip=""
best_rank=9

while IFS= read -r ip; do
  [[ -z "${ip}" ]] && continue
  rank="$(rank_ip "${ip}")"
  if [[ "${rank}" -lt "${best_rank}" ]]; then
    best_rank="${rank}"
    best_ip="${ip}"
  fi
done < <(collect_candidates | awk 'NF && !seen[$0]++')

if [[ -z "${best_ip}" ]]; then
  exit 1
fi

printf '%s\n' "${best_ip}"
