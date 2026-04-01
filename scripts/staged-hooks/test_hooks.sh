#!/usr/bin/env bash
# Test every hook against the REAL Claude Code JSON shape.
# Run this BEFORE installing hooks. If any test fails, don't install.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_STATE_DIR=$(mktemp -d)
PASS=0
FAIL=0

cleanup() { rm -rf "$TEST_STATE_DIR"; }
trap cleanup EXIT

# Real JSON shape from Claude Code PostToolUse (captured via probe)
make_json() {
  local tool_name="$1" command="${2:-}" stdout="${3:-}" file_path="${4:-}"
  jq -n \
    --arg tn "$tool_name" \
    --arg cmd "$command" \
    --arg out "$stdout" \
    --arg fp "$file_path" \
    '{
      tool_name: $tn,
      tool_input: {command: $cmd, file_path: $fp},
      tool_response: {stdout: $out, stderr: "", interrupted: false}
    }'
}

assert_file_exists() {
  if [[ -f "$1" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $2"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $2 — expected $1 to exist"
  fi
}

assert_file_missing() {
  if [[ ! -f "$1" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $2"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $2 — expected $1 to NOT exist"
  fi
}

assert_json_field() {
  local file="$1" field="$2" expected="$3" label="$4"
  local actual
  actual=$(jq -r "$field" "$file" 2>/dev/null)
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label — expected '$expected', got '$actual'"
  fi
}

echo "=== Testing workflow_state_writer.sh ==="
echo ""

# Test 1: Claim creates state file
echo "Test 1: Claim creates state file"
export CLAUDE_PROJECT_DIR="$TEST_STATE_DIR"
mkdir -p "$TEST_STATE_DIR/.claude/state/bead-workflow"
make_json "Bash" "bd update thoughtbox-abc --claim" "✓ Updated issue: thoughtbox-abc" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_file_exists "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" "state file created"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".bead_id" "thoughtbox-abc" "task_id correct"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".hypothesis_stated" "false" "hypothesis_stated is false"

# Test 2: Notes sets hypothesis_stated
echo "Test 2: Notes sets hypothesis_stated"
make_json "Bash" "bd update thoughtbox-abc --notes=\"Hypothesis: test\"" "✓ Updated" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".hypothesis_stated" "true" "hypothesis_stated is true"

# Test 3: Edit to src/ clears test sentinel
echo "Test 3: Edit clears test sentinel"
touch "$TEST_STATE_DIR/.claude/state/bead-workflow/tests-passed-since-edit"
make_json "Edit" "" "" "/project/src/foo.ts" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_file_missing "$TEST_STATE_DIR/.claude/state/bead-workflow/tests-passed-since-edit" "sentinel cleared"

# Test 4: Passing vitest creates test sentinel
echo "Test 4: Passing vitest creates sentinel"
make_json "Bash" "npx vitest run" "43 passed" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_file_exists "$TEST_STATE_DIR/.claude/state/bead-workflow/tests-passed-since-edit" "sentinel created"

# Test 5: Failing vitest does NOT create sentinel
echo "Test 5: Failing vitest does not create sentinel"
rm -f "$TEST_STATE_DIR/.claude/state/bead-workflow/tests-passed-since-edit"
make_json "Bash" "npx vitest run" "2 FAIL 41 passed" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_file_missing "$TEST_STATE_DIR/.claude/state/bead-workflow/tests-passed-since-edit" "sentinel not created on FAIL"

# Test 6: Close creates pending-validation
echo "Test 6: Close creates pending-validation"
make_json "Bash" "bd close thoughtbox-abc --reason=done" "✓ Closed thoughtbox-abc" \
  | "$SCRIPT_DIR/bead_workflow_state_writer.sh"
assert_file_exists "$TEST_STATE_DIR/.claude/state/bead-workflow/pending-validation.json" "pending-validation created"
assert_file_missing "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" "current-bead cleared"

echo ""
echo "=== Testing ulysses_state_writer.sh ==="
echo ""

# Reset state for ulysses tests
rm -rf "$TEST_STATE_DIR/.claude/state"
mkdir -p "$TEST_STATE_DIR/.claude/state/bead-workflow"
mkdir -p "$TEST_STATE_DIR/.claude/state/ulysses"

# Create state with surprise_count
jq -n '{bead_id: "thoughtbox-xyz", hypothesis_stated: true, surprise_count: 0}' \
  > "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json"

# Test 7: Command failure increments surprise_count
echo "Test 7: Command failure increments surprise_count"
jq -n '{tool_name: "Bash", tool_input: {command: "npx supabase db reset"}, tool_response: {stdout: "ERROR", stderr: "fail", exit_code: 1}}' \
  | "$SCRIPT_DIR/ulysses_state_writer.sh"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".surprise_count" "1" "surprise_count is 1"
assert_file_missing "$TEST_STATE_DIR/.claude/state/ulysses/reflect-required" "no reflect yet"

# Test 8: Second failure creates reflect-required
echo "Test 8: Second failure creates reflect-required"
jq -n '{tool_name: "Bash", tool_input: {command: "npx supabase db reset"}, tool_response: {stdout: "ERROR again", stderr: "fail", exit_code: 1}}' \
  | "$SCRIPT_DIR/ulysses_state_writer.sh"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".surprise_count" "2" "surprise_count is 2"
assert_file_exists "$TEST_STATE_DIR/.claude/state/ulysses/reflect-required" "reflect-required created"

# Test 9: REFLECT clears sentinel and resets count
echo "Test 9: REFLECT clears sentinel"
make_json "Bash" "ulysses reflect --hypothesis test" "Reflected" \
  | "$SCRIPT_DIR/ulysses_state_writer.sh"
assert_file_missing "$TEST_STATE_DIR/.claude/state/ulysses/reflect-required" "sentinel cleared"
assert_json_field "$TEST_STATE_DIR/.claude/state/bead-workflow/current-bead.json" ".surprise_count" "0" "surprise_count reset"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]] && echo "ALL TESTS PASS" || echo "FAILURES DETECTED"
exit "$FAIL"
