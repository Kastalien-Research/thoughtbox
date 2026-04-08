#!/usr/bin/env bash
# PostCompact: Re-inject critical state after compaction.
# Outputs additionalContext JSON so Claude recovers ulysses, git, and architecture context.
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ulysses_reflect="$project_dir/.claude/state/ulysses/reflect-required"
handoff_file="$project_dir/.claude/session-handoff.json"

# Consume stdin (required by hook protocol)
cat > /dev/null

ctx=""

# ── Decided architecture (always inject) ───────────────────────────
ctx+="## Decided Architecture (non-negotiable)\n"
ctx+="Execution: Cloud Run. Persistence: Supabase (Postgres, Auth, Storage). "
ctx+="Billing: Stripe. Session routing: Cloud Memorystore for Redis. "
ctx+="NO Cloud Storage FUSE. Containers are stateless.\n\n"

# ── Ulysses reflect-required ──────────────────────────────────────
if [[ -f "$ulysses_reflect" ]]; then
  ctx+="## ULYSSES: REFLECT REQUIRED\n"
  ctx+="You MUST run Ulysses REFLECT before any further work.\n\n"
fi

# ── Git state ─────────────────────────────────────────────────────
branch=$(git -C "$project_dir" branch --show-current 2>/dev/null || echo "unknown")
changes=$(git -C "$project_dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
unpushed=$(git -C "$project_dir" log --oneline "@{push}..HEAD" 2>/dev/null | wc -l | tr -d ' ')
ctx+="## Git State\n"
ctx+="Branch: $branch | Uncommitted: $changes files | Unpushed: $unpushed commits\n\n"

# ── Session handoff (if not stale) ────────────────────────────────
if [[ -f "$handoff_file" ]]; then
  handoff_sha=$(jq -r '.git.lastCommit.sha // ""' "$handoff_file" 2>/dev/null)
  prev_time=$(jq -r '.timestamp // ""' "$handoff_file" 2>/dev/null)

  is_current=true
  if [[ -n "$handoff_sha" ]] && ! git -C "$project_dir" merge-base --is-ancestor "$handoff_sha" HEAD 2>/dev/null; then
    is_current=false
  fi
  if [[ "$is_current" == "true" && -n "$prev_time" ]]; then
    prev_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${prev_time%%.*}" +%s 2>/dev/null || echo 0)
    now_epoch=$(date +%s)
    if (( (now_epoch - prev_epoch) > 604800 )); then
      is_current=false
    fi
  fi

  if [[ "$is_current" == "true" ]]; then
    summary=$(jq -r '.summary // "No summary"' "$handoff_file" 2>/dev/null)
    ctx+="## Previous Session Handoff\n"
    ctx+="$summary\n\n"
  fi
fi

# ── Output additionalContext JSON ─────────────────────────────────
jq -n --arg ctx "$ctx" '{
  hookSpecificOutput: {
    hookEventName: "PostCompact",
    additionalContext: $ctx
  }
}'

exit 0
