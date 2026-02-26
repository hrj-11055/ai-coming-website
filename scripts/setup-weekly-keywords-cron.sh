#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$ROOT_DIR/scripts/run-weekly-keywords-once.sh"
LOG_FILE="$ROOT_DIR/logs/weekly-keywords-cron.log"
ERR_FILE="$ROOT_DIR/logs/weekly-keywords-cron.err.log"
CRON_EXPR="0 8 * * 1"
MARKER="# ai-coming weekly keywords job"

mkdir -p "$ROOT_DIR/logs"

CRON_LINE="$CRON_EXPR cd $ROOT_DIR && $RUN_SCRIPT >> $LOG_FILE 2>> $ERR_FILE $MARKER"

TMP_FILE="$(mktemp)"
crontab -l 2>/dev/null | sed "/$MARKER/d" > "$TMP_FILE" || true
printf "%s\n" "$CRON_LINE" >> "$TMP_FILE"
crontab "$TMP_FILE"
rm -f "$TMP_FILE"

echo "Installed cron job: $CRON_LINE"
echo "Check with: crontab -l"
