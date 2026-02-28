#!/usr/bin/env bash

# Monitor /var/www/json/report for new JSON reports and copy them to data/
# using backend-compatible names: news-YYYY-MM-DD.json.

set -euo pipefail

SOURCE_DIR="${REPORT_SOURCE_DIR:-/var/www/json/report}"
TARGET_DIR="${TARGET_DATA_DIR:-/var/www/ai-coming-website/data}"
LOG_FILE="${REPORT_WATCH_LOG_FILE:-/var/www/ai-coming-website/logs/report-watch-copy.log}"
POLL_INTERVAL="${REPORT_WATCH_POLL_INTERVAL:-15}"

ONCE_MODE=0
if [[ "${1:-}" == "--once" ]]; then
    ONCE_MODE=1
fi

mkdir -p "$TARGET_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

extract_date() {
    local base="$1"
    if [[ "$base" =~ ^news-([0-9]{4}-[0-9]{2}-[0-9]{2})\.json$ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    if [[ "$base" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})\.json$ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    return 1
}

is_valid_json() {
    local file="$1"
    if command -v jq >/dev/null 2>&1; then
        jq empty "$file" >/dev/null 2>&1
        return $?
    fi
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$file" >/dev/null 2>&1
}

payload_shape() {
    local file="$1"
    if command -v jq >/dev/null 2>&1; then
        jq -r 'if type=="array" then "array" elif (type=="object" and (.articles|type=="array")) then "object-articles" else "unsupported" end' "$file" 2>/dev/null || echo "invalid"
        return
    fi
    node -e '
const fs = require("fs");
try {
  const raw = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (Array.isArray(raw)) { console.log("array"); process.exit(0); }
  if (raw && typeof raw === "object" && Array.isArray(raw.articles)) { console.log("object-articles"); process.exit(0); }
  console.log("unsupported");
} catch {
  console.log("invalid");
}
' "$file"
}

copy_if_needed() {
    local source="$1"
    local base
    base="$(basename "$source")"

    local date
    if ! date="$(extract_date "$base")"; then
        log "SKIP filename not compatible with backend date patterns: $base"
        return 0
    fi

    if ! is_valid_json "$source"; then
        log "SKIP invalid JSON: $base"
        return 0
    fi

    local shape
    shape="$(payload_shape "$source")"
    if [[ "$shape" == "invalid" || "$shape" == "unsupported" ]]; then
        log "SKIP unsupported payload (need array or object.articles[]): $base"
        return 0
    fi

    local target="$TARGET_DIR/news-$date.json"

    if [[ ! -f "$target" || "$source" -nt "$target" ]]; then
        cp -f "$source" "$target"
        chmod 644 "$target" 2>/dev/null || true
        log "COPIED $base -> $(basename "$target") (shape=$shape)"
    fi
}

scan_once() {
    shopt -s nullglob
    local files=("$SOURCE_DIR"/*.json)
    if (( ${#files[@]} == 0 )); then
        return 0
    fi
    for file in "${files[@]}"; do
        copy_if_needed "$file"
    done
}

if [[ ! -d "$SOURCE_DIR" ]]; then
    log "ERROR source dir not found: $SOURCE_DIR"
    exit 1
fi

log "START watch report dir: $SOURCE_DIR -> $TARGET_DIR (once=$ONCE_MODE)"
scan_once

if (( ONCE_MODE == 1 )); then
    log "DONE once mode"
    exit 0
fi

if command -v inotifywait >/dev/null 2>&1; then
    log "MODE inotifywait (events: create,close_write,moved_to)"
    while inotifywait -qq -e create,close_write,moved_to "$SOURCE_DIR"; do
        scan_once
    done
else
    log "MODE polling every ${POLL_INTERVAL}s (inotifywait not found)"
    while true; do
        scan_once
        sleep "$POLL_INTERVAL"
    done
fi

