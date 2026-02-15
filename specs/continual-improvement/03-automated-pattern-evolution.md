# SPEC-CI-003: Automated Pattern Evolution (DGM/CycleQD)

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Author**: Agent-assisted (Claude Opus 4.6)
**Context**: Thoughtbox Continual Self-Improvement System
**Parent**: [00-overview.md](./00-overview.md) -- Gap 3
**Source Design**: `.claude/commands/meta/dgm-evolve.md`

---

## Problem Statement

The Darwin Godel Machine (DGM) and CycleQD pattern evolution architecture is fully designed in `.claude/commands/meta/dgm-evolve.md` (506 lines) but is entirely manual and has zero persistent state. To run an evolution cycle, a human must invoke `/meta:dgm-evolve`. The evolution tracking files (`lineage.json`, `fitness.json`, `niche-grid.json`, `experiments/`, `graveyard/`) do not exist. No fitness signals are collected automatically. No mutations are generated without human initiation. No niche grid is maintained.

This means the system's most powerful self-improvement mechanism -- empirical pattern evolution -- is a dead letter. Patterns in `.claude/rules/` accumulate but never decay, never compete, and never evolve. There is no feedback loop between pattern usage and pattern survival.

### What This Costs

1. **Pattern bloat**: Rules accumulate without pruning. Agents load stale patterns that waste context window.
2. **No learning feedback**: A pattern that consistently fails is never demoted. A pattern that consistently succeeds gets no reinforcement.
3. **Manual bottleneck**: The solo founder must remember to run `/dgm-evolve` -- which has never happened in production because the state files don't exist.
4. **Diversity collapse**: Without CycleQD niche pressure, patterns cluster around whatever the most recent session needed, not what the system broadly requires.
5. **Lost stepping stones**: Failed approaches are abandoned in git history, not archived with resurrection conditions.

### Key Insight

The `/meta:dgm-evolve` command already contains the full algorithm. This spec is about **automating** that algorithm -- making it run without human invocation, while still requiring human approval for pattern promotions/demotions that affect governance files (CODEOWNERS, RULES.md, etc.).

---

## Current State (Verified 2026-02-11)

### What Exists

| Component | Location | Status |
|-----------|----------|--------|
| DGM design doc | `.claude/commands/meta/dgm-evolve.md` | Complete (506 lines), defines full algorithm, never runs automatically |
| Continual calibration rule | `.claude/rules/continual-calibration.md` | Active -- defines HOT/WARM/COLD freshness tags, fitness tracking principles, anti-proof principle |
| File access tracking hook | `.claude/hooks/track_file_access.sh` | Active -- logs every Read/Write/Edit to `.claude/state/file_access.jsonl` (JSONL, capped at 1000 entries) |
| Memory pattern detector hook | `.claude/hooks/memory_pattern_detector.sh` | Active -- detects repeated file access and error patterns |
| Session end memory hook | `.claude/hooks/session_end_memory.sh` | Active -- prompts agents for session calibration feedback |
| Knowledge memory bridge | `.claude/hooks/knowledge_memory_bridge.mjs` | Active -- writes entities/observations to `.thoughtbox/projects/<id>/memory/graph.jsonl` |
| Hook settings | `.claude/settings.json` | Active -- PostToolUse chain: `post_tool_use.sh`, `specsuite_post_tool_use.sh`, `track_file_access.sh` (3000ms), `memory_pattern_detector.sh` (8000ms) |
| File access log (JSONL) | `.claude/state/file_access.jsonl` | Active -- structured `{"ts","tool","path"}` entries, capped at 1000 lines |
| File access log (plain) | `.claude/state/file_access.log` | Active -- `[timestamp] path` format, capped at 500 lines |
| Memory calibration state | `.claude/state/memory-calibration.json` | Active -- tracks coverage gaps and repeated issues |
| Observatory emitter | `src/observatory/emitter.ts` | Active -- fire-and-forget event bus, supports `improvement:event` and `hub:event` |
| SIL GitHub Action | `.github/workflows/self-improvement-loop.yml` | Active -- weekly on Sundays 2am UTC, budget-controlled, creates PR for human review |
| Active rules | `.claude/rules/*.md` | 7 files: RULES.md, escalation-protocol.md, spiral-detection.md, ooda-foundation.md, continual-calibration.md, git-workflow.md, post-edit.md |
| Learning capture command | `.claude/commands/meta/capture-learning.md` | Active -- structured learning entry format with freshness tags and domain routing |

### What Does NOT Exist

| Component | Planned Location | Status |
|-----------|-----------------|--------|
| Evolution directory | `.claude/rules/evolution/` | Does not exist |
| Lineage tracking | `.claude/rules/evolution/lineage.json` | Does not exist |
| Fitness scores | `.claude/rules/evolution/fitness.json` | Does not exist |
| Niche grid state | `.claude/rules/evolution/niche-grid.json` | Does not exist |
| Cycle state | `.claude/rules/evolution/cycle-state.json` | Does not exist |
| Experiment patterns | `.claude/rules/evolution/experiments/` | Does not exist |
| Graveyard patterns | `.claude/rules/evolution/graveyard/` | Does not exist |
| Signal collection file | `.claude/rules/evolution/signals.jsonl` | Does not exist |
| Fitness aggregation script | `.claude/scripts/dgm-aggregate.sh` | Does not exist |
| Niche competition script | `.claude/scripts/dgm-compete.sh` | Does not exist |
| Pruning script | `.claude/scripts/dgm-prune.sh` | Does not exist |
| Evolution GitHub Action | `.github/workflows/dgm-evolution.yml` | Does not exist |
| Observatory evolution events | (no event type defined) | Does not exist |

---

## 1. Automated Fitness Tracking

### The DGM Fitness Formula

```
fitness = (usage_count * 0.4) + (success_signals * 0.4) + (recency_bonus * 0.2)
```

Where:
- `usage_count`: Normalized to 0-10 scale relative to population. Raw count of times the pattern was accessed or explicitly referenced.
- `success_signals`: Normalized to 0-10 scale relative to population. Count of explicit "this pattern helped" signals minus failure signals (floor 0).
- `recency_bonus`: Time-decaying bonus based on last access:
  - Last access < 7 days ago: `1.0`
  - Last access < 30 days ago: `0.5`
  - Last access < 90 days ago: `0.2`
  - Last access >= 90 days ago: `0.0`

The formula is deliberately simple. Weights (0.4/0.4/0.2) are fixed constants in v1 and not themselves evolvable (meta-evolution is out of scope).

