# Critical Bug Fix: Tool Call Capture in Evaluation Harness

**Date**: January 24, 2026
**Severity**: CRITICAL
**Impact**: All evaluation results before this date are INVALID

## The Bug

The reasoning evaluation harness was **silently dropping all tool calls** from Claude Agent SDK messages.

### What Was Broken

```typescript
// BROKEN CODE (before fix)
for (const block of message.message.content) {
  if ('text' in block && block.text) {
    assistantMessages.push({ content: block.text, ... });
  }
  // Tool blocks silently dropped here - NO ERROR, NO WARNING
}
```

**Impact**:
- Tool calls (including Thoughtbox MCP calls) were never captured
- `thoughtboxSession` was always `undefined`
- Treatment runs were indistinguishable from control runs
- All transparency scores were based on text patterns only
- **ALL EVALUATION RESULTS BEFORE JAN 24, 2026 ARE INVALID**

### Why This Was Missed

1. **Silent failure**: No errors or crashes - data was just quietly discarded
2. **Plausible output**: Evaluations completed successfully with detailed results
3. **No ground truth**: No tests asserting tool calls must be captured
4. **Symptom focus**: Agents fixed extraction logic, not data capture
5. **Verification theater**: Checked that code runs, not that results are correct

## The Fix

### 1. Capture All Message Block Types

```typescript
// FIXED CODE (after Jan 24, 2026)
if ('text' in block && block.text) {
  assistantMessages.push({
    type: 'text',
    content: block.text,
    timestamp: new Date().toISOString(),
  });
} else if ('type' in block && block.type === 'tool_use') {
  toolCalls.push({
    type: 'tool_use',
    id: block.id,
    name: block.name,
    input: block.input,
    timestamp: new Date().toISOString(),
  });
} else if ('type' in block && block.type === 'tool_result') {
  toolResults.push({
    type: 'tool_result',
    tool_use_id: block.tool_use_id,
    content: block.content,
    is_error: block.is_error,
    timestamp: new Date().toISOString(),
  });
} else {
  console.warn('Unexpected message block type:', block);
}
```

### 2. Extract Thoughtbox Session from Tool Calls

Replaced heuristic text-pattern searching with actual tool call analysis:

```typescript
async function extractThoughtboxSession(
  toolCalls: ToolCall[],
  sessionId?: string
): Promise<ThoughtboxSession | undefined> {
  // Filter for Thoughtbox MCP tool calls
  const thoughtboxCalls = toolCalls.filter(call =>
    call.name.startsWith('mcp__thoughtbox__') ||
    call.name === 'thoughtbox_gateway'
  );

  if (thoughtboxCalls.length === 0) {
    return undefined;  // Thoughtbox not used
  }

  // Extract session data from actual tool inputs
  return {
    sessionId: extractedSessionId,
    thoughtsCount: thoughtOperations.length,
    thoughts: thoughtOperations.map(...),
    mentalModelsUsed: Array.from(mentalModels),
    branchesCreated: branchOperations.length,
    toolCallsToThoughtbox: thoughtboxCalls.length,
  };
}
```

### 3. Add Validation Assertions

```typescript
// VERIFICATION ASSERTION
if (!thoughtboxUsed) {
  console.warn(`⚠️  WARNING: Treatment run for task ${task.id} never called Thoughtbox MCP.`);
  console.warn(`   This run is NOT a valid test of Thoughtbox efficacy.`);
}
```

### 4. Update Process Metrics

```typescript
export interface ProcessMetrics {
  // ... existing fields ...
  toolCallCount: number;                // NEW: total tool calls
  thoughtboxToolCalls: number;          // NEW: Thoughtbox-specific tool calls
  thoughtboxThoughtsRecorded: number;   // NEW: thoughts recorded via Thoughtbox
  transparencyScore: number;
}
```

### 5. Update Comparison Results

```typescript
export interface ComparisonResult {
  // ... existing fields ...
  thoughtboxUsed: boolean;      // NEW: true if Thoughtbox MCP tools were called
  comparisonValid: boolean;     // NEW: same as thoughtboxUsed
  timestamp: string;
}
```

## Files Modified

