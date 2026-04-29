#!/usr/bin/env bash
# Pause the agentstack scheduled runner without removing it.
# Resume with `./scripts/{{name}}-resume.sh`.

set -euo pipefail

LABEL="{{label}}"
TIMER_UNIT="{{name}}.timer"

case "$(uname -s)" in
  Darwin)
    PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
    if [ ! -f "$PLIST" ]; then
      echo "✗ plist not found at $PLIST"
      exit 1
    fi
    if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
      launchctl bootout "gui/$(id -u)/${LABEL}"
      echo "✓ paused $LABEL (use {{name}}-resume.sh to bring back)"
    else
      echo "ℹ already paused / not loaded"
    fi
    ;;
  Linux)
    systemctl --user stop "$TIMER_UNIT" 2>/dev/null || true
    systemctl --user disable "$TIMER_UNIT" 2>/dev/null || true
    echo "✓ paused $TIMER_UNIT"
    ;;
  *)
    echo "✗ unsupported platform: $(uname -s)"
    exit 1
    ;;
esac
