#!/usr/bin/env bash
set -euo pipefail

# Hub Collaboration Demo Orchestrator
# Opens iTerm2 split panes with Coordinator, Architect, and Debugger agents
# coordinating through the Thoughtbox Hub.
#
# Usage: ./scripts/demo/hub-collab-demo.sh [workspace-name]

WORKSPACE_NAME="${1:-demo-collab}"
WORKSPACE_DESC="Multi-agent collaboration demo: COORDINATOR decomposes problems, ARCHITECT designs solutions, DEBUGGER investigates bugs"
WORKSPACE_ID_FILE="/tmp/hub-demo-workspace-id.txt"
COORDINATOR_OUTPUT_FILE="/tmp/hub-demo-manager-output.txt"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[orchestrator]${NC} $1"; }
ok()  { echo -e "${GREEN}[orchestrator]${NC} $1"; }
err() { echo -e "${RED}[orchestrator]${NC} $1" >&2; }
warn() { echo -e "${YELLOW}[orchestrator]${NC} $1"; }

# ── Preflight ────────────────────────────────────────────────────────
log "Checking prerequisites..."

# If claude is installed via asdf shim, ensure a Node version is selected.
if command -v asdf &>/dev/null && ! node -v &>/dev/null; then
  ASDF_NODE_VERSION="$(asdf list nodejs 2>/dev/null | sed 's/^[ *]*//' | tail -n 1 | tr -d '[:space:]')"
  if [ -n "${ASDF_NODE_VERSION}" ]; then
    export ASDF_NODEJS_VERSION="${ASDF_NODE_VERSION}"
    ok "Using asdf nodejs ${ASDF_NODEJS_VERSION}"
  fi
fi

# Check Thoughtbox server
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:1731/mcp -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"ping","id":1}' | grep -q "200\|406"; then
  err "Thoughtbox server not reachable at http://localhost:1731/mcp"
  err "Start it with: docker compose up -d"
  exit 1
fi
ok "Thoughtbox server is running"

# Check claude CLI
if ! command -v claude &>/dev/null; then
  err "claude CLI not found. Install Claude Code first."
  exit 1
fi
ok "Claude CLI available"

# Check iTerm2
USE_ITERM=false
if [ -d "/Applications/iTerm.app" ]; then
  USE_ITERM=true
  ok "iTerm2 detected — will use split panes"
else
  warn "iTerm2 not found — falling back to Terminal.app (separate windows)"
  warn "For split panes, install iTerm2: https://iterm2.com"
fi

# Clean up previous run
rm -f "$WORKSPACE_ID_FILE"
rm -f "$COORDINATOR_OUTPUT_FILE"

# ── Phase 1: Coordinator sets up workspace ───────────────────────────────
log "Phase 1: Running Coordinator agent to set up workspace..."

COORDINATOR_PROMPT="You are the COORDINATOR agent. Do these steps and NOTHING ELSE:

