#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$ROOT_DIR/logs/health-watchdog.log"
ERR_FILE="$ROOT_DIR/logs/health-watchdog.err.log"
CRON_EXPR="${HEALTH_WATCHDOG_CRON_EXPR:-* * * * *}"
MARKER="# ai-coming health watchdog"
APP_NAME="${HEALTH_WATCHDOG_PM2_APP:-ai-news-system}"
HEALTH_URL="${HEALTH_WATCHDOG_URL:-http://127.0.0.1:3000/api/health}"
TIMEOUT_SECONDS="${HEALTH_WATCHDOG_TIMEOUT_SECONDS:-5}"

mkdir -p "$ROOT_DIR/logs"

WATCHDOG_CMD="cd $ROOT_DIR && timeout ${TIMEOUT_SECONDS}s curl -fsS $HEALTH_URL >/dev/null || { echo \"[\$(date -Is)] health check failed, restarting $APP_NAME\"; pm2 restart $APP_NAME --update-env; }"
CRON_LINE="$CRON_EXPR $WATCHDOG_CMD >> $LOG_FILE 2>> $ERR_FILE $MARKER"

TMP_FILE="$(mktemp)"
crontab -l 2>/dev/null | sed "/$MARKER/d" > "$TMP_FILE" || true
printf "%s\n" "$CRON_LINE" >> "$TMP_FILE"
crontab "$TMP_FILE"
rm -f "$TMP_FILE"

echo "Installed cron job: $CRON_LINE"
echo "Check with: crontab -l | grep 'ai-coming health watchdog'"