### Signal Types

| Signal | Source | Trigger | Weight | Direction |
|--------|--------|---------|--------|-----------|
| **access** | `track_file_access.sh` hook | Any Read/Write/Edit of a `.claude/rules/` file | 1x (implicit) | Positive |
| **reference** | `fitness_signal_collector.sh` hook | Agent reads rule file then completes task successfully | 2x (implicit) | Positive |
| **success** | Agent explicit signal / session calibration | Agent reports pattern helped solve problem | 4x (explicit) | Positive |
| **failure** | Agent explicit signal / session calibration | Agent reports pattern did not help or was misleading | 4x (explicit) | Negative |
| **convergence** | Cross-session analysis | Multiple independent sessions discover same pattern | 3x (implicit) | Positive |
| **decay** | Time-based (aggregation script) | Pattern not accessed in N days | N/A | Negative (reduces recency_bonus) |

### Hook: Enhance `track_file_access.sh` (Existing)

The existing hook at `.claude/hooks/track_file_access.sh` already logs every Read/Write/Edit to `.claude/state/file_access.jsonl`. Add a lightweight side-effect that also appends a fitness signal when a `.claude/rules/` file is accessed.

Insert after line 58 (the existing JSONL append):

```bash
# Emit fitness signal for rule file access
if [[ "$abs_path" == *".claude/rules/"* ]]; then
  SIGNALS_FILE="$CLAUDE_PROJECT_DIR/.claude/rules/evolution/signals.jsonl"
  if [[ -d "$(dirname "$SIGNALS_FILE")" ]]; then
    echo "{\"ts\":\"$timestamp\",\"signal\":\"access\",\"pattern\":\"$abs_path\",\"tool\":\"$tool_name\"}" >> "$SIGNALS_FILE"
  fi
fi
```

Constraint: The `signals.jsonl` file must be capped at 10,000 lines (managed by the aggregation script, not the hook). The hook must remain silent (exit 0, no stdout). Must stay within 3000ms timeout.

### Hook: Enhance `session_end_memory.sh` (Existing)

The existing session-end hook prompts agents for memory capture. Add explicit fitness signal instructions to the calibration prompt:

```markdown
### Pattern Fitness Signals (Optional)

If you used patterns from `.claude/rules/` during this session, record their effectiveness:

# Pattern helped solve a problem
echo '{"ts":"<ISO-8601>","signal":"success","pattern":".claude/rules/<file>.md","context":"<brief reason>"}' >> .claude/rules/evolution/signals.jsonl

# Pattern was misleading or unhelpful
echo '{"ts":"<ISO-8601>","signal":"failure","pattern":".claude/rules/<file>.md","context":"<brief reason>"}' >> .claude/rules/evolution/signals.jsonl
```

### Hook: New `fitness_signal_collector.sh` (PostToolUse)

A new hook that detects when an agent references a pattern in its reasoning and correlates rule file reads with subsequent task outcomes.

**Detection heuristic**: Maintain a ring buffer of the last 5 rule file reads in `.claude/state/fitness_buffer.json`. On each PostToolUse:
- If the current tool succeeded and a rule file was read within the last 5 tool calls, emit a weak `reference` signal.
- If the current tool failed and a rule file was read within the last 3 tool calls, emit a weak `failure` signal.

**Registration** in `.claude/settings.json` (add to PostToolUse chain):

```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/fitness_signal_collector.sh",
  "timeout": 3000,
  "continueOnError": true
}
```

### Signal File Schema

All signals are appended to `.claude/rules/evolution/signals.jsonl` (append-only JSONL):

```jsonc
// One line per signal, no trailing comma
{"ts":"2026-02-11T15:30:00Z","signal":"access","pattern":".claude/rules/ooda-foundation.md","tool":"Read"}
{"ts":"2026-02-11T15:31:00Z","signal":"success","pattern":".claude/rules/escalation-protocol.md","context":"Used structured decision format for API migration"}
{"ts":"2026-02-11T15:32:00Z","signal":"failure","pattern":".claude/rules/post-edit.md","context":"Commit step unnecessary for doc-only changes"}
{"ts":"2026-02-11T15:33:00Z","signal":"reference","pattern":".claude/rules/spiral-detection.md","tool":"Bash","weight":0.5}
```

Fields:
- `ts` (required): ISO 8601 timestamp
- `signal` (required): `"access"` | `"reference"` | `"success"` | `"failure"` | `"convergence"` | `"decay"`
- `pattern` (required): Absolute or relative path to the pattern file
- `tool` (optional): Tool name that triggered the signal
- `context` (optional): Human-readable reason for explicit signals
- `sessionId` (optional): Session identifier for cross-session analysis
- `agentId` (optional): Agent identifier for multi-agent scenarios
- `weight` (optional): Override weight (default varies by signal type)

---

## 2. The CycleQD Niche Grid

### Dimensions

The grid is 5x5 with two Behavior Characteristics (BCs):

| Axis | BC | Range | Low (1) | High (5) |
|------|-----|-------|---------|----------|
| Y (rows) | **Specificity** | 1-5 | Fix for a specific bug or workaround | Universal principle applicable everywhere |
| X (cols) | **Applicability** | 1-5 | Single domain only (e.g., only testing) | Cross-cutting concern (applies to all domains) |

```
                    APPLICABILITY
                 (domain-specific --> cross-cutting)
                      1    2    3    4    5
                   +----+----+----+----+----+
               1   |    |    |    |    |    |  Specific bug fix
  S                +----+----+----+----+----+
  P            2   |    |    |    |    |    |  Domain workaround
  E                +----+----+----+----+----+
  C            3   |    |    |    |    |    |  Domain pattern
  I                +----+----+----+----+----+
  F            4   |    |    |    |    |    |  Cross-domain principle
  I                +----+----+----+----+----+
  C            5   |    |    |    |    |    |  Universal principle
  I                +----+----+----+----+----+
  T
  Y
```

Each cell holds **at most one champion pattern**. 25 possible niches. This ensures diversity -- the system cannot converge to a monoculture of similar patterns.

### BC Assignment

Patterns receive BC scores through two mechanisms:

**Manual assignment** (preferred): Author specifies in frontmatter when creating or mutating a pattern.

**Heuristic inference** (fallback): When no frontmatter exists, compute from context:
- **Specificity**:
  - Title/content contains "specific", "bug", "workaround", "fix" --> 1-2
  - Contains "pattern", "approach", "technique" --> 3
  - Contains "principle", "foundation", "universal", "always" --> 4-5
