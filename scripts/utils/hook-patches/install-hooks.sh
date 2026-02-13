#!/usr/bin/env bash
# Install Phase 0 hook patches
# Run from project root: bash scripts/utils/hook-patches/install-hooks.sh
set -euo pipefail

HOOKS_DIR=".claude/hooks"
PATCHES_DIR="scripts/utils/hook-patches"

echo "=== Phase 0 Hook Installation ==="

# 1. Install assumption-tracker.sh (new file)
cp "$PATCHES_DIR/assumption-tracker.sh" "$HOOKS_DIR/assumption-tracker.sh"
chmod +x "$HOOKS_DIR/assumption-tracker.sh"
echo "  Installed assumption-tracker.sh"

# 2. Replace session_start.sh with patched version
cp "$HOOKS_DIR/session_start.sh" "$HOOKS_DIR/session_start.sh.bak"
cp "$PATCHES_DIR/session_start.sh.patched" "$HOOKS_DIR/session_start.sh"
chmod +x "$HOOKS_DIR/session_start.sh"
echo "  Installed session_start.sh (backup at session_start.sh.bak)"

# 3. Replace pre_compact.sh with patched version
cp "$HOOKS_DIR/pre_compact.sh" "$HOOKS_DIR/pre_compact.sh.bak"
cp "$PATCHES_DIR/pre_compact.sh.patched" "$HOOKS_DIR/pre_compact.sh"
chmod +x "$HOOKS_DIR/pre_compact.sh"
echo "  Installed pre_compact.sh (backup at pre_compact.sh.bak)"

echo ""
echo "=== Manual Step Remaining ==="
echo "Add assumption-tracker.sh to .claude/settings.json PostToolUse hooks:"
echo '  {'
echo '    "type": "command",'
echo '    "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/assumption-tracker.sh",'
echo '    "timeout": 3000,'
echo '    "continueOnError": true'
echo '  }'
echo ""
echo "Clean up backups when satisfied: rm $HOOKS_DIR/*.bak"
