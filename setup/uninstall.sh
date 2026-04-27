#!/usr/bin/env bash
# agentstack uninstaller
# Removes ~/.claude/skills/agentstack* directories.
# Usage: bash setup/uninstall.sh

set -euo pipefail

CLAUDE_SKILLS="${HOME}/.claude/skills"

if [ ! -d "$CLAUDE_SKILLS" ]; then
  echo "Nothing to uninstall — $CLAUDE_SKILLS does not exist."
  exit 0
fi

REMOVED=0
for dir in "$CLAUDE_SKILLS"/agentstack*; do
  [ -d "$dir" ] || continue
  echo "  ✗ removing $(basename "$dir")"
  rm -rf "$dir"
  REMOVED=$((REMOVED + 1))
done

echo ""
echo "✓ Removed $REMOVED agentstack skill(s)."
