# 01: Unified Loop Controller

**Status**: Draft v0.1
**Gap**: #1 from [00-overview.md](./00-overview.md)
**Priority**: HIGH (Phase 2, Weeks 3-4)
**Estimated Effort**: 3-4 days implementation + 1-2 days integration testing
**Dependencies**: [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md) (soft), [04-cross-session-continuity.md](./04-cross-session-continuity.md) (soft)

---

## Problem Statement

Three execution layers operate independently:

| Layer | Mechanism | Timescale | Current Output | Where Output Goes |
|-------|-----------|-----------|----------------|-------------------|
| **Interactive** | Claude Code sessions with hooks, skills, commands | Minutes-hours | MEMORY.md edits, Thoughtbox thoughts, commits, Beads issues | Stays local. Next session reads MEMORY.md if it remembers to. |
| **Headless (AgentOps)** | `daily-dev-brief.ts` via Agent SDK, `agentops_on_approval_label.yml` | Daily | GitHub issues with proposals, run artifacts | Human applies labels. Implementation runs. Results not fed back. |
| **Scheduled (SIL)** | `self-improvement-loop.yml`, `AutonomousImprovementLoop` class | Weekly | PRs with improvements, scorecard artifacts | Human reviews PR. Learnings not captured. |

The gap: there is no mechanism by which a daily AgentOps proposal becomes a SIL discovery candidate, a SIL finding becomes an interactive session priority, or an interactive session learning becomes an AgentOps signal source. Each loop terminates at a human review boundary and does not feed forward.

### Concrete Failure Modes

1. **AgentOps proposes a caching optimization on Monday.** Human approves it Thursday. Implementation runs but the SIL on Sunday does not know caching was already addressed, so it rediscovers the same opportunity and wastes a budget cycle.

2. **SIL discovers that a test helper pattern reduces test setup by 40%.** The finding lives in `improvement-results.json` as a GitHub artifact. Interactive sessions never see it. The pattern is not adopted because no one told the next agent about it.

3. **Interactive session solves a gnarly Docker build issue.** The fix is committed and the learning is in MEMORY.md. AgentOps never adds "Docker build reliability" as a signal source. The same class of issue recurs in CI without automated detection.

---

## What Already Exists

### Artifacts That Should Connect (But Don't)

| Source | Artifact | Format | Location |
|--------|----------|--------|----------|
| AgentOps daily brief | `proposals.json` | `ProposalsPayload` (typed) | `agentops/runs/<run_id>/proposals.json` |
| AgentOps daily brief | GitHub issue | Markdown with embedded JSON | GitHub Issues (label: `agentops`, `dev-brief`) |
| AgentOps approval | `implementation_result.json` | JSON | `agentops/runs/<run_id>/implementation_result.json` |
| SIL loop | `results.json` / `improvement-results.json` | `IterationResult[]` | GitHub Actions artifacts |
| SIL scorecard | `scorecard.json` | JSON | GitHub Actions artifacts |
| Interactive session | MEMORY.md edits | Markdown (unstructured) | `~/.claude/projects/.../memory/MEMORY.md` |
| Interactive session | Thoughtbox thoughts | MCP entities | Thoughtbox server (in-memory or file-backed) |
| Interactive session | Session start/end logs | JSON | `logs/session_start.json`, `.claude/state/memory-calibration.log` |
| Interactive session | LangSmith traces | LangSmith API | LangSmith cloud (via `stop.sh` hook) |

### Existing Scheduling Infrastructure

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `agentops_daily_thoughtbox_dev.yml` | Daily 11:30 UTC | Signal collection + proposal generation |
| `agentops_on_approval_label.yml` | Event (label added) | Proposal implementation |
| `self-improvement-loop.yml` | Weekly Sunday 02:00 UTC | Autonomous improvement |
| `claude.yml` | Event (issue assigned) | Claude Code GitHub Action |
| `ci.yml` | Event (PR) | Standard CI |

### Existing Hooks (Interactive Layer)

| Hook | Event | What It Does |
|------|-------|-------------|
| `session_start.sh` | Session start | Logs session metadata, loads git/issue context |
| `session_end_memory.sh` | Session end | Prompts agent for learning capture |
| `stop.sh` | After each response | Sends traces to LangSmith |
| `knowledge_memory_bridge.mjs` | Manual invocation | Writes insights to `.thoughtbox/projects/*/memory/graph.jsonl` |
| `pre_compact.sh` | Before context compaction | Captures state before context is lost |

### Existing Loop Infrastructure

- **OODA loop interface contract** (`.claude/commands/loops/meta/loop-interface.md`): Typed I/O, signals, composition rules, termination conditions. 15+ loop building blocks.
- **Spec orchestrator** (`.claude/commands/specifications/spec-orchestrator.md`): OR-informed multi-spec implementation with dependency graphs, spiral detection, commitment levels.
- **Agent team roles** (`agentic-dev-team/agentic-dev-team-spec.md`): 4 roles (triage-fix, research-reality, coordination-momentum, verification-judge) with escalation thresholds.
- **SIL-010 AutonomousImprovementLoop** class: 5-phase loop (discover, filter, experiment, evaluate, integrate) with cost tracking and termination rules. Currently placeholder implementations in several phases.

---

## What Needs Building

### 1. Controller State Machine

The Unified Loop Controller (ULC) is a persistent state machine that tracks what each loop has produced and routes outputs to the appropriate consumers.

