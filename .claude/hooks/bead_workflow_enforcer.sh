#!/usr/bin/env bash
# PreToolUse: BLOCK tool calls that violate the baseline bead workflow.
# This is NOT Ulysses. This enforces steps 1-7 for every bead.
# Exits non-zero to block. Does not suggest. Does not remind.
set -euo pipefail

state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/bead-workflow"

# If state dir doesn't exist, no enforcement active
[[ -d "$state_dir" ]] || exit 0

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# ===================================================================
# RULE 2: No code changes without hypothesis
# (Step 2 gates Step 3)
# ===================================================================
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == */src/* || "$file_path" == */supabase/migrations/* ]]; then
    if [[ -f "$state_dir/current-bead.json" ]]; then
      hyp=$(jq -r '.hypothesis_stated // false' "$state_dir/current-bead.json")
      if [[ "$hyp" != "true" ]]; then
        bead_id=$(jq -r '.bead_id // "unknown"' "$state_dir/current-bead.json")
        echo "BLOCKED: No code changes until hypothesis is recorded for ${bead_id}." >&2
        echo "Run: bd update ${bead_id} --notes=\"Hypothesis: <your hypothesis>\"" >&2
        exit 1
      fi
    fi
  fi
fi

# ===================================================================
# RULE 3: No batch bead closes
# (Step 6: one at a time)
# ===================================================================
if [[ "$tool_name" == "Bash" && "$command" == *"bd close"* ]]; then
  bead_count=$(echo "$command" | grep -oEc 'thoughtbox-[a-z0-9.]+')
  if [[ "$bead_count" -gt 1 ]]; then
    echo "BLOCKED: Cannot close multiple beads in one command." >&2
    echo "Each bead must be closed individually with its own validation." >&2
    exit 1
  fi
fi

# ===================================================================
# RULE 4: No closing without tests
# (Step 4 gates Step 6)
# ===================================================================
if [[ "$tool_name" == "Bash" && "$command" == *"bd close"* ]]; then
  if [[ ! -f "$state_dir/tests-passed-since-edit" ]]; then
    echo "BLOCKED: Cannot close bead — tests have not passed since last code change." >&2
    echo "Run the relevant test suite first, confirm it passes, then close." >&2
    exit 1
  fi
fi

# All rules passed
exit 0