- **Applicability**:
  - In a domain-specific subdirectory (e.g., `tools/`, `testing/`) --> 1-2
  - Referenced across 2+ distinct domains in `file_access.jsonl` --> 3-4
  - In root `.claude/rules/` with no domain qualifier --> 4-5

### Competition Rules

1. **One champion per cell**: No two patterns share a niche.
2. **Incumbent bonus**: +1 fitness for the current champion (stability preference).
3. **Diversity bonus**: +2 fitness for patterns filling a previously empty niche (coverage incentive).
4. **Challenger threshold**: A challenger must beat the incumbent by >1 fitness to take over.
5. **New pattern placement**: Patterns without a niche go to best-fit empty cell first. Only compete against incumbents if all matching cells are occupied.
6. **Experimental patterns**: Can challenge but only promote after 3+ explicit success signals OR 30+ days of positive fitness trend AND outperforming parent by >1 fitness.

### Niche Grid State File

**Location**: `.claude/rules/evolution/niche-grid.json`

```json
{
  "version": 1,
  "lastUpdated": "2026-02-11T00:00:00Z",
  "currentQualityFocus": "USAGE",
  "currentRound": 1,
  "qualityFocusCycle": ["USAGE", "SUCCESS_RATE", "GENERALIZABILITY", "CLARITY", "EFFICIENCY"],
  "gridSize": [5, 5],
  "axisLabels": {
    "y": "Specificity (specific bug fix --> universal principle)",
    "x": "Applicability (single domain --> cross-cutting)"
  },
  "grid": {
    "1,1": null,
    "1,2": null,
    "1,3": null,
    "1,4": null,
    "1,5": null,
    "2,1": null,
    "2,2": null,
    "2,3": null,
    "2,4": null,
    "2,5": null,
    "3,1": null,
    "3,2": null,
    "3,3": null,
    "3,4": null,
    "3,5": null,
    "4,1": null,
    "4,2": null,
    "4,3": null,
    "4,4": null,
    "4,5": "rules-ooda-foundation",
    "5,1": null,
    "5,2": null,
    "5,3": null,
    "5,4": "rules-continual-calibration",
    "5,5": null
  }
}
```

---

## 3. Cyclic Quality Focus Rotation

Instead of always optimizing for the same metric, CycleQD rotates focus across five quality dimensions. Each weekly competition cycle advances to the next focus:

```
Round 1: USAGE          --> Patterns referenced most frequently win their niche
Round 2: SUCCESS_RATE   --> Patterns with highest success/failure ratio win
Round 3: GENERALIZABILITY --> Patterns with highest applicability BC win
Round 4: CLARITY        --> Simplest patterns (inverse of complexity BC) win
Round 5: EFFICIENCY     --> Patterns with highest usage per complexity unit win
[Cycle repeats from Round 1]
```

### Scoring by Quality Focus

| Focus | Metric Used | Formula |
|-------|-------------|---------|
| USAGE | Raw usage count | `usageCount` (normalized 0-10) |
| SUCCESS_RATE | Success ratio | `successSignals / max(1, successSignals + failureSignals)` (scaled 0-10) |
| GENERALIZABILITY | Applicability BC | `bcs.applicability * 2` (scaled 0-10) |
| CLARITY | Inverse complexity | `(6 - bcs.complexity) * 2` (scaled 0-10, lower complexity = higher score) |
| EFFICIENCY | Usage per complexity | `usageCount / max(1, bcs.complexity)` (normalized 0-10) |

The quality focus determines which metric is used for niche competition during that round. All patterns retain their base fitness score; the quality focus metric is applied as a **secondary sort** within each niche cell.

### Cycle State File

**Location**: `.claude/rules/evolution/cycle-state.json`

```json
{
  "version": 1,
  "currentFocus": "USAGE",
  "currentRound": 1,
  "lastCycleAdvanced": null,
  "lastFullEvolution": null,
  "lastPrune": null,
  "minCyclesBeforePrune": 4,
  "totalCycles": 0,
  "totalMutations": 0,
  "totalPruned": 0,
  "totalPromoted": 0
}
```

---

## 4. Mutation Generation

When the weekly competition cycle identifies high-fitness patterns (top 3 by current quality focus), it generates mutations -- variant patterns derived from the champion.

### Mutation Types

| Type | Description | Example |
|------|-------------|---------|
| **Generalization** | Broaden the pattern's scope, extract the underlying principle | OODA Foundation --> "All iterative processes follow Observe-Orient-Decide-Act" |
| **Specialization** | Narrow to a specific context or domain | OODA Foundation --> "Fast-Loop OODA for sub-second decisions (collapse Orient+Decide)" |
| **Combination** | Merge with an adjacent niche champion | OODA + Spiral Detection --> "OODA with built-in spiral circuit breakers" |
| **Inversion** | Document the anti-pattern (what NOT to do) | OODA Foundation --> "Single-pass thinking: running the loop once and stopping" |

### Mutation Limits

- Maximum 5 mutations per weekly cycle (prevent mutation explosion)
- Each high-fitness pattern generates at most 2 mutations per cycle
- Mutations have a 30-day expiry. If not promoted within 30 days, they are either:
  - Extended once (30 more days) if neutral (insufficient data)
  - Archived to graveyard if underperforming

### Mutation File Format

**Location**: `.claude/rules/evolution/experiments/<id>.md`

```yaml
---
status: experimental
patternId: exp-ooda-fast-loop
parent: rules/ooda-foundation.md
mutationType: specialization
created: 2026-02-16
expires: 2026-03-16
nicheCell: [3, 5]
bcs:
  specificity: 3
  applicability: 5
  complexity: 3
  maturity: 1
---

# Fast-Loop OODA for Sub-Second Decisions

**Derived from**: `.claude/rules/ooda-foundation.md` (specialization)

## Pattern

For tight feedback loops where latency matters (linting, type checking, simple file reads),
collapse Orient and Decide into a single recognition-primed step:

1. **Observe**: What signal just arrived?
2. **Recognize-Act**: Match against known patterns; execute the first match immediately.
3. **Return to Observe**.

Skip the full Orient/Decide deliberation when:
- The action is reversible (can undo if wrong)
- The decision space is small (<5 options)
- The feedback cycle is <10 seconds

## Anti-Pattern

Using fast-loop OODA for irreversible decisions (deployments, data deletion, merges to main).
```

### Mutation Generation Algorithm

