#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p server/storage/
chmod 777 server/storage/translations.json
chown -R 33:33 server/storage
chmod -R u+rwX,g+rwX server/storage

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

# --- require .env with needed keys (root-level .env used by Compose) ---
if [[ ! -f .env ]]; then
  cat >&2 <<'EOF'
ERROR: .env file not found in project root.

Create .env with at least:
  OPENAI_API_KEY=sk-...
  APP_TIMEZONE=Europe/Warsaw
EOF
  exit 1
fi

# shellcheck source=/dev/null
set -a
. ./.env
set +a

OPENAI="${OPENAI_API_KEY:-}"
TZV="${APP_TIMEZONE:-}"

[[ -n "$OPENAI" ]] || die "OPENAI_API_KEY is empty or missing in .env"
[[ -n "$TZV"   ]] || die "APP_TIMEZONE is empty or missing in .env"

# --- detect dev/prod mode by presence of override file ---
MODE="production"
if [[ -f docker-compose.override.yaml || -f docker-compose.override.yml ]]; then
  MODE="development"
  echo "Detected docker-compose.override.* → running in DEVELOPMENT mode (APP_ENV=local)."
  echo "To run in production mode, temporarily move or remove the override file."
else
  echo "No override file detected → running in PRODUCTION mode (APP_ENV=production)."
fi
echo "Starting containers (${MODE})..."
"${COMPOSE[@]}" up -d

echo
"${COMPOSE[@]}" ps
echo

# --- friendly endpoint hint (local HTTP port from compose) ---
if [[ "$MODE" == "development" ]]; then
  echo "=> DEV: http://localhost:8081/translations/stats"
else
  echo "=> PROD: service is up; if you front it with Caddy, use your HTTPS domain."
  echo "   Possibly: https://egzamin.webscrapp.rocks/translations/stats"
fi
