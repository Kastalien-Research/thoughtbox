#!/usr/bin/env bash
###
# Session End Memory Capture Hook
# Prompts agent to capture learnings and calibrate memory system
###

set -uo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract session info
session_id=$(echo "$input_json" | jq -r '.session_id // "unknown"')
transcript_path=$(echo "$input_json" | jq -r '.transcript_path // ""' | sed "s|^~|$HOME|")

# Log to memory system state
log_file=".claude/state/memory-calibration.log"
mkdir -p "$(dirname "$log_file")"

timestamp=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$timestamp] Session ended: $session_id" >> "$log_file"

# Count turns in this session (approximate from transcript)
if [[ -f "$transcript_path" ]]; then
    turn_count=$(grep -c '"role":"user"' "$transcript_path" 2>/dev/null || echo "0")
    echo "[$timestamp] Turns in session: $turn_count" >> "$log_file"
fi

# Output prompt for learning capture (shown to agent)
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionEndMemoryCapture",
    "message": "Session Complete - Memory Capture",
    "prompt": "
## Memory Capture

This session is ending. Help improve the memory system for future agents:

### Quick Reflection

1. **Did memory help you?**
   - Were relevant patterns/rules loaded when you needed them?
   - What information was readily available?
   - What was missing or hard to find?

2. **What did you learn?**
   - Did you discover any non-obvious patterns?
   - Did you solve problems that future agents should know about?
   - Are there anti-patterns or common mistakes to document?

### If You Learned Something Significant (project-scoped)

Prefer project-scoped storage (no context-window clogging):

Option A: add an insight via the hook bridge (writes to \`.thoughtbox/projects/<project>/memory/graph.jsonl\`)
\`\`\`bash
node .claude/hooks/knowledge_memory_bridge.mjs add-insight \\
  --name \"insight:<short-slug>\" \\
  --label \"<short title>\" \\
  --content \"<atomic learning>\"
\`\`\`

Option B: use the Thoughtbox MCP knowledge tool (interactive) to create an entity + observation.

### Memory Effectiveness Rating (Optional)

Rate this session: [1-10]
- 1-3: Memory wasn't helpful, missing critical info
- 4-6: Memory was somewhat helpful but had gaps
- 7-9: Memory was very helpful, found what I needed
- 10: Perfect - everything I needed was ready at hand

**No action required** if this was a simple session without learnings.
    "
  }
}
EOF

# Track session end for calibration metrics
echo "[$timestamp] Memory capture prompt shown" >> "$log_file"

exit 0