```
For each of the top 3 patterns by current quality focus:
  1. Read the pattern file content
  2. Determine which mutation types are applicable:
     - Generalization: Always applicable (every pattern has a broader principle)
     - Specialization: Applicable if BC specificity < 4 (room to narrow)
     - Combination: Applicable if an adjacent niche cell has a champion
     - Inversion: Applicable if the pattern describes a positive practice
  3. Select the 2 most promising mutation types
  4. Generate mutation content:
     - In automated mode (GitHub Action): Use LLM to generate variant content
     - Budget per mutation: $0.10 max (short prompt, single completion)
  5. Assign BCs to mutation based on type:
     - Generalization: specificity += 1, applicability += 1
     - Specialization: specificity -= 1, applicability -= 1
     - Combination: average of both parents' BCs
     - Inversion: same BCs as parent
  6. Write mutation file to experiments/ with frontmatter
  7. Register in lineage.json (parent -> child relationship)
  8. Register in fitness.json with initial fitness 0.0
```

---

## 5. Stepping Stone Archive (Graveyard)

Failed patterns are not deleted. They are moved to the graveyard with full metadata and content, preserving them as potential stepping stones for future breakthroughs.

### Graveyard File Format

**Location**: `.claude/rules/evolution/graveyard/<id>.md`

```yaml
---
deprecated: 2026-03-01
patternId: rules-old-approach
reason: "Fitness 0.3 -- not accessed in 95 days, no success signals in 60 days"
replacement: rules/evolved-pattern.md
resurrectionIf: "If the replacement pattern fails in domain X, consider reviving with modifications for Y context"
finalFitness: 0.3
finalUsageCount: 2
totalSuccessSignals: 0
totalFailureSignals: 1
archivedFrom: .claude/rules/old-approach.md
generation: 0
lineageChildren: ["exp-old-approach-v2"]
---

[Original pattern content preserved verbatim below this line]

# Old Approach

[Full original content, unmodified]
```

### Resurrection Conditions

Every graveyard entry **must** include:

1. **`reason`**: Why the pattern was archived (specific: fitness score, days inactive, failure count)
2. **`replacement`**: What pattern (if any) took its niche cell
3. **`resurrectionIf`**: Conditions under which a future agent should reconsider this pattern

The `resurrectionIf` field is the most important. It encodes the pattern's potential future value. Examples:
- "If async patterns cause debugging difficulty in production, this synchronous approach may be worth reviving"
- "If the project moves to a monorepo structure, this cross-package linking pattern becomes relevant again"
- "If the LLM context window increases to 1M+ tokens, the full-context approach this pattern describes becomes viable"

### Querying the Graveyard

The `/meta:dgm-evolve all --mode=assess` command should scan the graveyard and flag any patterns whose resurrection conditions might now be met, based on:
- Changes in the codebase since the pattern was archived
- New patterns that are failing in the domain the graveyard pattern used to serve
- Explicit "resurrect" signals from agents who encountered the conditions described

---

## 6. Evolution Tracking Files

### Directory Structure

```
.claude/rules/evolution/
|-- fitness.json          # Pattern fitness scores (one entry per tracked pattern)
|-- lineage.json          # Pattern ancestry (parent/child relationships)
|-- niche-grid.json       # CycleQD 5x5 grid state
|-- cycle-state.json      # Current cycle position and cumulative stats
|-- signals.jsonl         # Raw fitness signals (append-only, capped at 10,000 lines)
|-- experiments/          # Unproven pattern mutations awaiting validation
|   +-- .gitkeep
+-- graveyard/            # Deprecated patterns with resurrection conditions
    +-- .gitkeep
```

### `fitness.json` -- Pattern Fitness Scores

```json
{
  "version": 1,
  "lastUpdated": "2026-02-11T00:00:00Z",
  "lastAggregatedSignalTs": null,
  "patterns": {
    "rules-ooda-foundation": {
      "patternId": "rules-ooda-foundation",
      "file": ".claude/rules/ooda-foundation.md",
      "fitness": 0.0,
      "usageCount": 0,
      "successSignals": 0,
      "failureSignals": 0,
      "lastAccessed": null,
      "firstSeen": "2026-01-15T00:00:00Z",
      "freshness": "WARM",
      "frozen": false,
      "bcs": {
        "specificity": 5,
        "applicability": 5,
        "complexity": 5,
        "maturity": 7
      },
      "nicheCell": [5, 5],
      "lineageParent": null,
      "status": "active"
    },
    "rules-escalation-protocol": {
      "patternId": "rules-escalation-protocol",
      "file": ".claude/rules/escalation-protocol.md",
      "fitness": 0.0,
      "usageCount": 0,
      "successSignals": 0,
      "failureSignals": 0,
      "lastAccessed": null,
      "firstSeen": "2026-01-15T00:00:00Z",
      "freshness": "WARM",
      "frozen": false,
      "bcs": {
        "specificity": 3,
        "applicability": 4,
        "complexity": 4,
        "maturity": 6
      },
      "nicheCell": [3, 4],
      "lineageParent": null,
      "status": "active"
    }
  }
}
```

Field reference:
- `patternId`: Kebab-case identifier derived from file path
- `file`: Relative path from project root
- `fitness`: Computed score (0.0 - ~10.0)
- `usageCount`: Raw access count since tracking began
- `successSignals`: Count of explicit success signals
- `failureSignals`: Count of explicit failure signals
- `lastAccessed`: ISO 8601 timestamp of most recent access signal
- `firstSeen`: When the pattern was first registered
- `freshness`: `"HOT"` | `"WARM"` | `"COLD"` (derived from fitness + recency)
- `frozen`: If `true`, this pattern is excluded from competition and pruning (human override)
- `bcs`: Behavior characteristics for niche grid placement
- `nicheCell`: `[row, col]` position in the 5x5 grid (or `null` if unplaced)
- `lineageParent`: `patternId` of the parent pattern (or `null` for original patterns)
- `status`: `"active"` | `"experimental"` | `"archived"`

### `lineage.json` -- Pattern Ancestry

```json
{
  "version": 1,
  "lastUpdated": "2026-02-11T00:00:00Z",
  "lineage": {
    "rules-ooda-foundation": {
      "patternId": "rules-ooda-foundation",
      "parent": null,
      "children": [],
      "mutationType": null,
      "createdAt": "2026-01-15T00:00:00Z",
      "archivedAt": null,
      "generation": 0,
      "status": "active"
    },
    "rules-escalation-protocol": {
      "patternId": "rules-escalation-protocol",
      "parent": null,
      "children": [],
      "mutationType": null,
      "createdAt": "2026-01-15T00:00:00Z",
      "archivedAt": null,
      "generation": 0,
      "status": "active"
    }
  }
}
```

