# DGM Specs

**Darwin-Gödel Machine specifications for Thoughtbox's autonomous improvement loop.**

This directory contains the targets, hypotheses, benchmarks, and history that drive Thoughtbox's self-improvement system. Agents read from and write to this directory as part of a continuous cycle: discover ideas → design experiments → run against external benchmarks → integrate successes → learn from failures.

## Core Principle

The improvement loop optimizes against **external validation** - benchmarks and test suites that agents cannot manipulate. Real GitHub issues from real repositories. CI pipelines we don't control. The goal is genuine capability improvement, not metric gaming.

## Directory Structure

```
dgm-specs/
├── README.md              # This file
├── targets/               # What Thoughtbox should be good at (stable)
├── hypotheses/            # Ideas to test (churns frequently)
│   ├── active/            # Currently being evaluated
│   └── tested/            # Completed experiments with results
├── benchmarks/            # How we measure improvement
│   └── registry.yaml      # Pointer to external suites + custom metrics
└── history/               # Append-only run log
    └── runs/              # One file per improvement cycle
```

## Targets

Targets define **what capabilities matter**. These change slowly and represent the north star for improvement efforts.

Each target file should specify:
- **Capability**: What Thoughtbox should be able to do
- **Current state**: Honest assessment of where we are
- **Success criteria**: How we'd know if we achieved it
- **Measurement approach**: Which benchmarks apply

Example targets:
- Context retrieval quality (can agents find relevant prior reasoning?)
- Reasoning chain coherence (do thought sequences make sense?)
- Branch exploration utility (does branching actually help problem-solving?)
- Recovery from corrupted state (can sessions resume gracefully?)

## Hypotheses

Hypotheses are **concrete ideas to test**. Each hypothesis proposes a specific change and predicts its effect.

### Active Hypotheses

Files in `hypotheses/active/` are queued for experimentation. Format:

```markdown
# Hypothesis: [Short name]

## Proposed Change
What specifically to modify in the codebase.

## Predicted Effect
What improvement we expect and why.

## Experiment Design
- Which benchmark(s) to run
- Sample size / iterations
- Success threshold
- Estimated cost (tokens/time)

## Source
Where this idea came from (paper, repo, observation, prior experiment).
```

### Tested Hypotheses

After evaluation, hypotheses move to `hypotheses/tested/` with results appended:

```markdown
## Results
- **Outcome**: Accepted / Rejected / Inconclusive
- **Benchmark scores**: [before] → [after]
- **Cost**: Actual tokens/time consumed
- **Observations**: What we learned beyond pass/fail
- **Follow-up**: New hypotheses spawned, if any

## Integration
If accepted: PR link, commit hash, CLAUDE.md updates made.
If rejected: Why, and what this rules out for future attempts.
```

## Benchmarks

The `benchmarks/registry.yaml` file maps capability targets to concrete evaluation methods.

```yaml
benchmarks:
  - name: swe-bench-lite
    type: external
    url: https://github.com/princeton-nlp/SWE-bench
    targets: [context-retrieval, reasoning-coherence]
    cost_estimate: "$0.50-2.00 per issue"
    notes: "Use verified subset for faster iteration"

  - name: langchain-issues
    type: external-repo
    url: https://github.com/langchain-ai/langchain
    issue_filter: "label:bug created:>2024-01-01"
    targets: [reasoning-coherence]
    cost_estimate: "varies"
    notes: "High agentic user base, good proxy for real-world"

  - name: letta-context-bench
    type: external
    url: https://github.com/letta-ai/letta-evals
    targets: [context-retrieval]
    
  - name: thoughtbox-behavioral
    type: internal
    path: tests/behavioral/
    targets: [all]
    notes: "Agentic test suite - agent-executed, semantically evaluated"
```

### Benchmark Selection Principles

