#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="${ROOT_DIR}/logs/git-auto-sync.pid"

if [[ ! -f "${PID_FILE}" ]]; then
    echo "git-auto-sync 未运行"
    exit 0
fi

AUTO_SYNC_PID="$(cat "${PID_FILE}")"

if kill -0 "${AUTO_SYNC_PID}" 2>/dev/null; then
    kill "${AUTO_SYNC_PID}"
    echo "git-auto-sync 已停止，PID=${AUTO_SYNC_PID}"
else
    echo "git-auto-sync 进程不存在，清理旧 PID 文件"
fi

rm -f "${PID_FILE}"
