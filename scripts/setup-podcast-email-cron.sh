#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$ROOT_DIR/scripts/run-podcast-email-once.sh"
LOG_FILE="$ROOT_DIR/logs/podcast-email-cron.log"
ERR_FILE="$ROOT_DIR/logs/podcast-email-cron.err.log"
CRON_EXPR="*/10 * * * *"
MARKER="# ai-coming podcast email retry job"
FEATURE_FLAG="$(printf '%s' "${PODCAST_EMAIL_CRON_ENABLED:-false}" | tr '[:upper:]' '[:lower:]')"

if [ "$FEATURE_FLAG" != "true" ]; then
  echo "Podcast email cron is legacy and disabled by default." >&2
  echo "The current downstream workflow is the WeChat daily newspic draft cron." >&2
  echo "Set PODCAST_EMAIL_CRON_ENABLED=true only if you explicitly need the legacy retry job." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/logs"

CRON_LINE="$CRON_EXPR cd $ROOT_DIR && $RUN_SCRIPT >> $LOG_FILE 2>> $ERR_FILE $MARKER"

TMP_FILE="$(mktemp)"
crontab -l 2>/dev/null | sed "/$MARKER/d" > "$TMP_FILE" || true
printf "%s\n" "$CRON_LINE" >> "$TMP_FILE"
crontab "$TMP_FILE"
rm -f "$TMP_FILE"

echo "Installed cron job: $CRON_LINE"
echo "Check with: crontab -l"
