#!/usr/bin/env bash
# SubagentStart: Inject initiative constraints into every subagent.
# Ensures all subagents receive decided architecture and current work context.
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
bead_state="$project_dir/.claude/state/bead-workflow/current-bead.json"
ulysses_reflect="$project_dir/.claude/state/ulysses/reflect-required"

# Consume stdin
cat > /dev/null

ctx=""

# ── Hard constraints (always inject) ──────────────────────────────
ctx+="## NON-NEGOTIABLE CONSTRAINTS\n"
ctx+="- Execution plane: Google Cloud Run\n"
ctx+="- Persistence: Supabase (Postgres, Auth, Storage)\n"
ctx+="- Billing: Stripe\n"
ctx+="- Session routing: Cloud Memorystore for Redis (transport state only)\n"
ctx+="- NO Cloud Storage FUSE — all persistence through Supabase\n"
ctx+="- Containers are stateless\n"
ctx+="- Do NOT optimize for minimizing code changes. The initiative exists because code needs to change.\n"
ctx+="- Do NOT introduce infrastructure not in this list without escalation.\n\n"

# ── Current work context ──────────────────────────────────────────
branch=$(git -C "$project_dir" branch --show-current 2>/dev/null || echo "unknown")
ctx+="## Current Context\n"
ctx+="Branch: $branch\n"

if [[ -f "$bead_state" ]]; then
  bead_id=$(jq -r '.bead_id // "unknown"' "$bead_state" 2>/dev/null)
  hyp=$(jq -r '.hypothesis_stated // false' "$bead_state" 2>/dev/null)
  ctx+="Active bead: $bead_id (hypothesis: $hyp)\n"
fi

# ── Ulysses warning ───────────────────────────────────────────────
if [[ -f "$ulysses_reflect" ]]; then
  ctx+="\nWARNING: Ulysses REFLECT is required. Do not proceed with implementation until REFLECT is completed.\n"
fi

# ── Output ────────────────────────────────────────────────────────
jq -n --arg ctx "$ctx" '{
  hookSpecificOutput: {
    hookEventName: "SubagentStart",
    additionalContext: $ctx
  }
}'

exit 0
