#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_DIR="$ROOT_DIR/data/locks"
LOCK_FILE="$LOCK_DIR/wechat-autogen.lock"

mkdir -p "$LOCK_DIR"

cd "$ROOT_DIR"

if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
        echo "[wechat-autogen] another run holds the lock, skip this run"
        exit 0
    fi
    /usr/bin/env node "$ROOT_DIR/scripts/run-wechat-autogen-once.js"
    exit $?
fi

FALLBACK_LOCK_DIR="${LOCK_FILE}.d"
if ! mkdir "$FALLBACK_LOCK_DIR" 2>/dev/null; then
    echo "[wechat-autogen] another run holds the fallback lock, skip this run"
    exit 0
fi

trap 'rmdir "$FALLBACK_LOCK_DIR" 2>/dev/null || true' EXIT
/usr/bin/env node "$ROOT_DIR/scripts/run-wechat-autogen-once.js"
