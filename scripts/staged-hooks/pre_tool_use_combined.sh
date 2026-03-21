#!/usr/bin/env bash
# PreToolUse: Single entry point. Reads stdin ONCE. Runs all checks.
# Replaces separate pre_tool_use.sh + bead_workflow_enforcer.sh + ulysses_enforcer.sh
set -euo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
tool_input=$(echo "$input_json" | jq -r '.tool_input // {}' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# ===================================================================
# SECTION 1: Original pre_tool_use.sh safety checks
# ===================================================================

is_dangerous_rm() {
  local cmd="$1"
  local normalized
  normalized=$(echo "$cmd" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
  if echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*r[a-z]*f' || \
     echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*f[a-z]*r' || \
     echo "$normalized" | grep -qE '\brm\s+--recursive\s+--force' || \
     echo "$normalized" | grep -qE '\brm\s+--force\s+--recursive'; then
    return 0
  fi
  if echo "$normalized" | grep -qE '\brm\b' && ! echo "$normalized" | grep -qE '\brm\s+-'; then
    return 0
  fi
  return 1
}

# Block .env writes
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" || "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == *".env"* && "$file_path" != *".env.sample"* && "$file_path" != *".env.example"* ]]; then
    echo "BLOCKED: Write access to .env files containing sensitive data is prohibited" >&2
    exit 1
  fi
fi

# Block .claude/hooks and .claude/settings modifications
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" || "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == *".claude/hooks/"* || "$file_path" == *".claude/settings"* ]]; then
    echo "BLOCKED: Agents cannot modify .claude/hooks or .claude/settings files" >&2
    exit 1
  fi
fi
if [[ "$tool_name" == "Bash" ]]; then
  if echo "$command" | grep -qE '(>|>>|tee|mv|cp|rm).*\.claude/(hooks|settings)'; then
    echo "BLOCKED: Agents cannot modify .claude/hooks or .claude/settings files" >&2
    exit 1
  fi
fi

# Block dangerous rm
if [[ "$tool_name" == "Bash" ]] && is_dangerous_rm "$command"; then
  echo "BLOCKED: Dangerous rm command detected and prevented" >&2
  exit 1
fi

# Block direct push to protected branches
if [[ "$tool_name" == "Bash" ]]; then
  if echo "$command" | grep -qE 'git\s+push\s+.*\b(main|master|develop|production)\b'; then
    echo "BLOCKED: Cannot push directly to protected branch" >&2
    exit 1
  fi
  if echo "$command" | grep -qE 'git\s+push\s+--force'; then
    echo "BLOCKED: Force push is not allowed" >&2
    exit 1
  fi
fi

# Require re-read before edit
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" ]]; then
  project_dir="${CLAUDE_PROJECT_DIR:-.}"
  access_jsonl="$project_dir/.claude/state/file_access.jsonl"
  if [[ -f "$access_jsonl" && -n "$file_path" ]]; then
    last_read=$(grep "\"Read\"" "$access_jsonl" | grep "\"$file_path\"" | tail -1 | jq -r '.timestamp // empty' 2>/dev/null)
    last_edit=$(grep "\"Edit\|\"Write\"" "$access_jsonl" | grep "\"$file_path\"" | tail -1 | jq -r '.timestamp // empty' 2>/dev/null)
    if [[ -n "$last_edit" && -n "$last_read" && "$last_edit" > "$last_read" ]]; then
      echo "BLOCKED: Must re-Read target file ($file_path) after its last edit before modifying it." >&2
      exit 1
    fi
    if [[ -n "$last_edit" && -z "$last_read" ]]; then
      echo "BLOCKED: Must re-Read target file ($file_path) after its last edit before modifying it." >&2
      exit 1
    fi
  fi
fi

# Block Write (full replace) to protected directories
if [[ "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == *".specs/"* || "$file_path" == *".adr/"* ]]; then
    echo "BLOCKED: Cannot Write (full replace) to files in protected working directories" >&2
    echo "Use Edit for surgical changes to specs and documentation." >&2
    exit 1
  fi
fi

# ===================================================================
# SECTION 2: Ulysses enforcer (reflect-required blocks everything)
# ===================================================================

ulysses_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ulysses"
bead_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/bead-workflow"

if [[ -f "$ulysses_state_dir/reflect-required" ]]; then
  if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
     || "$tool_name" == "AskUserQuestion" ]]; then
    exit 0
  fi
  if [[ "$tool_name" == "Bash" ]]; then
    if [[ "$command" == *"ulysses"* && "$command" == *"reflect"* ]] \
       || [[ "$command" == *"thoughtbox_gateway"* && "$command" == *"reflect"* ]] \
       || [[ "$command" == *"bd show"* || "$command" == *"bd update"*"--notes"* ]] \
       || [[ "$command" == *"git status"* || "$command" == *"git diff"* ]]; then
      exit 0
    fi
  fi
  if [[ "$tool_name" == "Skill" ]]; then
    exit 0
  fi

  bead_id="unknown"
  count=0
  if [[ -f "$bead_state_dir/current-bead.json" ]]; then
    bead_id=$(jq -r '.bead_id // "unknown"' "$bead_state_dir/current-bead.json")
    count=$(jq -r '.surprise_count // 0' "$bead_state_dir/current-bead.json")
  fi
  echo "BLOCKED: REFLECT REQUIRED (${count} consecutive surprises on ${bead_id})." >&2
  echo "You MUST run Ulysses REFLECT before any further work." >&2
  exit 1
fi

# ===================================================================
# SECTION 3: Bead workflow enforcer
# ===================================================================

# Rule: pending validation blocks new work
if [[ -f "$bead_state_dir/pending-validation.json" ]]; then
  bead_ids=$(jq -r '.bead_ids // ""' "$bead_state_dir/pending-validation.json")
  if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
     || "$tool_name" == "AskUserQuestion" ]]; then
    exit 0
  fi
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
  echo "Run tests, state validation result, wait for user go-ahead." >&2
  echo "Clear: touch .claude/state/bead-workflow/validation-confirmed" >&2
  exit 1
fi

# Rule: no code changes without hypothesis
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == */src/* || "$file_path" == */supabase/migrations/* ]]; then
    if [[ -f "$bead_state_dir/current-bead.json" ]]; then
      hyp=$(jq -r '.hypothesis_stated // false' "$bead_state_dir/current-bead.json")
      if [[ "$hyp" != "true" ]]; then
        bead_id=$(jq -r '.bead_id // "unknown"' "$bead_state_dir/current-bead.json")
        echo "BLOCKED: No code changes until hypothesis is recorded for ${bead_id}." >&2
        echo "Run: bd update ${bead_id} --notes=\"Hypothesis: <your hypothesis>\"" >&2
        exit 1
      fi
    fi
  fi
fi

# Rule: no batch bead closes
if [[ "$tool_name" == "Bash" && "$command" == *"bd close"* ]]; then
  bead_count=$(echo "$command" | grep -oEc 'thoughtbox-[a-z0-9.]+')
  if [[ "$bead_count" -gt 1 ]]; then
    echo "BLOCKED: Cannot close multiple beads in one command." >&2
    exit 1
  fi
fi

# Rule: no closing without tests
if [[ "$tool_name" == "Bash" && "$command" == *"bd close"* ]]; then
  if [[ ! -f "$bead_state_dir/tests-passed-since-edit" ]]; then
    echo "BLOCKED: Cannot close bead — tests have not passed since last code change." >&2
    exit 1
  fi
fi

# All checks passed
exit 0
