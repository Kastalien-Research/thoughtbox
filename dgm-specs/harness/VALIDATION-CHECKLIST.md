# Validation Checklist for Reasoning Evaluations

**Use this checklist EVERY TIME before declaring evaluation results valid.**

## Phase 1: Pre-Run Verification

### Environment Setup
- [ ] Thoughtbox MCP server is running (`docker ps | grep thoughtbox`)
- [ ] MCP server is accessible (`curl http://localhost:1731/mcp/v1/health`)
- [ ] Correct git branch and commit hash documented
- [ ] Previous evaluation data backed up (if running re-validation)

### Configuration
- [ ] Number of runs per task is appropriate (minimum 3, recommended 5)
- [ ] MCP server URL is correct in command (`--mcp-url http://localhost:1731/mcp`)
- [ ] Task definitions are correct and unchanged from baseline
- [ ] Scoring rubrics/expected answers are accurate

## Phase 2: During-Run Monitoring

### Real-Time Checks
- [ ] Treatment runs show tool call warnings (if any)
- [ ] No "ZERO tool calls" warnings for treatment runs
- [ ] No "Thoughtbox NOT used" warnings for treatment runs
- [ ] Docker container logs show MCP connections (`docker logs <container>`)
- [ ] Thoughtbox storage is being written (`ls /root/.thoughtbox/projects/` inside container)

### Early Abort Conditions
Abort and investigate if:
- [ ] First treatment run has `thoughtboxUsed: false`
- [ ] First treatment run has `toolCalls.length === 0`
- [ ] MCP server errors appear in logs
- [ ] All treatment transparency scores = all control transparency scores

## Phase 3: Post-Run Data Validation

### Data Capture Validation

For EVERY treatment run, verify:
- [ ] `toolCalls.length > 0` (agent used some tools)
- [ ] `thoughtboxUsed === true` (Thoughtbox MCP tools were called)
- [ ] `thoughtboxSession !== undefined` (session data extracted)
- [ ] `thoughtboxSession.toolCallsToThoughtbox > 0` (actual MCP calls counted)
- [ ] `thoughtboxSession.thoughtsCount > 0` (thoughts were recorded)

For control runs, verify:
- [ ] `thoughtboxUsed === false` (no Thoughtbox in control)
- [ ] `thoughtboxSession === undefined` (no session data)
- [ ] Results are reasonable (not all zeros or all failures)

### Metric Validation

Check that metrics make logical sense:
- [ ] Treatment `transparencyScore` > Control in majority of runs (if Thoughtbox helped)
- [ ] Treatment `processMetrics.thoughtboxToolCalls > 0` for all treatment runs
- [ ] Treatment `processMetrics.thoughtboxThoughtsRecorded > 0` for all treatment runs
- [ ] Delta scores are NOT all zero (treatment must differ from control)
- [ ] Correctness scores are reasonable (0-100 range, not all identical)

### Storage Validation

Verify external storage:
- [ ] Thoughtbox Docker container has entries in graph.jsonl
- [ ] Session IDs in graph.jsonl match session IDs in evaluation results
- [ ] Number of thoughts in graph.jsonl ≈ thoughtsCount in results
- [ ] Timestamps in graph.jsonl align with evaluation run times

## Phase 4: Statistical Validation

### Multi-Run Consistency

For tasks run multiple times:
- [ ] Treatment scores show reasonable variance (not identical across runs)
- [ ] Control scores show reasonable variance (not identical across runs)
- [ ] Variance is not suspiciously low (which suggests data copying)
- [ ] Majority of runs show consistent direction (if claiming effect)

### Statistical Significance

