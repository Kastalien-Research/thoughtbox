#!/usr/bin/env bash
# Stop: Landing-the-plane enforcer.
# Blocks Claude from stopping if work isn't committed/pushed.
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
bead_state="$project_dir/.claude/state/bead-workflow/current-bead.json"

input_json=$(cat)

# ── Prevent infinite loop ─────────────────────────────────────────
stop_hook_active=$(echo "$input_json" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [[ "$stop_hook_active" == "true" ]]; then
  exit 0
fi

issues=""

# ── Check 1: Uncommitted changes ─────────────────────────────────
uncommitted=$(git -C "$project_dir" status --porcelain 2>/dev/null | grep -cv '^??' || echo 0)
if [[ "$uncommitted" -gt 0 ]]; then
  issues+="$uncommitted uncommitted files. "
fi

# ── Check 2: Unpushed commits ────────────────────────────────────
unpushed=$(git -C "$project_dir" log --oneline "@{push}..HEAD" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$unpushed" -gt 0 ]]; then
  issues+="$unpushed unpushed commits. "
fi

# ── Check 3: In-progress bead being abandoned ────────────────────
if [[ -f "$bead_state" ]]; then
  bead_id=$(jq -r '.bead_id // "unknown"' "$bead_state" 2>/dev/null)
  issues+="In-progress bead $bead_id still active. "
fi

# ── Decision ──────────────────────────────────────────────────────
if [[ -n "$issues" ]]; then
  jq -n --arg reason "Work not landed: ${issues}Commit, push, and close/defer beads before stopping." '{
    decision: "block",
    reason: $reason
  }'
fi

exit 0
