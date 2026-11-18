#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

MODE="${1:-local}"
if [[ "${MODE}" != "local" && "${MODE}" != "wifi" ]]; then
  echo "Usage: scripts/dev.sh [local|wifi]" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is not available. Install Docker Desktop or the Compose plugin."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed, but the daemon is not running."
  echo "Start Docker Desktop, then run this command again."
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.dev.yml)

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

LAN_IP=""
if [[ "${MODE}" == "wifi" ]]; then
  if ! LAN_IP="$(bash "${ROOT}/scripts/detect-lan-ip.sh")"; then
    LAN_IP=""
  fi
  if [[ -n "${LAN_IP}" ]]; then
    export NEXT_PUBLIC_API_URL="http://${LAN_IP}:8000"
    export BACKEND_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://${LAN_IP}:3000"
    export ALLOWED_DEV_ORIGINS="${LAN_IP}"
  fi
fi

stopping=0
cleanup() {
  if [[ "${stopping}" -eq 1 ]]; then
    return
  fi
  stopping=1
  trap '' INT TERM
  echo ""
  echo "Shutting down the LabOS development environment..."
  echo "Waiting for containers to stop (up to 30 seconds)..."
  "${COMPOSE[@]}" down --timeout 30 --remove-orphans || true
  echo "LabOS development environment has stopped."
}
trap cleanup EXIT

echo "Starting the LabOS development environment (${MODE})."
echo ""
echo "Frontend:"
echo "  http://localhost:3000"
if [[ "${MODE}" == "wifi" && -n "${LAN_IP}" ]]; then
  echo "  http://${LAN_IP}:3000"
fi
echo "Backend:"
echo "  http://localhost:8000"
if [[ "${MODE}" == "wifi" && -n "${LAN_IP}" ]]; then
  echo "  http://${LAN_IP}:8000"
fi
echo "API docs:"
echo "  http://localhost:8000/docs"
if [[ "${MODE}" == "wifi" && -n "${LAN_IP}" ]]; then
  echo "  http://${LAN_IP}:8000/docs"
fi
echo ""

if [[ "${MODE}" == "wifi" ]]; then
  if [[ -z "${LAN_IP}" ]]; then
    echo "Could not detect a LAN address. Find the Wi-Fi IPv4 address in your system settings"
    echo "and open http://<that-address>:3000 from another device."
  elif grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null && [[ "${LAN_IP}" =~ ^172\. ]]; then
    echo "The detected address looks like a WSL virtual adapter."
    echo "If another device cannot connect, use the IPv4 address shown by Windows for Wi-Fi."
  fi
  echo "If another device cannot open the LAN URLs:"
  echo "  - Allow inbound TCP 3000 and 8000 in the firewall."
  echo "  - Keep both devices on the same Wi-Fi. Guest networks often isolate clients."
  echo "  - Disconnect from a VPN and try again."
  echo ""
fi

echo "Service logs follow. Press Ctrl+C to stop."
echo ""

set +e
"${COMPOSE[@]}" up --build --remove-orphans
status=$?
set -e
# Ctrl+C stops Compose with 130. The EXIT trap already shuts the stack down.
if [[ "${status}" -eq 130 ]]; then
  status=0
fi
exit "${status}"