1. **External CI is the source of truth** - if we don't control the test suite, we can't game it
2. **Agentic-heavy repos preferred** - LangChain, LlamaIndex, CrewAI issues reflect real agent usage patterns
3. **Cost-aware iteration** - use cheaper benchmarks for exploration, expensive ones for validation
4. **Multiple signals** - no single benchmark captures everything; triangulate

## History

The `history/runs/` directory contains one JSON file per improvement cycle:

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
  "outcome": "accepted",
  "tokens_consumed": 145000,
  "cost_usd": 4.35,
  "artifacts": {
    "reasoning_trace": "https://github.com/.../actions/runs/.../artifacts/...",
    "pr": "https://github.com/Kastalien-Research/thoughtbox/pull/57"
  },
  "notes": "Increasing critique frequency from every-5th to every-3rd thought improved coherence without significant cost increase."
}
```

This history serves multiple purposes:
- **Audit trail**: How did Thoughtbox get to its current state?
- **Agent context**: What's been tried? What worked? What failed?
- **Cost tracking**: Are we staying within budget?
- **Pattern detection**: Are certain types of changes consistently effective?

## How the Loop Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     IMPROVEMENT CYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DISCOVER                                                    │
│     - Scan arXiv for relevant papers                            │
│     - Search GitHub for promising patterns                      │
│     - Review history for patterns in what worked                │
│     - Check targets for capability gaps                         │
│                                                                 │
│  2. HYPOTHESIZE                                                 │
│     - Write hypothesis file with predicted effect               │
│     - Design experiment with specific benchmarks                │
│     - Estimate cost, set success threshold                      │
│     - Move to hypotheses/active/                                │
│                                                                 │
│  3. EXPERIMENT                                                  │
│     - Implement proposed change on feature branch               │
│     - Run against external benchmarks                           │
│     - Capture reasoning traces (Thoughtbox eating its own tail) │
│     - Record all metrics                                        │
│                                                                 │
│  4. EVALUATE                                                    │
│     - Compare before/after on benchmarks                        │
│     - Check against success threshold                           │
│     - Consider cost/benefit tradeoff                            │
│     - Make accept/reject decision                               │
│                                                                 │
│  5. INTEGRATE (if accepted)                                     │
│     - Open PR with implementation                               │
│     - Update CLAUDE.md with learnings                           │
│     - Move hypothesis to tested/ with results                   │
│     - Update targets if capability improved                     │
│     - Log run to history/                                       │
│                                                                 │
│  5. LEARN (if rejected)                                         │
│     - Document why it failed                                    │
│     - Note what this rules out                                  │
│     - Spawn follow-up hypotheses if applicable                  │
│     - Move hypothesis to tested/ with results                   │
│     - Log run to history/                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Philosophy

**Direct use is the validation mechanism.** Don't build test harness scripts that spawn agents to call thoughtbox - that just measures agent interpretation noise, not server behavior.

To validate thoughtbox works:
1. Use it directly through MCP
2. Observe results in Observatory
3. Check that responses match expectations

If you want to measure improvement, the signal comes from using thoughtbox on real tasks - not from artificial test scenarios run through an agent intermediary.

## For Agents Working in This Directory

### Reading
- Always check `history/runs/` before proposing a hypothesis - don't repeat failed experiments without new information
- Read `targets/` to understand what matters
- Check `hypotheses/tested/` for context on what's been tried

### Writing
- Hypothesis files should be complete enough that another agent could run the experiment
- Be honest in results - rejected hypotheses are valuable data
- Update CLAUDE.md when you learn something that will help future agents
- Keep history entries machine-parseable (valid JSON)

### Cost Awareness
- Estimate before running
- Prefer cheaper benchmarks for early validation
- Expensive runs (>$10) should target high-confidence hypotheses
- Track cumulative spend in history

## Bootstrap State

This directory starts minimal. The first few cycles should:
1. Establish baseline measurements on core benchmarks
2. Document current capability gaps in targets
3. Generate initial hypotheses from the research survey

The system gets smarter as history accumulates.