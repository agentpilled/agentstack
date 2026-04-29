#!/usr/bin/env bash
# Tail the agentstack runner's log file.
# Pass --since <when> for journalctl-style filtering on Linux.

set -euo pipefail

LOG_FILE="{{log_path}}"

if [ ! -f "$LOG_FILE" ]; then
  echo "ℹ log not yet created at $LOG_FILE — first run hasn't produced output."
  exit 0
fi

LINES="${1:-100}"
case "$LINES" in
  -n)
    LINES="${2:-100}"
    ;;
  *[!0-9]*)
    LINES=100
    ;;
esac

echo "→ tailing $LOG_FILE (last $LINES lines, then follow). Ctrl+C to exit."
echo ""
tail -n "$LINES" -f "$LOG_FILE"
