#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

if [[ "${1-}" == "--purge" ]]; then
  echo "Remove everything, including the database?"
  read -r -p "Are you sure? [y/N] " ans
  [[ "${ans}" == "y" || "${ans}" == "Y" ]] || exit 1
  "${COMPOSE[@]}" down -v
else
  "${COMPOSE[@]}" down
fi

echo ""
echo "=> down"
