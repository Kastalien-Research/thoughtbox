#!/usr/bin/env bash
# Stop: Landing-the-plane enforcer.
# Blocks Claude from stopping if work isn't committed/pushed.
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

input_json=$(cat)

# ── Prevent infinite loop ─────────────────────────────────────────
stop_hook_active=$(echo "$input_json" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [[ "$stop_hook_active" == "true" ]]; then
  exit 0
fi

issues=""

# ── Check 1: Uncommitted changes ─────────────────────────────────
uncommitted=$(git -C "$project_dir" status --porcelain 2>/dev/null | grep -cv '^??')
uncommitted=${uncommitted:-0}
if [[ "$uncommitted" -gt 0 ]]; then
  issues+="$uncommitted uncommitted files. "
fi

# ── Check 2: Unpushed commits ────────────────────────────────────
unpushed=$(git -C "$project_dir" log --oneline "@{push}..HEAD" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$unpushed" -gt 0 ]]; then
  issues+="$unpushed unpushed commits. "
fi

# ── Check 3: Still on a stale/merged branch ──────────────────────
branch=$(git -C "$project_dir" branch --show-current 2>/dev/null || echo "unknown")
if [[ "$branch" != "main" && "$branch" != "master" && "$branch" != "unknown" ]]; then
  if git -C "$project_dir" merge-base --is-ancestor HEAD main 2>/dev/null; then
    issues+="On merged branch '$branch' — switch to main and delete it. "
  fi
fi

# ── Decision ──────────────────────────────────────────────────────
if [[ -n "$issues" ]]; then
  echo "WARNING: Work not landed: ${issues}Commit, push, and switch to main before stopping." >&2
fi

exit 0