1. Register: thoughtbox_hub { operation: \"register\", args: { name: \"Coordinator\", profile: \"COORDINATOR\" } }
2. Create workspace: thoughtbox_hub { operation: \"create_workspace\", args: { name: \"${WORKSPACE_NAME}\", description: \"${WORKSPACE_DESC}\" } }
3. Create design problem: thoughtbox_hub { operation: \"create_problem\", args: { workspaceId: \"<ID_FROM_STEP_2>\", title: \"Design caching strategy for thought retrieval\", description: \"Analyze current thought retrieval patterns and design a caching layer to reduce filesystem reads. Consider: cache invalidation, memory bounds, branch-aware caching.\" } }
4. Create bug problem: thoughtbox_hub { operation: \"create_problem\", args: { workspaceId: \"<ID_FROM_STEP_2>\", title: \"Fix profile priming on every thought call\", description: \"BUG: gateway-handler.ts:504-516 appends full mental model payload to EVERY thought response. Should only prime once per session. Root cause analysis needed via five-whys.\" } }
5. Write ONLY the workspace ID (nothing else) to the file: ${WORKSPACE_ID_FILE}
6. Print a summary: workspace ID, problem IDs, and that the workspace is ready for contributors."

# Run manager non-interactively (retry on transient tool-concurrency API errors)
COORDINATOR_OK=false
for ATTEMPT in 1 2 3; do
  COORDINATOR_OUTPUT="$(claude --agent hub-coordinator --print -p "$COORDINATOR_PROMPT" 2>&1)" && {
    COORDINATOR_OK=true
    printf "%s\n" "$COORDINATOR_OUTPUT" > "$COORDINATOR_OUTPUT_FILE"
    break
  }

  if echo "$COORDINATOR_OUTPUT" | grep -qi "tool use concurrency issues"; then
    warn "Coordinator attempt ${ATTEMPT}/3 hit tool-concurrency API error; retrying..."
    sleep 2
    continue
  fi

  err "Coordinator agent failed:"
  echo "$COORDINATOR_OUTPUT" >&2
  exit 1
done

if [ "$COORDINATOR_OK" != true ]; then
  err "Coordinator agent failed after 3 attempts:"
  echo "$COORDINATOR_OUTPUT" >&2
  exit 1
fi

# Fallback: extract workspace ID from manager output if file-write instruction was missed.
if [ ! -f "$WORKSPACE_ID_FILE" ] && [ -f "$COORDINATOR_OUTPUT_FILE" ]; then
  WORKSPACE_ID_FROM_OUTPUT="$(grep -Eo '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' "$COORDINATOR_OUTPUT_FILE" | head -n 1 || true)"
  if [ -n "$WORKSPACE_ID_FROM_OUTPUT" ]; then
    printf "%s\n" "$WORKSPACE_ID_FROM_OUTPUT" > "$WORKSPACE_ID_FILE"
    warn "Coordinator skipped file write; recovered workspace ID from output."
  fi
fi

# Read workspace ID
if [ ! -f "$WORKSPACE_ID_FILE" ]; then
  err "Coordinator did not write workspace ID to $WORKSPACE_ID_FILE"
  err "You may need to run the Coordinator manually and note the workspace ID."
  exit 1
fi

WORKSPACE_ID="$(cat "$WORKSPACE_ID_FILE" | tr -d '[:space:]')"
if [ -z "$WORKSPACE_ID" ]; then
  err "Workspace ID file is empty"
  exit 1
fi

ok "Workspace created: ${WORKSPACE_ID}"

# ── Phase 2: Open Architect and Debugger in split panes ──────────────
log "Phase 2: Spawning Architect and Debugger agents..."

ARCHITECT_PROMPT="You are the ARCHITECT agent joining an active workspace. Do these steps:

1. Register: thoughtbox_hub { operation: \"register\", args: { name: \"Architect\", profile: \"ARCHITECT\" } }
2. Join workspace: thoughtbox_hub { operation: \"join_workspace\", args: { workspaceId: \"${WORKSPACE_ID}\" } }
3. Check ready problems: thoughtbox_hub { operation: \"ready_problems\", args: { workspaceId: \"${WORKSPACE_ID}\" } }
4. Claim the DESIGN problem (about caching strategy): thoughtbox_hub { operation: \"claim_problem\", args: { workspaceId: \"${WORKSPACE_ID}\", problemId: \"<DESIGN_PROBLEM_ID>\" } }
5. Initialize gateway: thoughtbox_gateway { operation: \"init\" }
6. Create a 3-thought analysis chain on your branch exploring caching approaches (use cipher notation: H for hypotheses, E for evidence, C for conclusions)
7. Create a proposal with your recommendation: thoughtbox_hub { operation: \"create_proposal\", args: { workspaceId: \"${WORKSPACE_ID}\", title: \"LRU cache for thought retrieval\", description: \"<your analysis summary>\", sourceBranch: \"<your-branch>\", problemId: \"<DESIGN_PROBLEM_ID>\" } }
8. Post to the problem channel that your proposal is ready for review"

DEBUGGER_PROMPT="You are the DEBUGGER agent joining an active workspace. Do these steps:

1. Register: thoughtbox_hub { operation: \"register\", args: { name: \"Debugger\", profile: \"DEBUGGER\" } }
2. Join workspace: thoughtbox_hub { operation: \"join_workspace\", args: { workspaceId: \"${WORKSPACE_ID}\" } }
3. Check ready problems: thoughtbox_hub { operation: \"ready_problems\", args: { workspaceId: \"${WORKSPACE_ID}\" } }
4. Claim the BUG problem (about profile priming): thoughtbox_hub { operation: \"claim_problem\", args: { workspaceId: \"${WORKSPACE_ID}\", problemId: \"<BUG_PROBLEM_ID>\" } }
5. Initialize gateway: thoughtbox_gateway { operation: \"init\" }
6. Run a five-whys investigation on your branch (3 thoughts minimum: symptom → proximate cause → root cause)
7. Create a proposal with your fix: thoughtbox_hub { operation: \"create_proposal\", args: { workspaceId: \"${WORKSPACE_ID}\", title: \"Fix: Add profilePrimed session flag\", description: \"<your root cause analysis>\", sourceBranch: \"<your-branch>\", problemId: \"<BUG_PROBLEM_ID>\" } }
8. List proposals and review the Architect's proposal if it exists (approve or request changes)
9. Post to the problem channel with your findings"

ARCHITECT_PROMPT_FILE="/tmp/hub-demo-architect-prompt.txt"
DEBUGGER_PROMPT_FILE="/tmp/hub-demo-debugger-prompt.txt"
printf "%s\n" "$ARCHITECT_PROMPT" > "$ARCHITECT_PROMPT_FILE"
printf "%s\n" "$DEBUGGER_PROMPT" > "$DEBUGGER_PROMPT_FILE"

if [ "$USE_ITERM" = true ]; then
  # iTerm2: create window with horizontal split — Architect left, Debugger right
  osascript - "$PROJECT_DIR" "$ARCHITECT_PROMPT_FILE" "$DEBUGGER_PROMPT_FILE" <<'APPLESCRIPT' >/tmp/hub-demo-iterm-osascript.log 2>&1 &
on run argv
  set projectDir to item 1 of argv
  set architectPromptFile to item 2 of argv
  set debuggerPromptFile to item 3 of argv

tell application "iTerm2"
  activate

  -- Create new window
  set newWindow to (create window with default profile)

  tell current session of current tab of newWindow
    -- Left pane: Architect
    write text "cd " & quoted form of projectDir & " && claude --agent hub-architect -p \"$(cat " & quoted form of architectPromptFile & ")\""

    -- Split right: Debugger
    set debuggerSession to (split vertically with default profile)
  end tell

  tell debuggerSession
    write text "cd " & quoted form of projectDir & " && claude --agent hub-debugger -p \"$(cat " & quoted form of debuggerPromptFile & ")\""
  end tell

end tell
end run
APPLESCRIPT

  sleep 1
  ok "iTerm2 panes opened: Architect (left) | Debugger (right)"

else
  # Terminal.app: open two separate windows
  osascript - "$PROJECT_DIR" "$ARCHITECT_PROMPT_FILE" "$DEBUGGER_PROMPT_FILE" <<'APPLESCRIPT' >/tmp/hub-demo-terminal-osascript.log 2>&1 &
on run argv
  set projectDir to item 1 of argv
  set architectPromptFile to item 2 of argv
  set debuggerPromptFile to item 3 of argv

  tell application "Terminal"
    activate
    do script "cd " & quoted form of projectDir & " && claude --agent hub-architect -p \"$(cat " & quoted form of architectPromptFile & ")\""
    do script "cd " & quoted form of projectDir & " && claude --agent hub-debugger -p \"$(cat " & quoted form of debuggerPromptFile & ")\""
  end tell
end run
APPLESCRIPT

  sleep 1
  ok "Terminal windows opened for Architect and Debugger"
fi

echo ""
ok "Demo is running!"
log "Workspace: ${WORKSPACE_ID}"
log "Agents: Coordinator (setup complete), Architect (designing), Debugger (investigating)"
log ""
log "To check workspace status:"
log "  claude -p \"thoughtbox_hub { operation: 'workspace_status', args: { workspaceId: '${WORKSPACE_ID}' } }\""
