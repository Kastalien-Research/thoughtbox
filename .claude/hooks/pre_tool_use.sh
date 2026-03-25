#!/usr/bin/env bash
# PreToolUse: Safety guards for all tool calls.
# Does NOT enforce workflow — that's ulysses_enforcer.sh and bead_workflow_enforcer.sh.
set -euo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_input=$(echo "$input_json" | jq -c '.tool_input // {}')

# ── GUARD 1: Dangerous rm ──────────────────────────────────────────
if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')

  if echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*r[a-z]*f' || \
     echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*f[a-z]*r' || \
     echo "$normalized" | grep -qE '\brm\s+--recursive\s+--force' || \
     echo "$normalized" | grep -qE '\brm\s+--force\s+--recursive'; then
    echo "BLOCKED: rm -rf is prohibited. Use 'trash' for recoverable deletion." >&2
    exit 2
  fi
fi

# ── GUARD 2: Read-before-write ─────────────────────────────────────
# Require that a file has been Read before it can be edited.
# Tracked by post_tool_use.sh writing to file_access.jsonl.
if [[ "${CC_DISABLE_READ_GUARD:-0}" != "1" ]]; then
  if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
    file_path=$(echo "$tool_input" | jq -r '.file_path // ""')

    if [[ -n "$file_path" && -f "$file_path" ]]; then
      access_log="${CLAUDE_PROJECT_DIR:-.}/.claude/state/file_access.jsonl"

      if [[ ! -f "$access_log" ]]; then
        echo "BLOCKED: Must Read $file_path before modifying it (no access log)." >&2
        exit 2
      fi

      abs_path=$(python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" \
        "$file_path" 2>/dev/null || echo "$file_path")

      last_read=$(jq -sr --arg p "$abs_path" \
        'map(select(.path == $p and .tool == "Read")) | .[-1].ts // ""' \
        "$access_log" 2>/dev/null || echo "")

      if [[ -z "$last_read" ]]; then
        echo "BLOCKED: Must Read $file_path before modifying it." >&2
        exit 2
      fi

      last_write=$(jq -sr --arg p "$abs_path" \
        'map(select(.path == $p and (.tool == "Write" or .tool == "Edit"))) | .[-1].ts // ""' \
        "$access_log" 2>/dev/null || echo "")

      if [[ -n "$last_write" && "$last_read" < "$last_write" ]]; then
        echo "BLOCKED: Must re-Read $file_path after last edit before modifying again." >&2
        exit 2
      fi
    fi
  fi
fi

exit 0
