#!/usr/bin/env bash
# Resume a paused agentstack scheduled runner.

set -euo pipefail

LABEL="{{label}}"
TIMER_UNIT="{{name}}.timer"

case "$(uname -s)" in
  Darwin)
    PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
    if [ ! -f "$PLIST" ]; then
      echo "✗ plist not found at $PLIST — re-run /agentstack-schedule to recreate"
      exit 1
    fi
    if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
      echo "ℹ already loaded"
    else
      launchctl bootstrap "gui/$(id -u)" "$PLIST"
      echo "✓ resumed $LABEL"
    fi
    ;;
  Linux)
    systemctl --user enable --now "$TIMER_UNIT"
    echo "✓ resumed $TIMER_UNIT"
    systemctl --user list-timers "$TIMER_UNIT" --no-pager
    ;;
  *)
    echo "✗ unsupported platform: $(uname -s)"
    exit 1
    ;;
esac
