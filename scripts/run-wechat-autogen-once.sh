#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_DIR="$ROOT_DIR/data/locks"
LOCK_FILE="$LOCK_DIR/wechat-autogen.lock"

mkdir -p "$LOCK_DIR"

if [ -f "$LOCK_FILE" ]; then
    echo "[wechat-autogen] lock exists, skip this run"
    exit 0
fi

trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

cd "$ROOT_DIR"
/usr/bin/env node "$ROOT_DIR/scripts/run-wechat-autogen-once.js"