Field reference:
- `parent`: `patternId` of the parent (null for generation-0 patterns)
- `children`: Array of `patternId`s that were mutated from this pattern
- `mutationType`: `null` | `"generalization"` | `"specialization"` | `"combination"` | `"inversion"`
- `generation`: How many mutations from the original (0 = original, 1 = first mutation, etc.)
- `status`: `"active"` | `"experimental"` | `"archived"`

### `signals.jsonl` -- Raw Signal Stream

Append-only JSONL. One JSON object per line. Capped at 10,000 lines by the aggregation script (oldest lines trimmed after processing).

```jsonc
{"ts":"2026-02-11T15:30:00Z","signal":"access","pattern":".claude/rules/ooda-foundation.md","tool":"Read"}
{"ts":"2026-02-11T15:31:12Z","signal":"reference","pattern":".claude/rules/spiral-detection.md","tool":"Bash","weight":0.5}
{"ts":"2026-02-11T15:35:00Z","signal":"success","pattern":".claude/rules/escalation-protocol.md","context":"Structured decision request format used for API migration escalation"}
```

### `cycle-state.json` -- Cycle Position

See Section 3 above.

### `niche-grid.json` -- Grid State

See Section 2 above.

---

## 7. Automation Trigger: GitHub Action

### `.github/workflows/dgm-evolution.yml`

```yaml
name: DGM Pattern Evolution

on:
  # Daily aggregation at 3am UTC (one hour after SIL on Sundays)
  schedule:
    - cron: '0 3 * * *'
  # Manual trigger with mode selection
  workflow_dispatch:
    inputs:
      mode:
        description: 'Evolution mode'
        required: true
        default: 'aggregate'
        type: choice
        options:
          - aggregate
          - compete
          - prune
          - full
      dry_run:
        description: 'Dry run (show what would change without writing)'
        required: false
        default: false
        type: boolean

concurrency:
  group: dgm-evolution
  cancel-in-progress: false

jobs:
  evolution:
    name: Run DGM Evolution
    runs-on: ubuntu-latest
    timeout-minutes: 30

    # Only run on main repo, not forks
    if: github.repository == 'kastalien-research/thoughtbox'

    permissions:
      contents: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Determine mode
        id: mode
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "mode=${{ inputs.mode }}" >> $GITHUB_OUTPUT
          else
            # Scheduled run: determine mode based on day
            DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
            DAY_OF_MONTH=$(date +%d)

            if [ "$DAY_OF_MONTH" = "01" ]; then
              # First of month: aggregate + compete + prune
              echo "mode=full" >> $GITHUB_OUTPUT
            elif [ "$DAY_OF_WEEK" = "7" ]; then
              # Sunday: aggregate + compete (after SIL at 2am)
              echo "mode=compete" >> $GITHUB_OUTPUT
            else
              # All other days: aggregate only
              echo "mode=aggregate" >> $GITHUB_OUTPUT
            fi
          fi

      - name: Verify evolution directory exists
        run: |
          if [ ! -d ".claude/rules/evolution" ]; then
            echo "::error::Evolution directory not found. Run bootstrap first."
            exit 1
          fi

      - name: Run signal aggregation
        if: contains(fromJSON('["aggregate", "compete", "full"]'), steps.mode.outputs.mode)
        env:
          DRY_RUN: ${{ inputs.dry_run || 'false' }}
        run: bash .claude/scripts/dgm-aggregate.sh

      - name: Run niche competition
        if: contains(fromJSON('["compete", "full"]'), steps.mode.outputs.mode)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DRY_RUN: ${{ inputs.dry_run || 'false' }}
        run: bash .claude/scripts/dgm-compete.sh

      - name: Run pruning
        if: contains(fromJSON('["prune", "full"]'), steps.mode.outputs.mode)
        env:
          DRY_RUN: ${{ inputs.dry_run || 'false' }}
        run: bash .claude/scripts/dgm-prune.sh

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet .claude/rules/evolution/; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
            git diff --stat .claude/rules/evolution/
          fi

      - name: Commit evolution state
        if: steps.changes.outputs.has_changes == 'true' && inputs.dry_run != true
        run: |
          git config user.name "dgm-bot"
          git config user.email "dgm-bot@noreply.github.com"
          git add .claude/rules/evolution/
          git commit -m "chore(dgm): ${{ steps.mode.outputs.mode }} cycle $(date +%Y-%m-%d)

          Mode: ${{ steps.mode.outputs.mode }}
          Trigger: ${{ github.event_name }}"
          git push

      - name: Summary
        run: |
          echo "## DGM Evolution Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Parameter | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|-----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Mode | ${{ steps.mode.outputs.mode }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Changes | ${{ steps.changes.outputs.has_changes }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Dry Run | ${{ inputs.dry_run || 'false' }} |" >> $GITHUB_STEP_SUMMARY

          if [ -f ".claude/rules/evolution/fitness.json" ]; then
            PATTERN_COUNT=$(jq '.patterns | length' .claude/rules/evolution/fitness.json)
            echo "| Tracked Patterns | $PATTERN_COUNT |" >> $GITHUB_STEP_SUMMARY
          fi

          if [ -f ".claude/rules/evolution/niche-grid.json" ]; then
            FILLED=$(jq '[.grid | to_entries[] | select(.value != null)] | length' .claude/rules/evolution/niche-grid.json)
            echo "| Filled Niches | $FILLED / 25 |" >> $GITHUB_STEP_SUMMARY
          fi

          if [ -f ".claude/rules/evolution/cycle-state.json" ]; then
            FOCUS=$(jq -r '.currentFocus' .claude/rules/evolution/cycle-state.json)
            ROUND=$(jq '.currentRound' .claude/rules/evolution/cycle-state.json)
            echo "| Quality Focus | $FOCUS (Round $ROUND) |" >> $GITHUB_STEP_SUMMARY
          fi
```

### Cadence Summary

| Cycle | Schedule | Mode | What Happens |
|-------|----------|------|--------------|
| **Daily** | 3am UTC, every day | `aggregate` | Process `signals.jsonl` into `fitness.json`, update freshness tags, rotate signal file |
| **Weekly** | 3am UTC, Sundays | `compete` | Run aggregation, then CycleQD niche competition, advance quality focus, generate mutations |
| **Monthly** | 3am UTC, 1st of month | `full` | Run aggregation + competition + pruning (archive low-fitness, expire experiments) |
| **On demand** | `workflow_dispatch` | any | Human-triggered with mode selection and dry-run option |