```
                    ┌──────────────────────────────────────────────┐
                    │          UNIFIED LOOP CONTROLLER              │
                    │                                               │
                    │  State: controller-state.json                 │
                    │  Runs: on every trigger (hook, cron, event)   │
                    │                                               │
                    │  ┌───────────────────────────────────────┐   │
                    │  │           INTAKE QUEUE                 │   │
                    │  │                                        │   │
                    │  │  Typed entries from all three layers:  │   │
                    │  │  - SessionLearning                     │   │
                    │  │  - AgentOpsProposal                    │   │
                    │  │  - AgentOpsImplementation              │   │
                    │  │  - SILIteration                        │   │
                    │  │  - SILScorecard                        │   │
                    │  │  - ExternalSignal                      │   │
                    │  └───────────────┬───────────────────────┘   │
                    │                  │                            │
                    │                  ▼                            │
                    │  ┌───────────────────────────────────────┐   │
                    │  │           ROUTER                       │   │
                    │  │                                        │   │
                    │  │  Rules engine:                         │   │
                    │  │  - Dedup (same topic across layers)    │   │
                    │  │  - Priority (escalation thresholds)    │   │
                    │  │  - Routing (which loop consumes this)  │   │
                    │  │  - Staleness (time-decay on entries)   │   │
                    │  └───────────────┬───────────────────────┘   │
                    │                  │                            │
                    │         ┌────────┼────────┐                  │
                    │         ▼        ▼        ▼                  │
                    │  ┌──────────┐ ┌──────┐ ┌──────┐             │
                    │  │ Session  │ │Daily │ │Weekly│             │
                    │  │ Priming  │ │Brief │ │ SIL  │             │
                    │  │ Context  │ │Seeds │ │Seeds │             │
                    │  └──────────┘ └──────┘ └──────┘             │
                    └──────────────────────────────────────────────┘
```

### 2. Controller State Schema

```typescript
// controller/types.ts

interface ControllerState {
  version: 1;
  lastUpdated: string; // ISO8601

  // Intake queue: entries waiting to be routed
  intake: IntakeEntry[];

  // Routed entries: where each entry was sent
  routed: RoutedEntry[];

  // Meta-fitness: the controller's own effectiveness tracking
  metaFitness: MetaFitnessRecord[];

  // Dedup index: prevents re-processing the same topic
  dedupIndex: Record<string, DedupEntry>;

  // Watermarks: how far each consumer has read
  watermarks: {
    sessionPriming: string;  // ISO8601 - last entry consumed
    dailyBrief: string;
    weeklySIL: string;
  };
}

interface IntakeEntry {
  id: string;            // uuid
  timestamp: string;     // ISO8601
  source: 'interactive' | 'agentops' | 'sil';
  type: IntakeType;
  topic: string;         // Normalized topic for dedup
  payload: unknown;      // Source-specific data
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttl: number;           // Hours before entry expires
}

type IntakeType =
  | 'session_learning'       // From interactive sessions
  | 'session_pattern'        // Pattern detected across sessions
  | 'agentops_proposal'      // From daily brief
  | 'agentops_result'        // From implementation run
  | 'sil_improvement'        // From SIL iteration
  | 'sil_failure'            // Failed SIL attempt (stepping stone)
  | 'sil_scorecard'          // Aggregated SIL metrics
  | 'external_signal';       // From RSS, arXiv, GitHub ecosystem

interface RoutedEntry {
  intakeId: string;
  routedTo: ('session_priming' | 'daily_brief' | 'weekly_sil')[];
  routedAt: string;
  consumed: boolean;
  consumedAt?: string;
  outcome?: 'applied' | 'skipped' | 'deferred';
}

interface DedupEntry {
  topic: string;
  firstSeen: string;
  lastSeen: string;
  sources: string[];      // Which layers produced this topic
  merged: boolean;        // Whether entries were merged
}

interface MetaFitnessRecord {
  period: string;         // ISO week or day
  entriesIngested: number;
  entriesRouted: number;
  entriesConsumed: number;
  entriesExpired: number;
  crossLayerRoutes: number;  // Entries that crossed layer boundaries
  feedbackLoopsClosed: number; // Learning -> applied -> verified cycles
  avgTimeToConsumption: number; // Hours from intake to consumption
}
```

### 3. Knowledge Routing Rules

The router determines where each intake entry goes. These rules are the core logic of the controller.

| Source | Type | Routes To | Rationale |
|--------|------|-----------|-----------|
| Interactive | `session_learning` | Daily Brief seeds, Session Priming | Learning available to next session immediately; becomes AgentOps context for proposals |
| Interactive | `session_pattern` | Weekly SIL seeds | Patterns need statistical validation over time |
| AgentOps | `agentops_proposal` | Session Priming (if `approved`), Weekly SIL seeds | Approved proposals inform sessions; all proposals seed SIL discovery |
| AgentOps | `agentops_result` | Weekly SIL seeds, Session Priming | Implementation outcomes inform both future SIL and sessions |
| SIL | `sil_improvement` | Session Priming, Daily Brief seeds | Successful improvements inform all layers |
| SIL | `sil_failure` | Daily Brief seeds | Failed approaches inform proposal generation (stepping stones) |
| SIL | `sil_scorecard` | Session Priming | Scorecard provides system health context |
| External | `external_signal` | Daily Brief seeds | External signals go through AgentOps proposal pipeline |

#### Dedup Rules

Entries are deduplicated by normalized topic string:
1. Strip articles, prepositions
2. Lowercase
3. Stem to root form
4. Compare Jaccard similarity > 0.7 = same topic

When entries from different layers match the same topic, they are merged:
- The entry with higher priority wins
- Sources are combined (showing cross-layer convergence)
- Cross-layer convergence increases priority by one level

#### Priority Escalation

- An entry that appears in 2+ layers within 48 hours is escalated to `high` priority
- An entry that appears in all 3 layers within a week triggers a human escalation (structured decision request per escalation protocol)
- Entries older than their TTL are expired and moved to a `stepping_stones` archive

### 4. Timescale Coordination

