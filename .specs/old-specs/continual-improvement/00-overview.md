# Continual Self-Improvement System: Architecture Overview

**Status**: Draft v0.1
**Generated**: 2026-02-11
**Context**: Thoughtbox Engineering System — Kastalien Research

---

## Vision

A development system where every session — interactive, scheduled, or event-driven — contributes to a compounding improvement cycle. The system learns from its own operation, evolves its patterns through empirical fitness, maintains continuity across context boundaries, and coordinates specialized agents to absorb the costs a solo founder currently handles in series.

The vision is not a single loop but a **system of loops** operating at different timescales, sharing a unified knowledge layer, and governed by escalation thresholds that keep a human in the decision seat while the system handles diligence.

---

## What Already Exists

### Three Execution Layers

| Layer | Mechanism | Timescale | State |
|-------|-----------|-----------|-------|
| **Interactive** | Claude Code CLI with skills, commands, hooks, rules | Minutes-hours | Session memory, MEMORY.md, Beads issues |
| **Headless** | Agent SDK scripts (SIL-006, SIL-010, daily-dev-brief) | Minutes-hours | Run artifacts, LangSmith traces |
| **Scheduled** | GitHub Actions (15 workflows) | Daily/Weekly/Event | GitHub artifacts, issue state, PR state |

### Two Improvement Loops (Currently Independent)

1. **SIL (Self-Improvement Loop)**: Weekly automated cycle. Discovery → Filter → Experiment → Evaluate. 21 specs, 16 implemented, 3 not started. Budget-controlled, creates PRs for human review.

2. **AgentOps (Daily Dev Brief)**: Daily proposal generation from ecosystem signals (arXiv, RSS, GitHub). Creates GitHub issues. Human applies labels to approve implementation. SMOKE/REAL mode separation.

### Persistent State Mechanisms

| Store | Type | What It Holds | Searchable? |
|-------|------|---------------|-------------|
| **MEMORY.md** | Flat file | Agent learnings, gotchas, project structure | Grep only |
| **Thoughtbox** | MCP server (knowledge graph) | Entities, relations, observations | Structured queries |
| **Beads** | SQLite + JSONL | Issue tracking, dependencies, status | CLI queries |
| **Git history** | Commits, branches, PRs | Code evolution, decisions | git log |
| **LangSmith** | Cloud traces | Run telemetry, cost tracking | Dashboard |
| **DGM metadata** | Planned (not yet implemented) | Pattern fitness, evolution tracking | N/A |
| **Observatory** | In-memory + REST API | Hub events, session activity | REST endpoints |

### Multi-Agent Coordination

- **Thoughtbox Hub**: Workspaces, problems (with dependencies), proposals (with reviews), consensus, channels. Structured dialectic (CLAIM/REFUTE/SYNTHESIS).
- **Agent Teams**: Claude Code native spawning. Leader + teammates. Task-based coordination with dependencies. Inbox messaging.
- **Compound Engineering**: Plugin from Every. Swarm orchestration, specialized reviewer agents, research agents.

### Cognitive Architecture

- **OODA Loops**: 15+ composable loop building blocks across 5 categories (exploration, authoring, refinement, verification, orchestration). Standard loop interface contract with typed I/O, signals, composition rules.
- **DGM/CycleQD**: Pattern evolution through empirical fitness. Quality-diversity for maintaining specialist populations. Niche grids. Cyclic quality focus rotation.
- **HDD (Hypothesis-Driven Development)**: Research → Staging ADR → Implementation → Validation → Decision.
- **Spec Orchestrator**: OR-informed multi-spec implementation with dependency graphs, spiral detection, commitment levels, MCDA evaluation.

### Governance & Safety

- CODEOWNERS enforcement for governance files
- Workflow Guard prevents governance drift
- Escalation protocol with structured decision requests
- Human-in-the-loop gates at every irreversible boundary
- Spiral detection with commitment level circuit breakers

---

## What's Missing: The Gap Analysis

### Gap 1: No Unified Loop Controller
The SIL, AgentOps, and interactive sessions operate independently. Daily proposals don't feed into the weekly SIL. SIL discoveries don't inform AgentOps signal collection. Interactive session learnings don't systematically enter either pipeline.

**Spec**: [01-unified-loop-controller.md](./01-unified-loop-controller.md)

### Gap 2: Fragmented Knowledge Accumulation
Knowledge is spread across 6+ stores with no cross-referencing. A pattern discovered in MEMORY.md can't be queried alongside Thoughtbox entities or Beads issues. There's no unified "what does the system know?" query.

**Spec**: [02-knowledge-accumulation-layer.md](./02-knowledge-accumulation-layer.md)

### Gap 3: Manual Pattern Evolution
The DGM/CycleQD architecture is fully designed in commands but never runs automatically. Fitness tracking, mutation generation, and pruning all require manual `/dgm-evolve` invocation. The evolution tracking files (lineage.json, fitness.json) don't exist.

**Spec**: [03-automated-pattern-evolution.md](./03-automated-pattern-evolution.md)

### Gap 4: Context Loss Across Sessions
Each session starts from MEMORY.md + git status. There's no structured handoff protocol. The previous session's reasoning chains, hypotheses, and partial conclusions are lost. The Observatory session store is in-memory only.