### Relationship to SIL Workflow

The SIL runs at 2am UTC on Sundays. The DGM evolution runs at 3am UTC daily (including Sundays). This means:
- On Sundays: SIL runs first (2am), DGM aggregation + competition runs after (3am)
- The SIL may generate new patterns or modify existing ones. The DGM cycle picks up any new signals from the SIL's work.
- The DGM never modifies files that the SIL touches (SIL modifies source code; DGM only modifies `.claude/rules/evolution/`).

---

## 8. Evolution Cycle Algorithms

### Daily: Signal Aggregation

**Script**: `.claude/scripts/dgm-aggregate.sh`

```
Algorithm:
1. Read fitness.json and signals.jsonl
2. Find all signals with ts > lastAggregatedSignalTs (or all if null)
3. For each pattern mentioned in new signals:
   a. Count access signals     --> increment usageCount
   b. Count reference signals  --> increment usageCount (weighted 2x)
   c. Count success signals    --> increment successSignals
   d. Count failure signals    --> increment failureSignals
   e. Update lastAccessed to most recent signal ts
4. For ALL patterns in fitness.json (not just those with new signals):
   a. Compute recency_bonus from lastAccessed:
      - < 7 days:  1.0
      - < 30 days: 0.5
      - < 90 days: 0.2
      - >= 90 days: 0.0
   b. Normalize usageCount to 0-10 scale (relative to max in population)
   c. Normalize successSignals to 0-10 scale (relative to max in population)
   d. Compute fitness = (normalized_usage * 0.4) + (normalized_success * 0.4) + (recency_bonus * 0.2)
   e. Update freshness tag:
      - fitness > 7.0 AND lastAccessed < 7 days ago --> HOT
      - fitness > 4.0 OR lastAccessed < 30 days ago --> WARM
      - Otherwise --> COLD
5. Update fitness.json (write lastAggregatedSignalTs = max ts from processed signals)
6. Rotate signals.jsonl:
   a. Archive processed signals to signals.jsonl.archive (append)
   b. Keep only unprocessed signals (ts > lastAggregatedSignalTs) in signals.jsonl
   c. If signals.jsonl > 10,000 lines, trim oldest
7. Exit 0 (no error even if no new signals)
```

### Weekly: Niche Competition

**Script**: `.claude/scripts/dgm-compete.sh`

```
Algorithm:
1. Run aggregation first (call dgm-aggregate.sh)
2. Read fitness.json, niche-grid.json, cycle-state.json, lineage.json
3. Advance quality focus:
   currentFocus = qualityFocusCycle[(currentRound) % 5]
   currentRound += 1
4. Compute quality score for each pattern using current focus:
   - USAGE:            normalized usageCount
   - SUCCESS_RATE:     successSignals / max(1, successSignals + failureSignals) * 10
   - GENERALIZABILITY: bcs.applicability * 2
   - CLARITY:          (6 - bcs.complexity) * 2
   - EFFICIENCY:       usageCount / max(1, bcs.complexity) (normalized)
5. For each niche cell [row, col]:
   a. Find all patterns whose BCs map to this cell (row = specificity, col = applicability)
   b. If cell is empty and a pattern maps here:
      - Place highest-quality-score pattern with +2 diversity bonus
   c. If cell has incumbent:
      - Challenger = highest quality score among non-incumbent patterns mapping here
      - Challenger gets raw quality score
      - Incumbent gets quality score + 1 (incumbent bonus)
      - If challenger > incumbent + 1: champion changes, record event
      - Otherwise: incumbent defends
6. Generate mutations for top 3 patterns by quality score (across all niches):
   - Skip frozen patterns
   - Skip patterns that already have 2+ active experiments
   - For each: pick 2 mutation types, generate content (LLM call, $0.10 budget each)
   - Write to experiments/ with frontmatter
   - Register in lineage.json (parent --> child)
   - Register in fitness.json with fitness 0.0, status "experimental"
7. Update niche-grid.json, cycle-state.json, lineage.json, fitness.json
8. Write cycle_complete event to signals.jsonl
```

### Monthly: Pruning

**Script**: `.claude/scripts/dgm-prune.sh`

```
Algorithm:
1. Read fitness.json, lineage.json, niche-grid.json, cycle-state.json
2. Check minCyclesBeforePrune -- if totalCycles < minCyclesBeforePrune, skip pruning
3. Identify prune candidates (ALL of these must be true):
   - fitness < 1.0
   - freshness == "COLD"
   - Not frozen
   - Not accessed in 90+ days
   - No success signals in 60+ days
   - Maximum 3 patterns pruned per month
4. For each prune candidate (up to 3):
   a. Read the pattern file content
   b. Generate graveyard metadata:
      - reason: specific (fitness score, days since access, signal counts)
      - replacement: current champion in same niche cell (if any)
      - resurrectionIf: infer from pattern content + replacement context
   c. Write graveyard file to .claude/rules/evolution/graveyard/<patternId>.md
   d. Remove pattern file from .claude/rules/ (git mv, preserves history)
   e. Set status = "archived" in fitness.json
   f. Set archivedAt in lineage.json
   g. Remove from niche-grid.json
5. Handle expired experiments:
   a. Read all files in experiments/
   b. For each with expires <= today:
      - If fitness > parent fitness + 1 AND successSignals >= 3: PROMOTE
        - Move to .claude/rules/ (active)
        - Update niche grid (takes parent's cell or best-fit empty)
        - Update lineage (status = "active")
        - Update fitness (status = "active")
      - If fitness < parent fitness AND no extension yet: EXTEND
        - Set expires += 30 days
        - Add "extended: true" to frontmatter
      - If fitness < parent fitness AND already extended: ARCHIVE
        - Move to graveyard/ with metadata
        - Update lineage (status = "archived")
      - If insufficient data (< 3 total signals): EXTEND (same logic)
6. Update cycle-state.json (increment totalPruned, totalPromoted)
```

---

## Governance and Safety

### Invariants

1. **No pattern deletion**: Patterns are never deleted from the filesystem without a trace. They are moved to the graveyard with full metadata, or `git mv`'d (preserving history).

2. **Human approval for governance changes**: If a pattern that is pruned or promoted is referenced in CODEOWNERS, RULES.md, CLAUDE.md, or any governance file, the automated system creates a PR instead of committing directly. The PR requires human review.