```
Fast (Interactive)          Medium (Daily)              Slow (Weekly)
-------------------         ---------------             --------------
Session starts              Daily brief runs            SIL runs
  |                           |                           |
  +-- Load priming context    +-- Load daily seeds        +-- Load weekly seeds
  |   from controller         |   from controller         |   from controller
  |                           |                           |
  +-- Work happens            +-- Signals collected       +-- Discovery phase
  |                           |                           |
  +-- Learning captured       +-- Proposals generated     +-- Experiment phase
  |   (hook or explicit)      |                           |
  |                           +-- Issue created           +-- Evaluate phase
  +-- Session ends            |                           |
  |                           +-- Results saved           +-- Results saved
  +-- Controller intake <-----+                           |
        |                                                 +-- Controller intake <--+
        |                                                                          |
        +-- Controller intake <----------------------------------------------------+
```

The key insight: each layer's output becomes the next layer's input, but they run at different cadences. The controller bridges the cadence gap by persisting state between runs.

**Carlini C compiler principle applied**: The controller is the `while true` outer loop. Each execution layer is a function called within that loop. The controller does not wait synchronously for any layer; it ingests whatever each layer has produced since the last check, routes it, and returns. The layers run on their own schedules.

### 5. Implementation Architecture

The controller is implemented as a triad:

```
+--------------------------------------------------------------+
|                                                               |
|  (A) GitHub Action: controller-sync.yml                      |
|      Trigger: schedule (every 6 hours) + workflow_dispatch    |
|      Does: Reads GitHub artifacts from AgentOps and SIL runs |
|            Reads issue labels for approval status             |
|            Writes controller-state.json to repo               |
|            Commits to dedicated branch: controller-state      |
|                                                               |
|  (B) Agent SDK Script: controller-ingest.ts                  |
|      Trigger: Called by (A) and by session hooks              |
|      Does: Parses artifacts into IntakeEntry format           |
|            Runs dedup and priority logic                      |
|            Runs routing rules                                 |
|            Updates controller-state.json                      |
|                                                               |
|  (C) Session Hook: controller-prime.sh                       |
|      Trigger: session_start hook                             |
|      Does: Reads controller-state.json                       |
|            Extracts entries routed to session_priming         |
|            Injects into session context via hookSpecificOutput|
|            Marks entries as consumed                          |
|                                                               |
+--------------------------------------------------------------+
```

#### (A) GitHub Action: `controller-sync.yml`

```yaml
# .github/workflows/controller-sync.yml

name: Controller Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:
  workflow_run:
    workflows:
      - "AgentOps - Daily Thoughtbox Dev Brief"
      - "Self-Improvement Loop"
    types: [completed]

jobs:
  sync:
    name: Sync Controller State
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout controller-state branch
        uses: actions/checkout@v4
        with:
          ref: controller-state
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install controller dependencies
        run: npm ci --workspace=controller

      - name: Download recent AgentOps artifacts
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Fetch last 7 days of daily brief artifacts
          gh run list --workflow=agentops_daily_thoughtbox_dev.yml \
            --limit 7 --json databaseId,conclusion \
            | jq -r '.[] | select(.conclusion == "success") | .databaseId' \
            | while read run_id; do
                gh run download "$run_id" -D artifacts/agentops/ 2>/dev/null || true
              done

      - name: Download recent SIL artifacts
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Fetch last 4 weeks of SIL artifacts
          gh run list --workflow=self-improvement-loop.yml \
            --limit 4 --json databaseId,conclusion \
            | jq -r '.[] | select(.conclusion == "success") | .databaseId' \
            | while read run_id; do
                gh run download "$run_id" -D artifacts/sil/ 2>/dev/null || true
              done

      - name: Fetch approved proposals from issues
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue list --label "agentops" --state all --limit 30 \
            --json number,labels,title,updatedAt > artifacts/issues.json

      - name: Run controller ingest
        run: npx tsx controller/ingest.ts --artifacts-dir artifacts/

      - name: Commit updated state
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add controller/state/controller-state.json
          if git diff --cached --quiet; then
            echo "No state changes"
          else
            git commit -m "chore(controller): sync state $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            git push
          fi
```

#### (B) Agent SDK Script: `controller/ingest.ts`

