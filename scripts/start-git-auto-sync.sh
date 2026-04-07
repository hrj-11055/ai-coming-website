#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
LOG_FILE="${LOG_DIR}/git-auto-sync.log"
PID_FILE="${LOG_DIR}/git-auto-sync.pid"

mkdir -p "${LOG_DIR}"

if [[ -f "${PID_FILE}" ]]; then
    EXISTING_PID="$(cat "${PID_FILE}")"
    if kill -0 "${EXISTING_PID}" 2>/dev/null; then
        echo "git-auto-sync 已在运行，PID=${EXISTING_PID}"
        exit 0
    fi
    rm -f "${PID_FILE}"
fi

nohup node "${ROOT_DIR}/scripts/git-auto-sync.js" >> "${LOG_FILE}" 2>&1 &
AUTO_SYNC_PID=$!
echo "${AUTO_SYNC_PID}" > "${PID_FILE}"

echo "git-auto-sync 已启动，PID=${AUTO_SYNC_PID}"
echo "日志文件: ${LOG_FILE}"