3. **Experiments never auto-replace parents in governance files**: A mutation in `experiments/` can only be promoted to active status by meeting the threshold (3+ success signals OR 30+ days positive trend AND outperforming parent by >1). Even then, if the parent is in a governance file, promotion requires a PR.

4. **Graveyard entries preserve resurrection conditions**: Every graveyard entry must include `reason`, `replacement`, and `resurrectionIf` fields.

5. **Non-intrusive collection**: All fitness hooks are append-only JSONL writes. No hook adds more than 1ms of write latency. All hooks have `continueOnError: true` and timeout limits. Failures in collection never affect agent operations.

6. **Human override**: The founder can at any time:
   - Set `"frozen": true` on any pattern in `fitness.json` (excludes from competition and pruning)
   - Manually edit fitness scores
   - Promote an experiment without meeting threshold
   - Resurrect a graveyard pattern
   - Run any mode via `workflow_dispatch` with `dry_run: true` to preview changes

7. **Meta-evolution out of scope for v1**: The evolution parameters (weights 0.4/0.4/0.2, thresholds, cadences, grid size) are fixed constants. The evolution system does not evolve itself.

### Safety Bounds

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max mutations per cycle | 5 | Prevent mutation explosion |
| Max prunes per month | 3 | Prevent over-aggressive pruning |
| Min cycles before first prune | 4 | Let the system stabilize before removing anything |
| Experiment expiry | 30 days | Prevent indefinite accumulation |
| Experiment extension limit | 1 (30 more days) | One chance; after that, archive or promote |
| Minimum fitness for survival | 1.0 | Very low bar -- only truly unused patterns pruned |
| Minimum inactivity for COLD | 90 days no access | 3 months of inactivity |
| signals.jsonl max lines | 10,000 | Prevent disk bloat |
| fitness.json max patterns | 200 | Reasonable upper bound for pattern population |
| Mutation LLM budget | $0.10 per mutation | Cap cost of content generation |
| Weekly competition LLM budget | $0.50 total | Cap total weekly evolution cost |

### Conflict Resolution

When two patterns compete for the same niche cell:

1. Current quality focus metric is the primary tiebreaker.
2. If still tied on quality metric, highest base fitness wins.
3. If still tied, incumbent wins (stability preference).
4. If an experiment beats both active patterns, it promotes and the weaker active pattern is demoted to WARM (not graveyard -- only pruning sends to graveyard).

---

## Observability Integration

### Observatory Event Type: `evolution:event`

Add to `src/observatory/emitter.ts` event types:

```typescript
"evolution:event": {
  type:
    | "fitness_updated"
    | "niche_challenged"
    | "niche_changed"
    | "pattern_promoted"
    | "pattern_archived"
    | "mutation_created"
    | "cycle_advanced"
    | "prune_completed";
  timestamp: string;
  patternId: string;
  data: {
    oldFitness?: number;
    newFitness?: number;
    nicheCell?: [number, number];
    qualityFocus?: string;
    qualityScore?: number;
    mutationType?: string;
    parentId?: string;
    reason?: string;
    round?: number;
  };
};
```

### Hub Channel Integration

Evolution events should be posted to the Hub's `#evolution` channel (system-level workspace):

```json
{
  "channel": "evolution",
  "message": "[CycleQD Round 5 - EFFICIENCY] Niche (3,4) champion changed: retry.md replaced by smart-retry.md (fitness: 8.2 vs 7.1). 2 mutations generated.",
  "agentId": "dgm-system",
  "timestamp": "2026-02-16T04:00:00Z"
}
```

### Knowledge Graph Integration

High-fitness patterns (fitness > 6.0) should be registered as Thoughtbox knowledge graph entities of type `"Pattern"` with properties for fitness, freshness, niche cell, and usage count. Evolution events (promotions, demotions, mutations) should be recorded as observations on the pattern entity.

The daily aggregation script should call the knowledge memory bridge for any pattern whose fitness changed by more than 0.5 since last sync:

```bash
node .claude/hooks/knowledge_memory_bridge.mjs sync-pattern \
  --pattern-id "rules-ooda-foundation" \
  --fitness-file ".claude/rules/evolution/fitness.json"
```

---

## Bootstrap Plan

### Step 1: Create Directory Structure

```bash
mkdir -p .claude/rules/evolution/experiments
mkdir -p .claude/rules/evolution/graveyard
mkdir -p .claude/scripts
touch .claude/rules/evolution/experiments/.gitkeep
touch .claude/rules/evolution/graveyard/.gitkeep
```

### Step 2: Seed Initial Data

Write a bootstrap script (`.claude/scripts/dgm-bootstrap.sh`) that:

1. Scans all `.claude/rules/*.md` files
2. Parses `.claude/state/file_access.jsonl` to compute initial usage counts:
   ```bash
   jq -r 'select(.path | contains(".claude/rules/")) | .path' \
     .claude/state/file_access.jsonl | sort | uniq -c | sort -rn
   ```
3. Computes initial fitness scores (normalized to 3.0-7.0 range to avoid bootstrap bias)
4. Assigns initial BCs using the heuristic inference rules
5. Places patterns in the niche grid
6. Writes `fitness.json`, `lineage.json`, `niche-grid.json`, `cycle-state.json`
7. Creates empty `signals.jsonl`

### Step 3: Verify and Commit

```bash
# Verify state files
cat .claude/rules/evolution/fitness.json | jq '.patterns | length'
cat .claude/rules/evolution/niche-grid.json | jq '[.grid | to_entries[] | select(.value != null)] | length'

# Commit initial state
git add .claude/rules/evolution/
git commit -m "feat(dgm): bootstrap evolution tracking state from existing file access data"
```

---

## Implementation Steps

### Phase 1: Bootstrap (Week 1)

1. Create directory structure
2. Write `dgm-bootstrap.sh` seeding script
3. Run bootstrap, verify data, commit initial state
4. Ensure `signals.jsonl` is git-tracked (small, append-only)

### Phase 2: Signal Collection (Week 1-2)

5. Modify `track_file_access.sh` -- add fitness signal emission for `.claude/rules/` files
6. Modify `session_end_memory.sh` -- add explicit fitness signal prompt
7. Create `fitness_signal_collector.sh` -- new PostToolUse hook with ring buffer heuristic
8. Register new hook in `.claude/settings.json`
9. Test: Run a session, verify signals appear in `signals.jsonl`

### Phase 3: Automated Cycles (Week 2-3)

