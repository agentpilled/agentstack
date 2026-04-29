#!/usr/bin/env bash
# Permanently remove the agentstack scheduled runner.
# Wrapper script + logs are left in place — remove them manually if you want.

set -euo pipefail

LABEL="{{label}}"
TIMER_UNIT="{{name}}.timer"
SERVICE_UNIT="{{name}}.service"

case "$(uname -s)" in
  Darwin)
    PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
    if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
      launchctl bootout "gui/$(id -u)/${LABEL}"
    fi
    if [ -f "$PLIST" ]; then
      rm "$PLIST"
      echo "✓ removed $PLIST"
    else
      echo "ℹ plist already removed"
    fi
    ;;
  Linux)
    systemctl --user disable --now "$TIMER_UNIT" 2>/dev/null || true
    UNITS_DIR="$HOME/.config/systemd/user"
    rm -f "$UNITS_DIR/$TIMER_UNIT" "$UNITS_DIR/$SERVICE_UNIT"
    systemctl --user daemon-reload
    echo "✓ removed $TIMER_UNIT + $SERVICE_UNIT from $UNITS_DIR"
    ;;
  *)
    echo "✗ unsupported platform: $(uname -s)"
    exit 1
    ;;
esac

echo ""
echo "Left in place (remove manually if you want):"
echo "  wrapper:  {{wrapper_path}}"
echo "  log:      {{log_path}}"
echo "  helpers:  scripts/{{name}}-{pause,resume,logs,uninstall}.sh"
