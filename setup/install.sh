#!/usr/bin/env bash
# agentstack installer
# Copies skill folders to ~/.claude/skills/agentstack-<name>/
# Usage: bash setup/install.sh

set -euo pipefail

# ─── Resolve paths ──────────────────────────────────────────────
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
CLAUDE_SKILLS="${HOME}/.claude/skills"

# ─── Verify Claude Code skills directory exists ─────────────────
if [ ! -d "${HOME}/.claude" ]; then
  echo "✗ ${HOME}/.claude not found. Install Claude Code first:"
  echo "  https://docs.anthropic.com/en/docs/claude-code"
  exit 1
fi

mkdir -p "$CLAUDE_SKILLS"

# ─── Discover skill folders (any directory containing SKILL.md) ─
echo "→ Installing agentstack skills from $REPO_ROOT"
echo "  Target: $CLAUDE_SKILLS/agentstack-*"
echo ""

INSTALLED=0
SKIPPED=0

# Root agentstack skill (the dispatcher) — installs as ~/.claude/skills/agentstack/
if [ -f "$REPO_ROOT/SKILL.md" ]; then
  TARGET="$CLAUDE_SKILLS/agentstack"
  rm -rf "$TARGET"
  mkdir -p "$TARGET"
  cp "$REPO_ROOT/SKILL.md" "$TARGET/SKILL.md"
  # Bundle foundation docs alongside the root skill so it can self-reference
  cp "$REPO_ROOT/ETHOS.md" "$TARGET/ETHOS.md" 2>/dev/null || true
  cp "$REPO_ROOT/IRON-LAWS.md" "$TARGET/IRON-LAWS.md" 2>/dev/null || true
  cp "$REPO_ROOT/DECISION-PRINCIPLES.md" "$TARGET/DECISION-PRINCIPLES.md" 2>/dev/null || true
  if [ -d "$REPO_ROOT/lenses" ]; then
    cp -R "$REPO_ROOT/lenses" "$TARGET/lenses"
  fi
  echo "  ✔ agentstack (dispatcher + foundations)"
  INSTALLED=$((INSTALLED + 1))
fi

# Per-skill folders: any sibling directory containing SKILL.md, except framework/, examples/, etc.
for dir in "$REPO_ROOT"/*/; do
  name="$(basename "$dir")"

  # Skip non-skill folders
  case "$name" in
    framework|create-agentstack|examples|lenses|bin|setup|scripts|node_modules|.git|docs)
      continue
      ;;
  esac

  if [ ! -f "$dir/SKILL.md" ]; then
    continue
  fi

  TARGET="$CLAUDE_SKILLS/agentstack-$name"
  rm -rf "$TARGET"
  cp -R "$dir" "$TARGET"
  echo "  ✔ agentstack-$name"
  INSTALLED=$((INSTALLED + 1))
done

echo ""
echo "✓ Installed $INSTALLED agentstack skill(s)."
echo ""
echo "Next:"
echo "  1. Restart Claude Code (or open a new project window)"
echo "  2. Verify: /agentstack-validate (when you're in an agentstack repo)"
echo "  3. Read: ${REPO_ROOT}/ETHOS.md"