10. Write `dgm-aggregate.sh` -- daily signal aggregation
11. Write `dgm-compete.sh` -- weekly CycleQD niche competition + mutation generation
12. Write `dgm-prune.sh` -- monthly pruning
13. Create `.github/workflows/dgm-evolution.yml`
14. Test each script locally with `--dry-run`

### Phase 4: Observability (Week 3)

15. Add `evolution:event` to Observatory emitter
16. Add evolution event Zod schema
17. Wire evolution scripts to emit events / post to Hub `#evolution` channel
18. Add fitness panel to Observatory UI (leaderboard + niche grid heatmap)

### Phase 5: Knowledge Graph Sync (Week 3-4)

19. Extend `knowledge_memory_bridge.mjs` with `sync-pattern` command
20. Wire daily aggregation to KG sync for changed patterns
21. Add relation types: `GOVERNS`, `DERIVED_FROM`, `SUPERSEDED_BY`

### Phase 6: Command Update (Week 4)

22. Update `/meta:dgm-evolve` to read from persistent state files
23. Add `--dry-run` to all modes
24. Add `--force` for manual overrides (skip threshold checks)

---

## Success Criteria

### Must Have (v1)

- [ ] Evolution directory exists with all state files initialized from existing data
- [ ] `signals.jsonl` receives at least 10 signals per session automatically (access signals from hook)
- [ ] Daily GitHub Action aggregates signals into `fitness.json` without error
- [ ] Weekly GitHub Action runs CycleQD competition and rotates quality focus
- [ ] Monthly GitHub Action identifies and archives low-fitness patterns (if any qualify)
- [ ] `/meta:dgm-evolve all --mode=assess` displays fitness scores from `fitness.json`
- [ ] No hook adds more than 5ms of write latency (all stay under 3000ms timeout)
- [ ] At least one mutation is generated and placed in `experiments/` after the first weekly cycle
- [ ] All graveyard entries have `reason`, `replacement`, and `resurrectionIf` fields

### Should Have (v1.1)

- [ ] Observatory displays pattern fitness leaderboard
- [ ] Observatory displays niche grid heatmap
- [ ] Evolution events appear in Hub `#evolution` channel
- [ ] Knowledge graph contains pattern entities for all HOT patterns
- [ ] Session calibration prompt includes fitness signal instructions

### Could Have (v2)

- [ ] A/B testing: Serve different pattern variants to different sessions
- [ ] Cross-codebase learning: Export high-fitness patterns for other projects
- [ ] Red Queen mode: Adversarial evolution where patterns compete directly
- [ ] Meta-evolution: Evolution parameters themselves are evolvable

---

## Risks

### R1: Signal Noise (Likelihood: High, Impact: Medium)

**Risk**: Access signals are noisy. An agent reading a rule file does not mean it used the pattern.

**Mitigation**: Weight explicit signals (success/failure) 4x higher than implicit signals (access). Require at least 3 explicit signals before a pattern can be promoted or demoted. Use the ring buffer heuristic in `fitness_signal_collector.sh` to correlate rule reads with task outcomes.

### R2: Bootstrap Bias (Likelihood: Medium, Impact: Medium)

**Risk**: Seeding from `file_access.jsonl` biases initial fitness toward recently-accessed patterns.

**Mitigation**: Normalize initial fitness to narrow band (3.0-7.0) regardless of raw counts. Set `minCyclesBeforePrune: 4` to prevent premature pruning before the system stabilizes.

### R3: Over-Pruning (Likelihood: Low, Impact: High)

**Risk**: Valuable but rarely-used patterns (like escalation protocol) could be pruned due to low access frequency.

**Mitigation**: Very low pruning threshold (fitness < 1.0 AND COLD AND 90+ days inactive). Monthly prune limit of 3. Graveyard preserves full content with resurrection conditions. `frozen` flag available for patterns that must never be pruned.

### R4: Mutation Pollution (Likelihood: Medium, Impact: Low)

**Risk**: Generated mutations may be low quality.

**Mitigation**: Limit to 5 mutations per cycle with 30-day expiry. Expired mutations without success signals are automatically archived. Bounded experiments directory.

### R5: Hook Performance (Likelihood: Low, Impact: High)

**Risk**: Additional hooks could slow agent operations.

**Mitigation**: Fitness hooks are append-only JSONL writes (sub-millisecond). All hooks have `continueOnError: true` and 3000ms timeout. Hook failures are silent.

### R6: Git Churn (Likelihood: Medium, Impact: Low)

**Risk**: Daily automated commits to evolution state files could clutter git history.

**Mitigation**: All commits use `chore(dgm):` prefix (easily filterable, excluded from CHANGELOG). State files are JSON (diffable). Consider `.gitattributes` binary marker if diffs become too noisy.

### R7: Race Conditions (Likelihood: Low, Impact: Medium)

**Risk**: A session could write to `signals.jsonl` while the GitHub Action reads it.

**Mitigation**: Aggregation script copies the file before processing. `signals.jsonl` is append-only, so partial reads are safe. GitHub Action runs at 3am UTC when interactive sessions are unlikely.

---

## References

- **DGM Design Doc**: `.claude/commands/meta/dgm-evolve.md` (canonical algorithm, 506 lines)
- **Continual Calibration Rule**: `.claude/rules/continual-calibration.md` (freshness tags, anti-proof principle)
- **Overview Spec**: `specs/continual-improvement/00-overview.md` (Gap 3 description)
- **Companion Spec**: `specs/continual-improvement/01-unified-loop-controller.md` (loop envelope, signal types)
- **Learning Capture Command**: `.claude/commands/meta/capture-learning.md` (pattern entry format)
- **Darwin Godel Machine Paper**: [arXiv 2505.22954](https://arxiv.org/abs/2505.22954)
- **CycleQD Paper**: [arXiv 2410.14735](https://arxiv.org/abs/2410.14735)
- **Observatory Emitter**: `src/observatory/emitter.ts` (fire-and-forget event patterns)
- **SIL-104 Event Stream**: `src/events/event-emitter.ts` (JSONL event emission)
- **Knowledge Memory Bridge**: `.claude/hooks/knowledge_memory_bridge.mjs` (graph.jsonl writing)
- **Self-Improvement Loop Workflow**: `.github/workflows/self-improvement-loop.yml` (weekly SIL at 2am UTC)
- **Hook Configuration**: `.claude/settings.json` (PostToolUse chain with timeouts)
- **File Access Tracker**: `.claude/hooks/track_file_access.sh` (existing access logging hook)
