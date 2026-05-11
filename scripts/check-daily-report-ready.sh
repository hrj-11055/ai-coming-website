#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="${REPORT_SOURCE_DIR:-/var/www/json/report}"
CHECK_DATE="${REPORT_CHECK_DATE:-$(date +%F)}"
LOG_FILE="${REPORT_CHECK_LOG_FILE:-/var/www/ai-coming-website/logs/daily-report-watchdog.log}"
REMEDY_SERVICE="${REPORT_REMEDY_SERVICE:-ai-rss-daily.service}"
SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-systemctl}"
REPORT_FILE="$SOURCE_DIR/$CHECK_DATE.json"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

if [[ -s "$REPORT_FILE" ]]; then
    log "OK $CHECK_DATE.json exists: $REPORT_FILE"
    exit 0
fi

log "MISSING $CHECK_DATE.json: $REPORT_FILE"
log "START remedy service: $REMEDY_SERVICE"
"$SYSTEMCTL_BIN" start "$REMEDY_SERVICE"
log "REMEDY requested: $REMEDY_SERVICE"
