#!/usr/bin/env bash
###
# Memory System Hook Integrator
# Adds memory system hooks to existing post_tool_use.sh
###

set -euo pipefail

echo "Integrating memory system hooks..."

# Make hooks executable
chmod +x .claude/hooks/session_end_memory.sh
chmod +x .claude/hooks/memory_pattern_detector.sh
chmod +x .claude/hooks/track_file_access.sh

echo "✅ Memory hooks are now executable"

# Instructions for integration
cat <<'EOF'

## Memory System Hooks - Integration Guide

The following hooks have been created to guarantee memory system calibration:

### 1. Session Start (Already Enhanced)
**File**: `.claude/hooks/session_start.sh`
**Purpose**: Loads current-focus.md and shows memory system status
**Status**: ✅ Integrated (modified existing hook)

### 2. Session End Memory Capture
**File**: `.claude/hooks/session_end_memory.sh`
**Purpose**: Prompts agent to capture learnings at session end
**Integration**: Add to Claude Code settings

In `.claude/settings.json`, add:
```json
{
  "hooks": {
    "session_end": ".claude/hooks/session_end_memory.sh"
  }
}
```

### 3. File Access Tracker
**File**: `.claude/hooks/track_file_access.sh`
**Purpose**: Tracks which files are accessed to detect coverage gaps
**Integration**: Call from post_tool_use.sh

Add to `.claude/hooks/post_tool_use.sh`:
```bash
# Near the end, before exit
.claude/hooks/track_file_access.sh <<< "$hook_input" 2>/dev/null || true
```

### 4. Pattern Detector
**File**: `.claude/hooks/memory_pattern_detector.sh`
**Purpose**: Analyzes patterns and persists project-scoped learnings
**Integration**: Run periodically or from post_tool_use.sh

Add to `.claude/hooks/post_tool_use.sh` (conditional, not every tool):
```bash
# Run pattern detection every 10 tool uses
if (( $(($RANDOM % 10)) == 0 )); then
    .claude/hooks/memory_pattern_detector.sh <<< "$hook_input" 2>/dev/null || true
fi
```

OR run manually:
```bash
cat .claude/state/last_tool_use.json | .claude/hooks/memory_pattern_detector.sh
```

### Testing

Test session start enhancement:
```bash
echo '{"session_id": "test", "source": "terminal"}' | .claude/hooks/session_start.sh --load-context
```

Test session end prompt:
```bash
echo '{"session_id": "test", "transcript_path": "~/.claude/transcript.json"}' | .claude/hooks/session_end_memory.sh
```

Test file tracking:
```bash
echo '{"hook_event_name":"PostToolUse","tool_name":"Read","tool_input":{"file_path":"src/index.ts"},"tool_response":{"isError":false}}' | .claude/hooks/track_file_access.sh
```

Test pattern detection:
```bash
echo '{}' | .claude/hooks/memory_pattern_detector.sh
```

### Calibration Workflow

```
Session Start
     ↓
  [Load current-focus.md + memory status]
     ↓
Agent Works
     ↓
  [Track file access on every tool use]
     ↓
  [Detect patterns periodically]
     ↓
Session End
     ↓
  [Prompt for learning capture]
     ↓
Agent Updates Memory
     ↓
  [Memory topology improves]
```

### Calibration Data Location

All calibration data is stored in `.claude/state/`:
- `memory-calibration.log` - Event log
- `memory-calibration.json` - Structured metrics
- `file_access.log` - Files accessed by agents
- `errors.log` - Errors encountered

Project-scoped knowledge memory is stored in:
- `.thoughtbox/projects/<project>/memory/graph.jsonl` (append-only source of truth)

### Analysis Commands

View recent patterns:
```bash
tail -50 .claude/state/memory-calibration.log
```

View calibration metrics:
```bash
jq '.' .claude/state/memory-calibration.json
```

Find coverage gaps:
```bash
jq '.coverage_gaps // []' .claude/state/memory-calibration.json
```

Find repeated issues:
```bash
jq '.repeated_issues // []' .claude/state/memory-calibration.json
```

### Next Steps

1. ✅ Hooks created
2. ⏳ Integrate with post_tool_use.sh (add calls)
3. ⏳ Add session_end hook to settings.json
4. ⏳ Test with real agent session
5. ⏳ Review calibration data after a week

The hooks are ready - just need integration into your existing workflow!

EOF

echo ""
echo "✅ Memory system hooks created successfully"
echo "📖 See output above for integration instructions"
