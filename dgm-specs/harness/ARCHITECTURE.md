# Evaluation Harness Architecture

## Critical Data Structures

### Claude Agent SDK Message Structure

Messages from the Claude Agent SDK contain a `content` array with multiple block types:

```typescript
type MessageContent = Array<
  | { text: string }                      // Text blocks
  | {                                      // Tool use blocks
      type: 'tool_use';
      id: string;
      name: string;
      input: any;
    }
  | {                                      // Tool result blocks
      type: 'tool_result';
      tool_use_id: string;
      content: any;
      is_error?: boolean;
    }
>;
```

**CRITICAL**: Messages can contain ANY combination of these block types. A single message may have multiple text blocks, tool_use blocks, and tool_result blocks.

### The Bug (Fixed Jan 24, 2026)

**What went wrong**: The original implementation only captured text blocks:

```typescript
// BROKEN CODE (before fix)
for (const block of message.message.content) {
  if ('text' in block && block.text) {
    assistantMessages.push({ content: block.text, ... });
  }
  // Tool blocks silently dropped - NO ERROR, NO WARNING
}
```

**Impact**:
- ALL tool calls were lost (including Thoughtbox MCP calls)
- Treatment runs were indistinguishable from control runs
- `thoughtboxSession` was always `undefined` because heuristic extraction searched text for patterns that didn't exist
- All evaluation results before Jan 24, 2026 are **INVALID**

**Root cause**: Silent data loss - the bug didn't crash or error, it just quietly discarded critical data.

### The Fix

Now captures ALL block types:

```typescript
// FIXED CODE (after Jan 24, 2026)
if ('text' in block && block.text) {
  assistantMessages.push({ type: 'text', content: block.text, ... });
} else if ('type' in block && block.type === 'tool_use') {
  toolCalls.push({ type: 'tool_use', id: block.id, name: block.name, input: block.input, ... });
} else if ('type' in block && block.type === 'tool_result') {
  toolResults.push({ type: 'tool_result', tool_use_id: block.tool_use_id, content: block.content, ... });
} else {
  console.warn('Unexpected message block type:', block);
}
```

**Key improvements**:
1. Explicit handling of ALL known block types
2. Warning logged for unexpected types (no silent failures)
3. Tool calls and results stored separately for analysis
4. Thoughtbox session extracted from ACTUAL tool calls, not text patterns

## Data Flow

```
Claude Agent SDK
      ↓
Message with mixed content blocks:
  - text: "I'll solve this step by step..."
  - tool_use: { name: "thoughtbox_gateway", input: {...} }
  - text: "Based on my structured thinking..."
  - tool_result: { tool_use_id: "...", content: {...} }
      ↓
Harness processes ALL blocks (not just text)
      ↓
assistantMessages[] + toolCalls[] + toolResults[]
      ↓
extractThoughtboxSession(toolCalls)
      ↓
thoughtboxUsed flag + session data
      ↓
Process metrics (transparencyScore uses actual tool call counts)
      ↓
Comparison results (VALID only if thoughtboxUsed = true)
```

## Required Assertions for Evaluations

### Data Capture Validation

Before declaring any evaluation valid, verify:

```typescript
// Treatment runs MUST capture tool calls
assert(treatmentTrace.toolCalls.length > 0, 'Treatment captured zero tool calls');

// Treatment runs MUST have thoughtboxUsed flag
assert(treatmentTrace.thoughtboxUsed === true, 'Thoughtbox was not used');

// Thoughtbox session MUST be defined
assert(treatmentTrace.thoughtboxSession !== undefined, 'Thoughtbox session missing');

// Thoughtbox storage MUST be written
// (check Docker container: ls /root/.thoughtbox/projects/)
```

### Metric Validation

```typescript
// Treatment should differ from control in expected ways
if (treatmentTrace.thoughtboxUsed) {
  // Transparency score should be higher (Thoughtbox provides structure)
  assert(
    treatmentProcessMetrics.transparencyScore > controlProcessMetrics.transparencyScore,
    'Thoughtbox did not improve transparency'
  );

  // Tool call counts should reflect actual usage
  assert(
    treatmentProcessMetrics.thoughtboxToolCalls > 0,
    'thoughtboxToolCalls is zero despite thoughtboxUsed=true'
  );

  // Thoughts should be recorded
  assert(
    treatmentProcessMetrics.thoughtboxThoughtsRecorded > 0,
    'No thoughts recorded despite Thoughtbox usage'
  );
}
```

### Statistical Validation

```typescript
// Multiple runs should show consistent treatment effects
const deltas = runs.map(r => r.delta.overallScore);
const avgDelta = mean(deltas);
const [ciLower, ciUpper] = confidenceInterval(deltas);

// If claiming Thoughtbox helps, confidence interval should not include zero
if (avgDelta > 0) {
  assert(ciLower > -5, 'Effect is not statistically robust');
}
```

## Validation Checklist

Before declaring validation complete:

**Data Capture**:
- [ ] Treatment runs have `toolCalls.length > 0`
- [ ] Treatment runs have `thoughtboxUsed = true`
- [ ] Treatment runs have `thoughtboxSession !== undefined`
- [ ] Thoughtbox Docker container has non-empty graph.jsonl
- [ ] Log output shows MCP tool invocations

**Metrics**:
- [ ] Treatment `transparencyScore` > Control (if Thoughtbox helped)
- [ ] Treatment `processMetrics.thoughtboxToolCalls > 0`
- [ ] Treatment `processMetrics.thoughtboxThoughtsRecorded > 0`
- [ ] Delta scores are not all zero (treatment differs from control)

**Statistical**:
- [ ] Multiple runs show consistent treatment effects
- [ ] Confidence intervals don't include zero (if claiming significance)
- [ ] Results make logical sense (e.g., more thoughts → higher transparency)

**Code Review**:
- [ ] Message processing code handles all block types
- [ ] No silent data loss (all blocks logged or captured)
- [ ] Assertions verify expected data is present
- [ ] Tests cover tool call capture scenarios

## Lessons Learned

### Why Every Agent Missed This Bug

1. **Silent Failure**: No errors or warnings when tool calls were dropped
2. **Plausible Output**: Evaluation completed successfully with detailed results
3. **No Ground Truth**: No tests asserting "tool calls MUST be captured"
4. **Symptom Focus**: Agents fixed symptoms (bad extraction) not root cause (missing data)
5. **Verification Theater**: Checked completion, not correctness

### Prevention Strategies

1. **Always verify data capture**:
   - Read external API documentation (Claude Agent SDK message structure)
   - Write tests that assert ALL data types are captured
   - Log warnings for unexpected or dropped data

2. **Check correctness, not just completion**:
   - Validation should verify results make sense
   - Compare control vs treatment for expected deltas
   - Investigate suspiciously similar results

3. **Root cause analysis**:
   - When fixing bugs, trace to architectural root cause
   - Don't just fix symptoms
   - Ask "Are we capturing all the data from the source?"

4. **Documentation**:
   - Document external API data structures
   - Document required assertions
   - Document data flow from source to storage

## References

- **Claude Agent SDK**: Message structure with text/tool_use/tool_result blocks
- **Thoughtbox MCP Protocol**: Tool naming (`thoughtbox_gateway`, `mcp__thoughtbox__*`)
- **Evaluation Types**: See `reasoning-types.ts`
- **Metrics Calculation**: See `reasoning-metrics.ts`
