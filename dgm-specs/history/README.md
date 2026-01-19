# History

**Append-only run log for improvement cycles.**

## Directory Structure

```
history/
├── README.md    # This file
└── runs/        # One JSON file per improvement cycle
```

## Run File Format

Each run file is named `YYYY-MM-DD-NNN.json` and contains:

```json
{
  "run_id": "2026-01-19-001",
  "started_at": "2026-01-19T14:30:00Z",
  "completed_at": "2026-01-19T15:45:00Z",
  "trigger": "scheduled | manual | event",
  "hypothesis": "hypotheses/active/001-sampling-critique-frequency.md",
  "benchmarks_run": ["swe-bench-lite", "thoughtbox-behavioral"],
  "results": {
    "swe-bench-lite": { "before": 0.32, "after": 0.35, "delta": "+0.03" },
    "thoughtbox-behavioral": { "before": 0.89, "after": 0.91, "delta": "+0.02" }
  },
  "outcome": "accepted | rejected | inconclusive",
  "tokens_consumed": 145000,
  "cost_usd": 4.35,
  "artifacts": {
    "reasoning_trace": "url-to-trace",
    "pr": "url-to-pr"
  },
  "notes": "Free-form observations"
}
```

## Purpose

- **Audit trail**: How did Thoughtbox get to its current state?
- **Agent context**: What's been tried? What worked? What failed?
- **Cost tracking**: Are we staying within budget?
- **Pattern detection**: Are certain types of changes consistently effective?

## Querying History

```bash
# Total spend
jq -s 'map(.cost_usd) | add' runs/*.json

# Accepted hypotheses
jq -s 'map(select(.outcome == "accepted"))' runs/*.json

# Runs by benchmark
jq -s 'map(select(.benchmarks_run | contains(["swe-bench-lite"])))' runs/*.json
```