```typescript
// controller/ingest.ts
//
// Core logic for ingesting artifacts from all three layers
// and routing them according to the knowledge routing rules.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type {
  ControllerState, IntakeEntry, IntakeType, RoutedEntry, DedupEntry
} from './types.js';

// --- Constants ---

const STATE_PATH = 'controller/state/controller-state.json';
const DEFAULT_TTL_HOURS = 168; // 7 days

// --- Ingest Functions ---

function ingestAgentOpsArtifacts(
  artifactsDir: string,
  state: ControllerState
): IntakeEntry[] {
  const entries: IntakeEntry[] = [];
  const agentopsDir = join(artifactsDir, 'agentops');
  if (!existsSync(agentopsDir)) return entries;

  for (const runDir of readdirSync(agentopsDir, { withFileTypes: true })) {
    if (!runDir.isDirectory()) continue;
    const runPath = join(agentopsDir, runDir.name);

    // Ingest proposals
    const proposalsPath = join(runPath, 'proposals.json');
    if (existsSync(proposalsPath)) {
      const proposals = JSON.parse(readFileSync(proposalsPath, 'utf-8'));
      for (const proposal of proposals.proposals || []) {
        entries.push({
          id: randomUUID(),
          timestamp: proposals.generated_at || new Date().toISOString(),
          source: 'agentops',
          type: 'agentops_proposal',
          topic: normalizeTopic(proposal.title),
          payload: proposal,
          priority: mapImpactToPriority(proposal.impact),
          ttl: DEFAULT_TTL_HOURS,
        });
      }
    }

    // Ingest implementation results
    const implPath = join(runPath, 'implementation_result.json');
    if (existsSync(implPath)) {
      const result = JSON.parse(readFileSync(implPath, 'utf-8'));
      entries.push({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        source: 'agentops',
        type: 'agentops_result',
        topic: normalizeTopic(result.proposal_id),
        payload: result,
        priority: result.status === 'success' ? 'normal' : 'high',
        ttl: DEFAULT_TTL_HOURS,
      });
    }
  }

  return entries;
}

function ingestSILArtifacts(
  artifactsDir: string,
  state: ControllerState
): IntakeEntry[] {
  const entries: IntakeEntry[] = [];
  const silDir = join(artifactsDir, 'sil');
  if (!existsSync(silDir)) return entries;

  for (const runDir of readdirSync(silDir, { withFileTypes: true })) {
    if (!runDir.isDirectory()) continue;
    const runPath = join(silDir, runDir.name);

    const resultsPath = join(runPath, 'improvement-results.json');
    if (!existsSync(resultsPath)) continue;

    const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
    for (const iteration of results.history || []) {
      const type: IntakeType =
        iteration.type === 'improvement-found' ? 'sil_improvement' : 'sil_failure';
      entries.push({
        id: randomUUID(),
        timestamp: iteration.timestamp,
        source: 'sil',
        type,
        topic: normalizeTopic(iteration.modification?.type || iteration.type),
        payload: iteration,
        priority: type === 'sil_improvement' ? 'high' : 'low',
        ttl: DEFAULT_TTL_HOURS * 2, // SIL results live longer
      });
    }

    // Ingest scorecard
    const scorecardPath = join(runPath, 'scorecard.json');
    if (existsSync(scorecardPath)) {
      const scorecard = JSON.parse(readFileSync(scorecardPath, 'utf-8'));
      entries.push({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        source: 'sil',
        type: 'sil_scorecard',
        topic: 'system-health-scorecard',
        payload: scorecard,
        priority: 'normal',
        ttl: DEFAULT_TTL_HOURS * 4, // Scorecards live 4 weeks
      });
    }
  }

  return entries;
}

function ingestSessionLearnings(state: ControllerState): IntakeEntry[] {
  // Session learnings arrive via the session hook (C),
  // not through artifact download. This function processes
  // any entries that the hook has appended to a local inbox file.
  const inboxPath = 'controller/state/session-inbox.jsonl';
  if (!existsSync(inboxPath)) return [];

  const lines = readFileSync(inboxPath, 'utf-8').split('\n').filter(Boolean);
  const entries: IntakeEntry[] = lines.map((line) => {
    const raw = JSON.parse(line);
    return {
      id: randomUUID(),
      timestamp: raw.timestamp || new Date().toISOString(),
      source: 'interactive' as const,
      type: raw.type || 'session_learning',
      topic: normalizeTopic(raw.topic || raw.summary),
      payload: raw,
      priority: raw.priority || 'normal',
      ttl: DEFAULT_TTL_HOURS,
    };
  });

  // Truncate inbox after reading
  writeFileSync(inboxPath, '');
  return entries;
}

// --- Routing ---

function routeEntries(
  entries: IntakeEntry[],
  state: ControllerState
): RoutedEntry[] {
  const routed: RoutedEntry[] = [];

  for (const entry of entries) {
    // Check dedup
    const dedupKey = entry.topic;
    if (state.dedupIndex[dedupKey]) {
      const existing = state.dedupIndex[dedupKey];
      existing.lastSeen = entry.timestamp;
      if (!existing.sources.includes(entry.source)) {
        existing.sources.push(entry.source);
        // Cross-layer convergence: escalate priority
        if (existing.sources.length >= 2) {
          entry.priority = escalatePriority(entry.priority);
        }
      }
      if (existing.sources.length >= 3) {
        entry.priority = 'critical';
      }
      existing.merged = true;
    } else {
      state.dedupIndex[dedupKey] = {
        topic: dedupKey,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        sources: [entry.source],
        merged: false,
      };
    }

    // Apply routing rules
    const destinations = getRouteDestinations(entry);
    routed.push({
      intakeId: entry.id,
      routedTo: destinations,
      routedAt: new Date().toISOString(),
      consumed: false,
    });
  }

  return routed;
}

function getRouteDestinations(
  entry: IntakeEntry
): ('session_priming' | 'daily_brief' | 'weekly_sil')[] {
  switch (entry.type) {
    case 'session_learning':
      return ['daily_brief', 'session_priming'];
    case 'session_pattern':
      return ['weekly_sil'];
    case 'agentops_proposal':
      return ['session_priming', 'weekly_sil'];
    case 'agentops_result':
      return ['weekly_sil', 'session_priming'];
    case 'sil_improvement':
      return ['session_priming', 'daily_brief'];
    case 'sil_failure':
      return ['daily_brief']; // Stepping stones inform proposals
    case 'sil_scorecard':
      return ['session_priming'];
    case 'external_signal':
      return ['daily_brief'];
    default:
      return [];
  }
}

// --- Utilities ---

function normalizeTopic(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\b(the|a|an|in|on|at|to|for|of|with|by)\b/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function mapImpactToPriority(
  impact: string | undefined
): IntakeEntry['priority'] {
  if (!impact) return 'normal';
  const lower = impact.toLowerCase();
  if (lower.includes('critical') || lower.includes('breaking')) return 'critical';
  if (lower.includes('high')) return 'high';
  if (lower.includes('low') || lower.includes('minor')) return 'low';
  return 'normal';
}

function escalatePriority(
  current: IntakeEntry['priority']
): IntakeEntry['priority'] {
  const levels: IntakeEntry['priority'][] = ['low', 'normal', 'high', 'critical'];
  const idx = levels.indexOf(current);
  return levels[Math.min(idx + 1, levels.length - 1)];
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  let artifactsDir = 'artifacts/';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--artifacts-dir' && args[i + 1]) {
      artifactsDir = args[i + 1];
    }
  }

  // Load or initialize state
  let state: ControllerState;
  if (existsSync(STATE_PATH)) {
    state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } else {
    state = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      intake: [],
      routed: [],
      metaFitness: [],
      dedupIndex: {},
      watermarks: {
        sessionPriming: new Date(0).toISOString(),
        dailyBrief: new Date(0).toISOString(),
        weeklySIL: new Date(0).toISOString(),
      },
    };
  }

  // Expire stale entries
  const now = Date.now();
  state.intake = state.intake.filter((entry) => {
    const age = (now - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
    return age < entry.ttl;
  });

  // Ingest from all sources
  const agentopsEntries = ingestAgentOpsArtifacts(artifactsDir, state);
  const silEntries = ingestSILArtifacts(artifactsDir, state);
  const sessionEntries = ingestSessionLearnings(state);
  const allNew = [...agentopsEntries, ...silEntries, ...sessionEntries];

  console.log(
    `Ingested: ${agentopsEntries.length} AgentOps, ` +
    `${silEntries.length} SIL, ${sessionEntries.length} session`
  );

  // Add to intake queue
  state.intake.push(...allNew);

  // Route
  const newRouted = routeEntries(allNew, state);
  state.routed.push(...newRouted);

  const crossLayer = newRouted.filter((r) => {
    const entry = allNew.find((e) => e.id === r.intakeId);
    if (!entry) return false;
    return r.routedTo.some((dest) => {
      if (entry.source === 'interactive' && dest !== 'session_priming') return true;
      if (entry.source === 'agentops' && dest !== 'daily_brief') return true;
      if (entry.source === 'sil' && dest !== 'weekly_sil') return true;
      return false;
    });
  });

  console.log(
    `Routed: ${newRouted.length} entries, ${crossLayer.length} cross-layer`
  );

  // Update meta-fitness
  const weekKey = getISOWeek(new Date());
  let weekRecord = state.metaFitness.find((r) => r.period === weekKey);
  if (!weekRecord) {
    weekRecord = {
      period: weekKey,
      entriesIngested: 0,
      entriesRouted: 0,
      entriesConsumed: 0,
      entriesExpired: 0,
      crossLayerRoutes: 0,
      feedbackLoopsClosed: 0,
      avgTimeToConsumption: 0,
    };
    state.metaFitness.push(weekRecord);
  }
  weekRecord.entriesIngested += allNew.length;
  weekRecord.entriesRouted += newRouted.length;
  weekRecord.crossLayerRoutes += crossLayer.length;

  // Save
  state.lastUpdated = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log('State saved.');
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 +
      ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

main().catch((err) => {
  console.error('Controller ingest failed:', err);
  process.exit(1);
});
```

