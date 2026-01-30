#!/usr/bin/env bash
###
# Session End Memory Capture Hook
# Prompts agent to capture learnings and calibrate memory system
###

set -euo pipefail

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
    "message": "📝 Session Complete - Memory System Calibration",
    "prompt": "
## 🧠 Memory System Calibration

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

### If You Learned Something Significant

Run: \`/meta capture-learning\` to add it to the memory system

OR manually update the appropriate file in \`.claude/rules/\`:
- Tools → \`.claude/rules/tools/[toolname].md\`
- Infrastructure → \`.claude/rules/infrastructure/[topic].md\`
- Testing → \`.claude/rules/testing/behavioral-tests.md\`
- Cross-cutting → \`.claude/rules/lessons/$(date +%Y-%m-%d)-[topic].md\`

### Memory Effectiveness Rating (Optional)

Rate this session: [1-10]
- 1-3: Memory wasn't helpful, missing critical info
- 4-6: Memory was somewhat helpful but had gaps
- 7-9: Memory was very helpful, found what I needed
- 10: Perfect - everything I needed was ready at hand

**No action required** if this was a simple session without learnings.

See: \`.claude/rules/00-meta.md\` for memory system guide
    "
  }
}
EOF

# Track session end for calibration metrics
echo "[$timestamp] Memory capture prompt shown" >> "$log_file"

exit 0
