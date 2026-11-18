#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

ACTION="${1:-build}"
COMPOSE=(docker compose -f docker-compose.docs.yml)

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is required to build the documentation."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed, but the daemon is not running."
  exit 1
fi

case "${ACTION}" in
  build)
    "${COMPOSE[@]}" run --rm --build docs npm run build
    echo "Documentation written to docs/build/index.html"
    echo "Open that file in a browser. No server and no port are required."
    ;;
  *)
    echo "Usage: scripts/docs.sh build" >&2
    exit 1
    ;;
esac