#### (C) Session Hook: `controller-prime.sh`

```bash
#!/usr/bin/env bash
# Controller priming hook - runs at session start
# Reads controller state and injects relevant context
set -euo pipefail

input_json=$(cat)

STATE_FILE="controller/state/controller-state.json"
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Extract entries routed to session_priming that haven't been consumed
priming_context=$(jq -r '
  .routed as $routed |
  .intake | map(
    . as $entry |
    select(
      ($routed[] |
        select(.intakeId == $entry.id and
               (.routedTo | index("session_priming")) and
               .consumed == false))
    )
  ) |
  sort_by(.priority) | reverse |
  .[0:5] |
  map("- [\(.source)/\(.type)] \(.topic) (priority: \(.priority))") |
  join("\n")
' "$STATE_FILE" 2>/dev/null || echo "")

if [[ -z "$priming_context" ]]; then
  exit 0
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "ControllerPriming",
    "additionalContext": "\\n--- Controller Context ---\\nRecent cross-layer learnings:\\n${priming_context}\\n---\\n"
  }
}
EOF

exit 0
```

#### Session Learning Capture (extension to `session_end_memory.sh`)

When an agent records a learning during a session, the controller captures it by appending to a local inbox file that the GitHub Action later ingests:

```bash
# Called by session_end_memory.sh or by agent explicitly
append_to_controller_inbox() {
  local topic="$1"
  local summary="$2"
  local priority="${3:-normal}"

  local inbox="controller/state/session-inbox.jsonl"
  mkdir -p "$(dirname "$inbox")"

  jq -cn \
    --arg topic "$topic" \
    --arg summary "$summary" \
    --arg priority "$priority" \
    --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{timestamp: $timestamp, type: "session_learning", topic: $topic,
      summary: $summary, priority: $priority}' \
    >> "$inbox"
}
```

### 6. Integration Points with Existing Systems

#### Into `daily-dev-brief.ts`

The daily brief reads controller seeds before generating proposals. Add a new signal source to `agentops/runner/lib/sources/collect.ts`:

```typescript
// New source in collectSignals()
import { existsSync, readFileSync } from 'fs';

function loadControllerSeeds(): Signal[] {
  const statePath = 'controller/state/controller-state.json';
  if (!existsSync(statePath)) return [];

  const state = JSON.parse(readFileSync(statePath, 'utf-8'));
  const seeds = state.routed
    .filter((r: any) =>
      r.routedTo.includes('daily_brief') && !r.consumed)
    .map((r: any) =>
      state.intake.find((e: any) => e.id === r.intakeId))
    .filter(Boolean);

  return seeds.map((seed: any) => ({
    source: `controller:${seed.source}`,
    title: seed.topic,
    content: JSON.stringify(seed.payload),
    relevance: seed.priority === 'critical' ? 1.0 :
               seed.priority === 'high' ? 0.8 :
               seed.priority === 'normal' ? 0.5 : 0.3,
  }));
}
```

#### Into `AutonomousImprovementLoop` (SIL-010)

The SIL discovery phase reads controller seeds. Add to the `discover()` method in `src/improvement/loop.ts`:

```typescript
private loadControllerSeeds(): Discovery[] {
  const statePath = 'controller/state/controller-state.json';
  if (!existsSync(statePath)) return [];

  const state = JSON.parse(readFileSync(statePath, 'utf-8'));
  return state.routed
    .filter((r: any) =>
      r.routedTo.includes('weekly_sil') && !r.consumed)
    .map((r: any) => {
      const entry = state.intake.find((e: any) => e.id === r.intakeId);
      if (!entry) return null;
      return {
        id: entry.id,
        title: entry.topic,
        summary: JSON.stringify(entry.payload),
        source: `controller:${entry.source}`,
        relevanceScore: entry.priority === 'critical' ? 1.0 :
                        entry.priority === 'high' ? 0.8 : 0.5,
      };
    })
    .filter(Boolean);
}
```

