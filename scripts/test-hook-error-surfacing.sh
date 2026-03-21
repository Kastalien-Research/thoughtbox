#!/usr/bin/env bash
set -euo pipefail

# Test that hook failures are captured in hook-errors.jsonl
# and that the dispatcher still exits 0.

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERROR_LOG="$PROJECT_DIR/.claude/state/hook-errors.jsonl"
DISPATCHER="$PROJECT_DIR/.claude/hooks/post_tool_use_dispatcher.sh"

# Setup
mkdir -p "$PROJECT_DIR/.claude/state"
backup=""
if [[ -f "$ERROR_LOG" ]]; then
  backup=$(mktemp)
  cp "$ERROR_LOG" "$backup"
fi
: > "$ERROR_LOG"

pass=0
fail=0

check() {
  local desc="$1"
  local result="$2"
  if [[ "$result" == "0" ]]; then
    echo "  PASS: $desc"
    pass=$((pass + 1))
  else
    echo "  FAIL: $desc"
    fail=$((fail + 1))
  fi
}

echo "=== Hook Error Surfacing Tests ==="

# Test 1: Dispatcher exits 0 even with malformed input
echo ""
echo "Test 1: Dispatcher exits 0 with malformed JSON"
echo "not-valid-json" | CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$DISPATCHER" 2>/dev/null
check "dispatcher exit code is 0" "$?"

# Test 2: Dispatcher exits 0 with valid but empty input
echo ""
echo "Test 2: Dispatcher exits 0 with empty JSON object"
echo '{}' | CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$DISPATCHER" 2>/dev/null
check "dispatcher exit code is 0" "$?"

# Test 3: Dispatcher exits 0 with a realistic tool payload
echo ""
echo "Test 3: Dispatcher exits 0 with realistic payload"
echo '{"tool_name":"Bash","tool_input":{"command":"echo hello"},"tool_response":{"stdout":"hello","exit_code":"0"}}' \
  | CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$DISPATCHER" 2>/dev/null
check "dispatcher exit code is 0" "$?"

# Test 4: Individual hooks log errors on malformed input
echo ""
echo "Test 4: ulysses_state_writer handles corrupted current-bead.json"
bead_dir="$PROJECT_DIR/.claude/state/bead-workflow"
mkdir -p "$bead_dir"
# Create a corrupted current-bead.json
echo "CORRUPTED" > "$bead_dir/current-bead.json"
echo '{"tool_name":"Bash","tool_input":{"command":"vitest run"},"tool_response":{"stdout":"FAIL","exit_code":"1"}}' \
  | CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$PROJECT_DIR/.claude/hooks/ulysses_state_writer.sh" 2>/dev/null || true
if grep -q "ulysses_state_writer" "$ERROR_LOG" 2>/dev/null; then
  check "ulysses_state_writer logged error for corrupted JSON" "0"
else
  check "ulysses_state_writer logged error for corrupted JSON" "1"
fi
# Clean up corrupted state
rm -f "$bead_dir/current-bead.json" "$bead_dir/current-bead.json.lock"

# Test 5: Error log is valid JSONL
echo ""
echo "Test 5: hook-errors.jsonl entries are valid JSON"
valid=0
if [[ -s "$ERROR_LOG" ]]; then
  while IFS= read -r line; do
    if echo "$line" | jq -e . >/dev/null 2>&1; then
      :
    else
      valid=1
      echo "  Invalid JSON line: $line"
    fi
  done < "$ERROR_LOG"
  check "all error log entries are valid JSON" "$valid"
else
  echo "  SKIP: no error log entries to validate"
fi

# Summary
echo ""
echo "=== Results: $pass passed, $fail failed ==="

# Restore original error log
if [[ -n "$backup" ]]; then
  cp "$backup" "$ERROR_LOG"
  rm -f "$backup"
else
  rm -f "$ERROR_LOG"
fi

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
