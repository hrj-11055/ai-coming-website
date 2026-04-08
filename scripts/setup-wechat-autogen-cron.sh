#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_SCRIPT="$ROOT_DIR/scripts/run-wechat-autogen-once.sh"
LOG_FILE="$ROOT_DIR/logs/wechat-autogen-cron.log"
ERR_FILE="$ROOT_DIR/logs/wechat-autogen-cron.err.log"
CRON_EXPR="* * * * *"
MARKER="# ai-coming wechat autogen job"
FEATURE_FLAG="$(printf '%s' "${WECHAT_AUTOGEN_ENABLED:-false}" | tr '[:upper:]' '[:lower:]')"

if [ "$FEATURE_FLAG" != "true" ]; then
  echo "WeChat autogen is now legacy and disabled by default." >&2
  echo "Set WECHAT_AUTOGEN_ENABLED=true only if you explicitly need to re-enable the old downstream workflow." >&2
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
echo "Note: the script itself only scans after ${WECHAT_AUTOGEN_START_HOUR:-9}:${WECHAT_AUTOGEN_START_MINUTE:-5} in ${WECHAT_AUTOGEN_TIMEZONE:-Asia/Shanghai}."
echo "Check with: crontab -l"