Seeded discoveries from `agentops_proposal` entries that have been human-approved skip the Filter phase (they were already validated) and go directly to Experiment.

#### Into Session Start Hook

Add to `session_start.sh` after existing context loading:

```bash
# Controller priming
if [[ -f "controller/state/controller-state.json" ]]; then
  controller_context=$(bash .claude/hooks/controller-prime.sh \
    <<< "$input_json" 2>/dev/null || true)
  if [[ -n "$controller_context" ]]; then
    context+="$controller_context"
  fi
fi
```

### 7. Meta-Fitness Tracking

The controller evaluates its own effectiveness. This is not cosmetic -- it determines whether the routing rules are working.

#### Metrics

| Metric | Formula | Target | Action if Below |
|--------|---------|--------|-----------------|
| **Routing Rate** | `entriesRouted / entriesIngested` | > 0.8 | Check dedup is not over-aggressive |
| **Consumption Rate** | `entriesConsumed / entriesRouted` | > 0.5 | Check if consumers are reading seeds |
| **Cross-Layer Rate** | `crossLayerRoutes / entriesRouted` | > 0.3 | The whole point; if low, routing rules need tuning |
| **Feedback Loop Closure** | `feedbackLoopsClosed / entriesIngested` | > 0.1 | Track full cycles: learning -> applied -> verified |
| **Time to Consumption** | `avg(consumedAt - routedAt)` | < 48 hours | Entries are stale before being used |
| **Expiration Rate** | `entriesExpired / entriesIngested` | < 0.3 | Too many entries dying unused |

#### Weekly Self-Assessment

The controller-sync workflow includes a step that computes meta-fitness and, if metrics are below target, creates a GitHub issue with a structured report:

```typescript
function assessMetaFitness(state: ControllerState): Assessment {
  const current = state.metaFitness[state.metaFitness.length - 1];
  if (!current) return { healthy: true, issues: [] };

  const issues: string[] = [];

  if (current.entriesIngested > 0) {
    const routingRate = current.entriesRouted / current.entriesIngested;
    if (routingRate < 0.8) {
      issues.push(
        `Routing rate ${(routingRate * 100).toFixed(0)}% < 80% target`
      );
    }

    const crossLayerRate =
      current.crossLayerRoutes / Math.max(current.entriesRouted, 1);
    if (crossLayerRate < 0.3 && current.entriesRouted > 5) {
      issues.push(
        `Cross-layer rate ${(crossLayerRate * 100).toFixed(0)}% < 30% target`
      );
    }

    const consumptionRate =
      current.entriesConsumed / Math.max(current.entriesRouted, 1);
    if (consumptionRate < 0.5 && current.entriesRouted > 10) {
      issues.push(
        `Consumption rate ${(consumptionRate * 100).toFixed(0)}% < 50% target`
      );
    }
  }

  return { healthy: issues.length === 0, issues };
}
```

When `healthy === false` for 2 consecutive weeks, the workflow creates a GitHub issue tagged `controller-health` with the Situation / Impact / Options / Recommendation format from the escalation protocol.

### 8. Escalation Thresholds

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Same topic from all 3 layers in 7 days | Automatic | Create GitHub issue tagged `controller-escalation` with structured decision request |
| Cross-layer rate < 10% for 2 consecutive weeks | Automatic | Escalate: routing rules ineffective, need recalibration |
| Consumption rate < 20% for 2 consecutive weeks | Automatic | Escalate: consumers not reading seeds, integration may be broken |
| Intake queue > 100 unrouted entries | Automatic | Purge by TTL, escalate if still > 50 |
| Meta-fitness declining for 3 consecutive weeks | Automatic | Create issue: "Controller effectiveness declining" with trend data |
| Controller-sync workflow failure 3 consecutive times | Automatic | Alert via GitHub Actions notification |

---

## State Machine Transitions

```
                         +---------+
                         |  IDLE   |
                         +----+----+
                              | trigger (cron, workflow_run, hook)
                              v
                    +------------------+
                    |     INGESTING    |
                    |                  |
                    | Read artifacts   |
                    | Parse entries    |
                    | Check inbox      |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |     DEDUPING     |
                    |                  |
                    | Normalize topics |
                    | Check index      |
                    | Merge duplicates |
                    | Escalate if 3+   |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |     ROUTING      |
                    |                  |
                    | Apply rules      |
                    | Set destinations |
                    | Update watermarks|
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |   HOUSEKEEPING   |
                    |                  |
                    | Expire stale     |
                    | Compute fitness  |
                    | Escalate if bad  |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |     PERSIST      |
                    |                  |
                    | Write state      |
                    | Commit if GHA    |
                    +--------+---------+
                             |
                             v
                         +---------+
                         |  IDLE   |
                         +---------+
```

The state machine runs synchronously within a single invocation. There is no long-running process. Each trigger (cron, workflow completion, session hook) runs the full cycle and returns.

### Never-Idle Property: QD Exploration Fallback

The state machine as described above returns to IDLE after each cycle. In headless mode (running as the `loop-controller.ts` outer loop), IDLE is not a terminal state. When the controller finds no pending work, it enters **exploration mode** using the research-taste QD workflow library (`research-workflows/workflows.db`).