### Core Changes
1. **`reasoning-types.ts`**
   - Added `ToolCall`, `ToolResult`, `MessageBlock` interfaces
   - Updated `ThoughtboxSession` with `toolCallsToThoughtbox` and `thoughtsCount`
   - Updated `ControlTrace` and `TreatmentTrace` to include tool call arrays
   - Added `thoughtboxUsed` and `comparisonValid` to `ComparisonResult`
   - Updated `ProcessMetrics` with tool call counts

2. **`reasoning-runner.ts`**
   - Updated `runControl()` to capture all block types
   - Updated `runTreatment()` to capture all block types
   - Replaced heuristic `extractThoughtboxSession()` with tool-call-based version
   - Added validation assertions in `runTreatment()`
   - Updated `runTaskComparison()` to report Thoughtbox usage

3. **`reasoning-metrics.ts`**
   - Updated `calculateProcessMetricsControl()` to use tool call counts
   - Updated `calculateProcessMetricsTreatment()` to use actual tool call data
   - Fixed transparency score calculation to use `thoughtsCount` instead of `thoughts.length`

### Documentation Created
1. **`ARCHITECTURE.md`** - Documents Claude Agent SDK message structure and data flow
2. **`VALIDATION-CHECKLIST.md`** - Comprehensive checklist for validating evaluations
3. **`BUG-FIX-SUMMARY.md`** - This document

### Tests Created
1. **`test-tool-call-capture.ts`** - Unit test verifying tool call capture logic

## Expected Behavior Changes

### Before Fix (BROKEN)
```json
{
  "treatment": {
    "thoughtboxSession": undefined,
    "processMetrics": {
      "toolCallCount": 0,
      "transparencyScore": 70
    }
  }
}
```

### After Fix (CORRECT)
```json
{
  "treatment": {
    "thoughtboxUsed": true,
    "thoughtboxSession": {
      "sessionId": "sess_abc123",
      "thoughtsCount": 5,
      "toolCallsToThoughtbox": 12,
      "mentalModelsUsed": ["decomposition", "five-whys"]
    },
    "processMetrics": {
      "toolCallCount": 12,
      "thoughtboxToolCalls": 12,
      "thoughtboxThoughtsRecorded": 5,
      "transparencyScore": 90
    }
  }
}
```

## Verification Steps

To verify the fix works:

1. **Run unit test**:
   ```bash
   cd dgm-specs/harness
   npx tsx test-tool-call-capture.ts
   ```

2. **Run single evaluation**:
   ```bash
   npm run eval:reasoning -- --task logic-puzzle-01 --runs 1 --mcp-url http://localhost:1731/mcp
   ```

3. **Check treatment run output**:
   - Should see: `✓ Thoughtbox WAS used (N MCP calls)`
   - Should NOT see: `✗ Thoughtbox NOT used`

4. **Inspect results JSON**:
   ```bash
   cat dgm-specs/history/reasoning-runs/[latest].json | jq '.results[0].treatment | {thoughtboxUsed, toolCalls: .trace.toolCalls | length, thoughtsCount: .trace.thoughtboxSession.thoughtsCount}'
   ```

5. **Verify Docker storage**:
   ```bash
   docker exec [container] cat /root/.thoughtbox/projects/[project]/graph.jsonl | wc -l
   ```

## Next Steps

1. **Re-run all evaluations** with fixed harness
2. **Invalidate old results** - mark all results before Jan 24, 2026 as INVALID
3. **Update baseline** - establish new baseline with valid data
4. **Document findings** - update implementation-status.json

## Prevention

To prevent similar bugs:

1. **Always write tests** for data capture
2. **Verify external API usage** against documentation
3. **Add assertions** for expected data presence
4. **Check correctness**, not just completion
5. **Document data structures** from external APIs
6. **Use validation checklists** before declaring results valid

## Historical Context

This bug was present in:
- Commit 3a2fc05 (Jan 24, 11:12) - Initial implementation
- Commit 556b618 (Jan 24, 14:54) - "Fix critical bugs" (didn't fix this one)
- Multiple validation runs (Jan 24, 20:41-21:01) - All produced invalid data

The bug was discovered during manual inspection of evaluation results when investigating why control and treatment runs had identical transparency scores.

## Acknowledgments

This fix was implemented following a comprehensive root cause analysis that traced:
- How the bug was introduced
- Why multiple agents missed it
- What systemic failures allowed it to persist
- How to prevent similar failures in the future

See `ARCHITECTURE.md` for full details on lessons learned.
