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
# RULE 1: Pending validation — block work until user confirms
# (Step 7: pause between beads)
# ===================================================================
if [[ -f "$state_dir/pending-validation.json" ]]; then
  bead_ids=$(jq -r '.bead_ids // ""' "$state_dir/pending-validation.json")

  # Allow: reading, searching, asking user
  if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
     || "$tool_name" == "AskUserQuestion" ]]; then
    exit 0
  fi

  # Allow: running tests, checking status, validation commands
  if [[ "$tool_name" == "Bash" ]]; then
    if [[ "$command" == *"vitest"* || "$command" == *"tsc"* \
       || "$command" == *"test"* || "$command" == *"supabase"*"query"* \
       || "$command" == *"supabase"*"migration list"* \
       || "$command" == *"git status"* || "$command" == *"git diff"* \
       || "$command" == *"bd "* \
       || "$command" == *"validation-confirmed"* ]]; then
      exit 0
    fi
  fi

  echo "BLOCKED: Validation pending for closed bead(s): ${bead_ids}" >&2
  echo "You MUST:" >&2
  echo "  1. Run relevant tests and confirm they pass" >&2
  echo "  2. State the validation result" >&2
  echo "  3. Wait for user go-ahead" >&2
  echo "  4. Run: touch .claude/state/bead-workflow/validation-confirmed" >&2
  echo "Only test/validation commands are allowed until then." >&2
  exit 1
fi

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