```
IDLE (headless mode)
  │
  ├── Check backlog:
  │   ├─ bd ready → any ready issues?
  │   ├─ .assumptions/registry.jsonl → any stale assumptions?
  │   ├─ .eval/metrics/ → regression sentinel says healthy?
  │   └─ intake queue → any pending entries?
  │
  ├── IF work found → DISPATCH to appropriate agent
  │   (triage-fix, hook-health, dependency-verifier,
  │    assumption-auditor, coordination-momentum,
  │    cost-governor, verification-judge, regression-sentinel)
  │
  └── IF backlog empty → EXPLORE
      │
      ├── Select workflow from MAP-Elites grid:
      │   1. Unexplored niches first (times_used = 0)
      │   2. Then under-tested high-potential (low times_used/fitness ratio)
      │   3. 5D grid: scope × domain_structure × evidence_type ×
      │      time_horizon × fidelity
      │
      ├── Run research-taste with selected workflow as strategy
      │   The research-taste agent's Landscape Assessment, Prediction
      │   Query, and Cross-Pollination Check are guided by the workflow
      │   archetype (exploratory, confirmatory, analytical, generative,
      │   applied) and behavioral coordinates.
      │
      ├── Record outcome:
      │   - INSERT INTO taste_evaluations (...) VALUES (...)
      │   - INSERT INTO executions (...) VALUES (...)
      │   - UPDATE workflows SET fitness_score = EMA(old, result),
      │     times_used = times_used + 1
      │
      ├── IF verdict = "proceed":
      │   → bd create --title="[QD-discovered] ..." --type=task
      │   → Loop back to CHECK BACKLOG (new issue is now ready)
      │
      ├── IF verdict = "defer" or "kill":
      │   → Update fitness_score (lower for kill, neutral for defer)
      │   → Select next niche and try again
      │
      └── Budget gate:
          - Exploration has its own ceiling (default $5/day)
          - cost-governor agent enforces aggregate limits
          - When exhausted → SLEEP until next trigger
```

**The key property**: The system never asks "what should I do?" It always has a next action. Work items take priority. When the backlog is clear, the system explores using diverse QD strategies. When exploration finds something worth pursuing, it becomes backlog. The loop is self-sustaining.

**Workflow fitness evolution**: Each exploration run updates the MAP-Elites grid. Workflows that consistently produce "proceed" verdicts gain fitness. Workflows that consistently produce "kill" verdicts lose fitness. But because the selection strategy favors unexplored niches (not just high-fitness workflows), the system maintains behavioral diversity — it doesn't collapse to always running the same exploration strategy.

**Integration with existing QD infrastructure**: The `research-workflows/workflows.db` already contains 11 seed workflows across 5 archetypes and a 5D behavioral grid (3,125 potential niches). The exploration mode provides the selection pressure that the MAP-Elites algorithm needs to evolve the workflow population.

---

## File Inventory

### New Files

| File | Purpose |
|------|---------|
| `controller/types.ts` | TypeScript type definitions for the controller |
| `controller/ingest.ts` | Core intake, dedup, and routing logic |
| `controller/state/controller-state.json` | Persistent state (committed to `controller-state` branch) |
| `controller/state/session-inbox.jsonl` | Local inbox for session learnings (gitignored) |
| `.github/workflows/controller-sync.yml` | Scheduled sync workflow |
| `.claude/hooks/controller-prime.sh` | Session priming hook |
| `controller/ingest.test.ts` | Unit tests for ingest and routing logic |

### Modified Files

| File | Change |
|------|--------|
| `.claude/hooks/session_start.sh` | Add controller priming integration |
| `.claude/hooks/session_end_memory.sh` | Add `append_to_controller_inbox` function call |
| `agentops/runner/lib/sources/collect.ts` | Add `loadControllerSeeds()` as internal signal source |
| `.specs/self-improvement-loop/SPEC-SIL-010-main-loop-orchestrator.md` | Document controller seed integration in discovery phase |
| `.gitignore` | Add `controller/state/session-inbox.jsonl` |

---

## Acceptance Criteria

- [ ] `controller/ingest.ts` parses AgentOps `proposals.json` artifacts into `IntakeEntry` format
- [ ] `controller/ingest.ts` parses SIL `improvement-results.json` artifacts into `IntakeEntry` format
- [ ] `controller/ingest.ts` reads `session-inbox.jsonl` for interactive session learnings
- [ ] Dedup correctly identifies same-topic entries across layers (Jaccard > 0.7)
- [ ] Routing rules direct entries to correct consumers per the routing table
- [ ] Cross-layer convergence escalates priority
- [ ] `controller-sync.yml` runs on schedule and on workflow completion
- [ ] `controller-prime.sh` injects top-5 priming entries into session context
- [ ] `daily-dev-brief.ts` reads controller seeds before generating proposals
- [ ] SIL discovery phase reads controller seeds
- [ ] Entries expire after their TTL
- [ ] Meta-fitness metrics are computed per week
- [ ] Escalation issues are created when thresholds are breached
- [ ] State file is committed to `controller-state` branch after each sync
- [ ] Full round-trip test: session learning -> controller intake -> daily brief seed -> proposal references the learning

---

## Test Plan

### Unit Tests (`controller/ingest.test.ts`)

```typescript
describe('Ingest', () => {
  it('parses AgentOps proposals.json into IntakeEntries');
  it('parses SIL improvement-results.json into IntakeEntries');
  it('reads session-inbox.jsonl and truncates after read');
  it('ignores missing artifact directories gracefully');
  it('handles malformed JSON lines in session inbox');
});

describe('Dedup', () => {
  it('merges entries with normalized topic match');
  it('escalates priority on cross-layer convergence (2 layers)');
  it('marks entries as critical when all 3 layers converge');
  it('does not merge entries with different topics');
});

describe('Routing', () => {
  it('routes session_learning to daily_brief and session_priming');
  it('routes sil_improvement to session_priming and daily_brief');
  it('routes agentops_proposal to session_priming and weekly_sil');
  it('routes sil_failure to daily_brief only (stepping stones)');
  it('does not route expired entries');
});

describe('MetaFitness', () => {
  it('computes weekly metrics from routed/consumed counts');
  it('detects declining cross-layer rate across weeks');
  it('creates new period record when week changes');
});

describe('normalizeTopic', () => {
  it('lowercases and strips punctuation');
  it('removes stop words');
  it('truncates to 80 characters');
  it('handles empty string');
});
```

### Integration Tests

