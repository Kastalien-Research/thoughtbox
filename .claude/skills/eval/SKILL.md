---
name: eval
description: View and manage the evaluation harness — session metrics, baselines, trend analysis, and regression detection. The feedback loop that tells the system whether improvements actually improved things.
argument-hint: <metrics|baseline|compare|report> [args]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---

Evaluation harness: $ARGUMENTS

## Commands

Parse the first word of $ARGUMENTS to determine the command:

### `metrics` — Show current session metrics
Collect and display metrics for the current session:

1. Count commits: `git log --oneline --since="today" | wc -l`
2. Count test results: check for recent vitest output or `.eval/metrics/` entries
3. Count beads changes: `bd list --status=closed` recently
4. Token usage: check LangSmith state file if available
5. Pattern usage: check `.dgm/fitness.json` for patterns used this session
6. Session duration: check session start time from logs

Display as:
```
## Current Session Metrics

| Metric | Value | Baseline | Delta |
|--------|-------|----------|-------|
| Commits | 5 | 3.2 avg | +56% |
| Tests passing | 42/42 | 40/42 | +2 |
| Beads closed | 3 | 2.1 avg | +43% |
| Files changed | 12 | 8.5 avg | +41% |
| Patterns used | 7 | 5.3 avg | +32% |
```

### `baseline` — Set or update baselines
1. Read the last N session metric snapshots from `.eval/metrics/`
2. Calculate averages for each metric
3. Write to `.eval/baselines.json`
4. Report what changed

### `compare` — Compare sessions
Usage: `compare --last N` or `compare --session <id>`

1. Load metric snapshots from `.eval/metrics/`
2. Compare against baselines
3. Highlight regressions (metric dropped >10% below baseline)
4. Highlight improvements (metric improved >10% above baseline)

### `report` — Generate weekly evaluation report
1. Load all metrics from the past 7 days
2. Calculate trends (improving, stable, declining)
3. Identify top improvements and top regressions
4. Generate recommendations based on trends

### `capture` — Capture current session metrics
Write a metric snapshot to `.eval/metrics/session-{timestamp}.json`:

```json
{
  "session_id": "<session id>",
  "timestamp": "<ISO 8601>",
  "branch": "<git branch>",
  "metrics": {
    "commits": 0,
    "tests_total": 0,
    "tests_passing": 0,
    "beads_closed": 0,
    "beads_created": 0,
    "files_changed": 0,
    "patterns_referenced": 0,
    "assumptions_verified": 0,
    "escalations": 0,
    "spiral_detections": 0
  },
  "qualitative": {
    "session_focus": "<what the session was about>",
    "memory_usefulness": 0,
    "knowledge_gaps_found": []
  }
}
```

## Notes

- If `.eval/baselines.json` doesn't exist, skip baseline comparisons and suggest running `baseline`
- Metric collection should be best-effort — missing data is noted, not an error
- Regressions trigger a structured escalation suggestion (not automatic action)
