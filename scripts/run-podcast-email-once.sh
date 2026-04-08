#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="$ROOT_DIR/.podcast-email.lock"

if command -v flock >/dev/null 2>&1; then
  mkdir -p "$(dirname "$LOCK_FILE")"
  flock -n "$LOCK_FILE" /usr/bin/env bash -c "cd \"$ROOT_DIR\" && /usr/bin/env node \"$ROOT_DIR/scripts/run-podcast-email-once.js\""
else
  if [ -e "$LOCK_FILE" ]; then
    echo "[podcast-email] lock exists, skip this run"
    exit 0
  fi

  touch "$LOCK_FILE"
  trap 'rm -f "$LOCK_FILE"' EXIT
  cd "$ROOT_DIR"
  /usr/bin/env node "$ROOT_DIR/scripts/run-podcast-email-once.js"
fi