1. **Fixture-based round trip**: Create fixture `proposals.json` and `improvement-results.json` in a temporary `artifacts/` directory, run ingest, verify state file contains routed entries for all three consumers.

2. **Session hook integration**: Append a learning to `session-inbox.jsonl`, run ingest, verify it appears in controller state routed to `daily_brief`.

3. **Priming extraction**: Populate state with routed entries, run `controller-prime.sh`, verify hookSpecificOutput contains expected entries.

### Manual Verification

1. Run `controller-sync.yml` via `workflow_dispatch`, verify it downloads artifacts and produces state.
2. Start a Claude Code session, verify controller priming appears in session context.
3. Run daily brief, verify controller seeds appear in signal collection.

---

## Risks and Mitigations

### Risk 1: Signal Noise

**Threat**: Sessions emit too many low-quality entries, overwhelming daily synthesis.

**Mitigation**: Cap at 10 entries per session. Only emit from sessions with >= 5 turns. Filter by configurable relevance threshold (default 0.5). Meta-fitness monitors consumption rate as a proxy for signal quality.

### Risk 2: State File Growth

**Threat**: `controller-state.json` grows indefinitely.

**Mitigation**: Entries expire by TTL (default 7 days, up to 28 for scorecards). The housekeeping phase prunes expired entries from both `intake` and `routed` arrays. Dedup index entries older than 90 days are deleted. At expected volumes (~50 entries/week), the state file stays under 100KB.

### Risk 3: Circular Signal Amplification

**Threat**: A learning emitted by the fast loop is consumed by the medium loop, which generates a proposal that seeds the slow loop, which implements a change that feeds back to the fast loop, creating runaway amplification.

**Mitigation**: Entries carry their `source` field. The dedup index tracks `sources[]` per topic. If the same topic re-enters from a different layer, it is merged (not duplicated). The priority escalation has a ceiling (`critical`). The SIL checks `git log` for recent changes to target files before attempting implementation, preventing double-work.

### Risk 4: Hook Reliability

**Threat**: `session_end_memory.sh` modification or `controller-prime.sh` fails silently.

**Mitigation**: All hook code wraps in try/catch and exits 0 on any error. Hooks must never break the main session. The meta-fitness tracker monitors `session_learnings_captured` per week. If it drops to 0 for 3+ days, it flags a potential hook failure.

### Risk 5: Controller-State Branch Divergence

**Threat**: The `controller-state` branch drifts from `main`, complicating merges.

**Mitigation**: Only `controller/state/controller-state.json` lives on this branch, never code. The branch is auto-committed by the workflow. It can be deleted and recreated at any time without data loss (state rebuilds from artifacts on next sync). Alternative: use the main branch with a gitignored state file and let the GitHub Action commit to main directly. Decision deferred to implementation.

---

## Open Questions

1. **Branch vs. main for state commits**: Using a dedicated `controller-state` branch avoids polluting main with frequent state commits. The tradeoff is that interactive hooks need to fetch from this branch to read state. Alternative: commit state to main on a low-frequency cadence (daily). The local `session-inbox.jsonl` handles the real-time path.

2. **Jaccard threshold for dedup**: 0.7 is a starting point. Depends on how topics are distributed in practice. Too aggressive = entries deduped incorrectly (routing rate drops). Too loose = duplicate entries proliferate (noise). The meta-fitness tracker surfaces both failure modes.

3. **Session inbox durability**: `session-inbox.jsonl` is local and gitignored. If the machine reboots between session end and next controller sync, entries are lost. Acceptable for v1. Consider writing to Thoughtbox MCP as a durable alternative in v2.

4. **Coordination with 02-knowledge-accumulation-layer**: If the knowledge accumulation layer provides a unified query API, the controller could use it instead of directly reading artifacts. This is a soft dependency -- the controller works without it but gains richer context with it.

---

## References

- [00-overview.md](./00-overview.md) -- System architecture and gap analysis
- `.specs/self-improvement-loop/README.md` -- SIL architecture (21 specs, dependency graph)
- `.specs/self-improvement-loop/SPEC-SIL-010-main-loop-orchestrator.md` -- `AutonomousImprovementLoop` class
- `.specs/self-improvement-loop/SPEC-SIL-011-github-actions-workflow.md` -- SIL GitHub Actions workflow
- `.specs/self-improvement-loop/SPEC-SIL-ARCH-agent-invocation.md` -- Agent invocation modes (Mode 1: GitHub Actions, Mode 2: Claude Code)
- `agentops/runner/daily-dev-brief.ts` -- AgentOps daily brief (signal collection, LLM synthesis, issue creation)
- `.github/workflows/agentops_daily_thoughtbox_dev.yml` -- AgentOps daily workflow (cron: 11:30 UTC)
- `.github/workflows/agentops_on_approval_label.yml` -- Proposal approval workflow (label-triggered)
- `.github/workflows/self-improvement-loop.yml` -- SIL weekly workflow (cron: Sunday 02:00 UTC)
- `.claude/hooks/session_start.sh` -- Session start hook (context loading, git info, issue list)
- `.claude/hooks/session_end_memory.sh` -- Session end hook (learning capture prompt)
- `.claude/hooks/stop.sh` -- LangSmith tracing hook (trace per response)
- `.claude/commands/loops/meta/loop-interface.md` -- OODA loop interface contract (typed I/O, signals, composition)
- `.claude/commands/specifications/spec-orchestrator.md` -- OR-informed spec orchestration
- `agentic-dev-team/agentic-dev-team-spec.md` -- Agent team roles and escalation thresholds
- `.claude/rules/continual-calibration.md` -- Freshness tags (HOT/WARM/COLD), fitness tracking
- `.claude/rules/escalation-protocol.md` -- Structured escalation format
- Carlini C compiler approach -- "while true" outer loop with accumulated context replacing synchronous human oversight with asynchronous test-driven feedback

---

*Generated: 2026-02-11*
*Context: Continual Self-Improvement System, Spec 01 of 9*