If claiming Thoughtbox improves/regresses:
- [ ] p-value < 0.05 (or document why not required)
- [ ] 95% confidence interval does not include zero (for claimed direction)
- [ ] Effect size (Cohen's d) is reasonable (not tiny or impossibly large)
- [ ] Results are consistent across task categories

### Logical Consistency

Sanity checks:
- [ ] More Thoughtbox usage → higher transparency (general expectation)
- [ ] Correctness scores correlate with task difficulty
- [ ] Quality scores correlate with reasoning depth
- [ ] Results make sense given task design

## Phase 5: Code Review Validation

### Data Processing

Review code that captured this data:
- [ ] Message processing handles ALL block types (text, tool_use, tool_result)
- [ ] No silent data loss (all blocks captured or logged)
- [ ] Tool calls are stored in separate arrays (not mixed with text)
- [ ] Thoughtbox extraction reads tool calls, not text patterns

### Metric Calculation

Review metric computation:
- [ ] Transparency score uses actual tool call counts
- [ ] Process metrics include toolCallCount, thoughtboxToolCalls, thoughtboxThoughtsRecorded
- [ ] Thoughtbox session extraction filters for correct tool names
- [ ] Mental model and branch detection uses tool inputs, not text search

### Assertions

Check that code has validation assertions:
- [ ] Warnings logged if treatment captures zero tool calls
- [ ] Warnings logged if Thoughtbox not used but expected
- [ ] comparisonValid flag set based on thoughtboxUsed
- [ ] Results document whether comparison is valid

## Phase 6: Documentation

### Result Files

Ensure results are properly documented:
- [ ] Git commit hash recorded
- [ ] Timestamp recorded
- [ ] MCP server URL recorded
- [ ] Number of runs per task recorded
- [ ] Task definitions saved with results

### Metadata

Document environmental factors:
- [ ] Claude model version (`claude-sonnet-4-5-20250929`)
- [ ] Temperature setting (1.0)
- [ ] Max turns (25)
- [ ] System prompts used
- [ ] Any special configurations

### Interpretation

Results should include:
- [ ] Summary of what was tested
- [ ] Clear statement of conclusions
- [ ] Confidence level in results
- [ ] Known limitations or caveats
- [ ] Comparison to baseline (if applicable)

## Phase 7: Final Acceptance

### Go/No-Go Decision

Mark evaluation as VALID only if:
- [ ] ALL data capture checks passed
- [ ] ALL metric validation checks passed
- [ ] ALL statistical validation checks passed
- [ ] ALL code review checks passed
- [ ] Results make logical sense
- [ ] No unexplained anomalies
- [ ] Documentation is complete

### Known Issues

Document any issues found:
- [ ] Tasks where Thoughtbox was not used (and why)
- [ ] Outlier results (and investigation)
- [ ] Statistical tests that failed (and implications)
- [ ] Data quality concerns (and mitigation)

## Emergency Checklist: If Results Look Wrong

If results seem suspicious, check:

1. **Treatment = Control scores**: Thoughtbox not actually used
   - Check: `thoughtboxUsed` flags
   - Fix: Verify MCP server, update prompt to encourage usage

2. **All zeros or all failures**: Data not captured
   - Check: Log files, message processing code
   - Fix: Review Claude Agent SDK message structure

3. **Impossibly high deltas**: Bug in metric calculation
   - Check: Metric computation code, test cases
   - Fix: Review formulas, add unit tests

4. **Variance too low**: Results were copied/cached
   - Check: Timestamps, session IDs, Docker logs
   - Fix: Clear caches, ensure fresh runs

5. **Contradictory results**: Data quality issue
   - Check: Raw trace data, tool calls, thought content
   - Fix: Inspect individual runs manually

## Template for Validation Report

After completing this checklist, fill out:

```
EVALUATION VALIDATION REPORT
============================

Run ID: [runId]
Date: [date]
Git Commit: [commit hash]
Evaluator: [agent/human]

VALIDATION RESULTS:
☐ Data Capture: PASS / FAIL
☐ Metrics: PASS / FAIL
☐ Statistics: PASS / FAIL
☐ Code Review: PASS / FAIL

OVERALL VERDICT: VALID / INVALID

FINDINGS:
- [Finding 1]
- [Finding 2]
...

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
...
```

## Historical Note

This checklist was created on **Jan 24, 2026** after discovering a critical bug where the evaluation harness was silently dropping all tool calls, making ALL previous evaluation results invalid.

The bug was: message processing only captured text blocks and ignored tool_use/tool_result blocks, causing:
- `thoughtboxUsed` was always `false`
- `thoughtboxSession` was always `undefined`
- Treatment runs were indistinguishable from control
- All transparency scores were based on text patterns only

**Lesson**: Never trust evaluation results without explicit verification that data was actually captured.
