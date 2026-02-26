#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOCK_FILE="$ROOT_DIR/.weekly-keywords.lock"

mkdir -p "$LOG_DIR"

if command -v flock >/dev/null 2>&1; then
  flock -n "$LOCK_FILE" /usr/bin/env bash -c "cd \"$ROOT_DIR\" && /usr/bin/env node \"$ROOT_DIR/scripts/run-weekly-keywords-once.js\""
else
  if [[ -e "$LOCK_FILE" ]]; then
    echo "[weekly-keywords] lock exists, skip this run"
    exit 0
  fi
  trap 'rm -f "$LOCK_FILE"' EXIT
  touch "$LOCK_FILE"
  cd "$ROOT_DIR"
  /usr/bin/env node "$ROOT_DIR/scripts/run-weekly-keywords-once.js"
fi
