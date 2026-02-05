#!/usr/bin/env bash
# Hub TDD Stop hook: block stopping when TDD workflow is active but incomplete.
# Mirrors specsuite_stop.sh pattern.

set -euo pipefail

hook_input="$(cat)"

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state_path="$project_dir/.hub-tdd/state.json"

# No state file = not running
[[ ! -f "$state_path" ]] && exit 0

# If Claude Code is already continuing due to a Stop hook, do nothing.
if echo "$hook_input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0
fi

# Already complete or halted — allow exit
status="$(jq -r '.status // ""' "$state_path" 2>/dev/null || true)"
case "$status" in
  completed|halted) exit 0 ;;
esac

# Count progress
total="$(jq '[.modules | to_entries[] | .value.step] | length' "$state_path" 2>/dev/null || echo "0")"
complete="$(jq '[.modules | to_entries[] | select(.value.step == "complete")] | length' "$state_path" 2>/dev/null || echo "0")"

# Gather current state for the message
phase="$(jq -r '.phase // "unknown"' "$state_path" 2>/dev/null || echo "unknown")"
current_module="$(jq -r '
  .modules | to_entries[]
  | select(.value.step != "complete" and .value.step != "pending")
  | .key
' "$state_path" 2>/dev/null | head -1 || echo "")"

{
  echo "BLOCKED: hub-tdd workflow is active ($complete/$total modules complete)."
  echo ""
  echo "  Phase: $phase"
  if [[ -n "$current_module" ]]; then
    echo "  Active module: $current_module"
  fi
  echo ""
  echo "Options:"
  echo "  - Continue implementing to reach the next git gate"
  echo "  - Set \"status\": \"halted\" in .hub-tdd/state.json to force-stop"
} >&2
exit 2
