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

# ── GUARD 2: .env write protection ─────────────────────────────────
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  file_path=$(echo "$tool_input" | jq -r '.file_path // ""')
  if [[ "$file_path" == *".env"* && "$file_path" != *".env.sample"* \
     && "$file_path" != *".env.example"* ]]; then
    echo "BLOCKED: Write to .env files is prohibited. Modify manually." >&2
    exit 2
  fi
elif [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  if echo "$command" | grep -qE '(>|>>|tee).*\.env\b' \
     && ! echo "$command" | grep -q '\.env\.sample\|\.env\.example'; then
    echo "BLOCKED: Shell redirect to .env files is prohibited." >&2
    exit 2
  fi
fi

# ── GUARD 3: .claude infrastructure self-modification ──────────────
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  file_path=$(echo "$tool_input" | jq -r '.file_path // ""')
  if [[ "$file_path" == *".claude/settings"* || "$file_path" == *".claude/hooks/"* ]]; then
    echo "BLOCKED: Agents cannot modify .claude/hooks or .claude/settings." >&2
    echo "User must make these changes manually." >&2
    exit 2
  fi
elif [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  if echo "$command" | grep -qE '(>|>>|tee|mv|cp|rm).*\.claude/(hooks|settings)'; then
    echo "BLOCKED: Shell modification of .claude/hooks or .claude/settings is prohibited." >&2
    exit 2
  fi
fi

# ── GUARD 4: Memory-bearing file protection ────────────────────────
# Block Write (full replace) to CLAUDE.md, AGENTS.md, agent prompts.
# Edit (surgical replacement) is allowed — it can't delete content it doesn't reference.
if [[ "$tool_name" == "Write" ]]; then
  file_path=$(echo "$tool_input" | jq -r '.file_path // ""')
  basename=$(basename "$file_path")
  case "$basename" in
    CLAUDE.md|AGENTS.md)
      echo "BLOCKED: Write (full replace) to $basename is prohibited. Use Edit." >&2
      exit 2
      ;;
  esac
  if [[ "$file_path" == *".claude/agents/"* && "$file_path" == *.md ]]; then
    echo "BLOCKED: Write (full replace) to agent prompt files is prohibited. Use Edit." >&2
    exit 2
  fi
fi

# ── GUARD 5: Protected directory protection ────────────────────────
PROTECTED_DIRS=("specs/" ".specs/" "docs/" "self-improvement/")

if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  for dir in "${PROTECTED_DIRS[@]}"; do
    if echo "$command" | grep -qE "\brm\s+.*${dir}"; then
      echo "BLOCKED: Cannot delete files in protected directory: $dir" >&2
      exit 2
    fi
    if echo "$command" | grep -qE "\bmv\s+.*${dir}.*\s+/dev/null"; then
      echo "BLOCKED: Cannot discard files from protected directory: $dir" >&2
      exit 2
    fi
  done
fi

if [[ "$tool_name" == "Write" ]]; then
  file_path=$(echo "$tool_input" | jq -r '.file_path // ""')
  for dir in "${PROTECTED_DIRS[@]}"; do
    if [[ "$file_path" == *"${dir}"* ]]; then
      echo "BLOCKED: Write (full replace) in $dir is prohibited. Use Edit." >&2
      exit 2
    fi
  done
fi

# ── GUARD 6: Git safety ───────────────────────────────────────────
if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')

  # Force push
  if echo "$normalized" | grep -qE 'git\s+push\s+.*--force' || \
     echo "$normalized" | grep -qE 'git\s+push\s+.*\s-f\b'; then
    echo "BLOCKED: Force push is prohibited." >&2
    exit 2
  fi

  # Direct push to protected branches
  for branch in main master develop production; do
    if echo "$normalized" | grep -qE "git\s+push\s+.*\s+${branch}\b"; then
      echo "BLOCKED: Direct push to $branch is prohibited. Use a PR." >&2
      exit 2
    fi
  done

  # Branch deletion
  if echo "$normalized" | grep -qE 'git\s+branch\s+-D\s+' || \
     echo "$normalized" | grep -qE 'git\s+push\s+.*--delete'; then
    echo "BLOCKED: Branch deletion requires explicit user request." >&2
    exit 2
  fi

  # Conventional commit warning (non-blocking)
  if echo "$normalized" | grep -qE 'git\s+commit\s+.*-m\s+'; then
    msg=$(echo "$command" | sed -n "s/.*-m\s*['\"]\([^'\"]*\)['\"].*/\1/p" | head -1)
    if [[ -n "$msg" ]] && ! echo "$msg" | grep -qE '^(feat|fix|refactor|docs|test|chore|perf|style|security|breaking)(\(.+\))?!?:'; then
      echo "WARNING: Commit message doesn't follow conventional format: type(scope): subject" >&2
    fi
  fi
fi

# ── GUARD 7: Read-before-write ─────────────────────────────────────
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