**Spec**: [04-cross-session-continuity.md](./04-cross-session-continuity.md)

### Gap 5: Stubbed Evaluation Harness
The evaluation harness in AgentOps is documented but not implemented. There's no A/B testing, no regression benchmarks, no way to measure whether an improvement actually improved anything. LangSmith integration is optional and not wired to decision gates.

**Spec**: [05-evaluation-harness.md](./05-evaluation-harness.md)

### Gap 6: Ad-Hoc Agent Team Orchestration
The agentic-dev-team-spec defines 4 roles but they're not implemented as persistent agents. The Hub ↔ Agent Teams integration is ad-hoc (manual spawn prompts). There's no way to spin up the full engineering system on demand.

**Spec**: [06-agent-team-orchestration.md](./06-agent-team-orchestration.md)

### Gap 7: No Assumption Registry
The research-reality agent role identifies the need to track assumptions about external dependencies, but the persistent assumption registry doesn't exist. External dependency failures continue to be the most costly recurring failure mode.

**Spec**: [07-assumption-registry.md](./07-assumption-registry.md)

### Gap 8: Compound Engineering Not Integrated
The Every plugin provides powerful review agents, research agents, and swarm orchestration, but they aren't wired into the SIL or AgentOps pipelines. They're available but unused by the improvement loops.

**Spec**: [08-compound-integration.md](./08-compound-integration.md)

---

## Architecture: How It All Connects

```
                        ┌─────────────────────────────────────┐
                        │          CHIEF AGENTIC (Human)       │
                        │  Escalations ↑         ↓ Decisions   │
                        └──────────┬──────────────┬────────────┘
                                   │              │
                    ┌──────────────┴──────────────┴──────────────┐
                    │         UNIFIED LOOP CONTROLLER             │
                    │                                             │
                    │  Coordinates timescales:                    │
                    │  - Fast (interactive sessions)              │
                    │  - Medium (daily AgentOps)                  │
                    │  - Slow (weekly SIL)                        │
                    │                                             │
                    │  Feeds knowledge between loops              │
                    │  Tracks meta-fitness of the system itself   │
                    └─────┬────────┬────────┬────────┬───────────┘
                          │        │        │        │
                ┌─────────┴──┐ ┌───┴────┐ ┌─┴──────┐ │
                │ Interactive│ │AgentOps│ │  SIL   │ │
                │  Sessions  │ │ Daily  │ │ Weekly │ │
                │            │ │        │ │        │ │
                │ Skills     │ │Signals │ │Discover│ │
                │ Commands   │ │Propose │ │Filter  │ │
                │ Hooks      │ │Approve │ │Exprmnt │ │
                │ Agent Teams│ │Implmnt │ │Evaluat │ │
                └──────┬─────┘ └───┬────┘ └───┬────┘ │
                       │           │           │      │
                       └───────────┴───────────┴──────┘
                                   │
                    ┌──────────────┴──────────────────┐
                    │    KNOWLEDGE ACCUMULATION LAYER  │
                    │                                  │
                    │  Unified query across:           │
                    │  - MEMORY.md (agent memory)      │
                    │  - Thoughtbox (knowledge graph)  │
                    │  - Beads (issue tracking)        │
                    │  - Git history (code evolution)  │
                    │  - DGM fitness (pattern health)  │
                    │  - Assumption registry            │
                    │  - LangSmith (run telemetry)     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────────┐
                    │    AUTOMATED PATTERN EVOLUTION   │
                    │                                  │
                    │  DGM fitness tracking (automatic)│
                    │  CycleQD niche competition       │
                    │  Mutation generation              │
                    │  Stepping stone preservation      │
                    │  Cross-session promotion/demotion │
                    └─────────────────────────────────┘
```

---

## Design Principles

1. **Empirical over theoretical**: Patterns survive because they work, not because they were proven correct (DGM principle).

2. **Escalation over autonomy**: The system handles diligence; the human handles judgment. Every irreversible action requires explicit approval.

3. **Loops over procedures**: All work follows OODA cycles at appropriate timescales. Loops compose but don't nest deeper than 3 levels.

4. **Persistence over memory**: Every valuable observation gets stored where it can be queried later. In-memory state is assumed to be lost.

5. **Diversity over convergence**: CycleQD ensures the system maintains a diverse population of patterns, not a monoculture (niche grid coverage).

6. **Stepping stones over waste**: Failed approaches are archived, not deleted. They may seed future breakthroughs.

7. **Structured over natural language**: Inter-agent communication uses typed message schemas, not prose. Escalations present options, not open questions.

---

## Implementation Strategy

See [09-implementation-plan.md](./09-implementation-plan.md) for the phased plan.

**Phase 0 (Week 1)**: Foundation — Knowledge accumulation layer, cross-session continuity, assumption registry bootstrap.

**Phase 1 (Weeks 2-3)**: Automation — Automated pattern evolution, evaluation harness activation.

**Phase 2 (Weeks 3-4)**: Integration — Unified loop controller, compound engineering integration.

**Phase 3 (Weeks 4-5)**: Orchestration — Agent team orchestration, full engineering system on-demand.

**Phase 4 (Ongoing)**: Calibration — The system calibrates itself. Patterns that help survive. Patterns that don't fade. The niche grid fills. The assumption registry grows. The evaluation harness catches regressions. The loops tighten.
